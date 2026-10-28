const express = require("express");
const path = require("path");
const connectDB = require("./config/db");
require("dotenv").config();

const Club = require("./models/Club");
const session = require("express-session");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const ClubRequest = require("./models/ClubRequest");

const app = express();
const PORT = 3000;

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

// Current user available in EJS templates
app.use(async (req, res, next) => {
  try {
    res.locals.currentUser = req.session?.userId
      ? {
          id: req.session.userId,
          name: req.session.userName,
          role: req.session.role,
          displayRole:
            req.session.role === "admin" ? "Admin" : "Student"
        }
      : null;

    // Fetch the logged-in user's approved club membership
    if (
      res.locals.currentUser &&
      req.session.role !== "admin"
    ) {
      const membership = await ClubRequest.findOne({
        student: req.session.userId,
        status: "approved",
        clubRole: { $exists: true, $nin: ["", null] }
      })
        .sort({ createdAt: 1 })
        .select("clubRole");

      if (membership?.clubRole) {
        const role = membership.clubRole.trim();

        res.locals.currentUser.displayRole =
          role.toLowerCase() === "member"
            ? "Club Member"
            : role;
      }
    }

    next();
  } catch (error) {
    console.error("Navbar user role error:", error);
    next(error);
  }
});
// Authentication middleware
function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect("/login");
  }

  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect("/login");
  }

  if (req.session.role !== "admin") {
    return res.status(403).send(
      "Access denied: Admin permission required."
    );
  }

  next();
}

// Admin can edit every club.
// Approved Presidents and Coordinators can edit only their own club.
async function requireClubEditor(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.redirect("/login");
    }

    if (req.session.role === "admin") {
      return next();
    }

    const club = await Club.findOne({
      slug: req.params.slug
    });

    if (!club) {
      return res.status(404).send("Club not found.");
    }

    const membership = await ClubRequest.findOne({
      student: req.session.userId,
      club: club._id,
      status: "approved",
      clubRole: {
        $in: ["President", "Coordinator"]
      }
    });

    if (!membership) {
      return res.status(403).send(
        "Access denied: Only this club's President or Coordinator can edit it."
      );
    }

    req.clubToEdit = club;
    next();
  } catch (error) {
    console.error(
      "Club editor permission check failed:",
      error.message
    );

    return res.status(500).send(
      "Unable to verify club editing permissions."
    );
  }
}

// ==============================
// REGISTER
// ==============================

app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/register", async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const branch = req.body.branch?.trim();
    const year = req.body.year;
    const phone = req.body.phone?.trim() || "";
    const showPhone = req.body.showPhone === "yes";

    const allowedYears = [
      "1st Year",
      "2nd Year",
      "3rd Year",
      "4th Year"
    ];

    const phonePattern = /^[0-9+\-\s()]{7,20}$/;

    if (
      !name ||
      name.length > 80 ||
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72 ||
      !branch ||
      branch.length > 100 ||
      !allowedYears.includes(year) ||
      (phone && !phonePattern.test(phone)) ||
      (showPhone && !phone)
    ) {
      return res.status(400).render("register", {
        error:
          "Please enter valid details for all fields. A valid phone number is required if you choose to display it."
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).render("register", {
        error: "An account with this email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email,
      password: hashedPassword,
      branch,
      year,
      phone,
      showPhone,
      role: "student"
    });

    res.redirect("/login");
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).render("register", {
        error: "An account with this email already exists."
      });
    }

    console.error("Registration failed:", error.message);

    res.status(500).render("register", {
      error: "Unable to create account right now."
    });
  }
});

// ==============================
// LOGIN
// ==============================

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (
      !email ||
      typeof password !== "string" ||
      password.length === 0 ||
      password.length > 72
    ) {
      return res.status(400).render("login", {
        error: "Enter a valid email and password."
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (
      !user ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).render("login", {
        error: "Invalid email or password."
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error("Session error:", err.message);
        return res.status(500).send("Unable to start session.");
      }

      req.session.userId = user._id.toString();
      req.session.role = user.role;
      req.session.userName = user.name;

      res.redirect("/");
    });
  } catch (error) {
    console.error("Login failed:", error.message);

    res.status(500).render("login", {
      error: "Unable to log in right now."
    });
  }
});

// ==============================
// LOGOUT
// ==============================

app.post("/logout", (req, res) => {
  if (!req.session) {
    return res.redirect("/login");
  }

  req.session.destroy((error) => {
    if (error) {
      console.error("Logout failed:", error.message);
      return res.status(500).send("Unable to log out right now.");
    }

    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});

// ==============================
// HOME
// ==============================

app.get("/", (req, res) => {
  res.render("home");
});

// ==============================
// ALL CLUBS
// ==============================

app.get("/clubs", async (req, res) => {
  try {
    const clubs = await Club.find().sort({ name: 1 });

    let editableClubIds = [];

    // Admin can edit every club.
    if (req.session.role === "admin") {
      editableClubIds = clubs.map((club) => club._id.toString());
    } else if (req.session.userId) {
      // Find clubs where the logged-in user is
      // an approved President or Coordinator.
      const memberships = await ClubRequest.find({
        student: req.session.userId,
        status: "approved",
        clubRole: { $in: ["President", "Coordinator"] }
      }).select("club");

      editableClubIds = memberships.map(
        (membership) => membership.club.toString()
      );
    }

    res.render("clubs", {
      clubs,
      editableClubIds,
      currentUser: req.session.userId
        ? {
            id: req.session.userId,
            role: req.session.role
          }
        : null
    });
  } catch (error) {
    console.error("Failed to fetch clubs:", error.message);
    res.status(500).send("Unable to load clubs right now.");
  }
});

// ==============================
// CLUB MEMBERS
// IMPORTANT: Keep this route BEFORE /clubs/:slug
// Only Admin can view the members page.
// ==============================

app.get(
  "/clubs/:slug/members",
  
  async (req, res) => {
    try {
      const club = await Club.findOne({
        slug: req.params.slug
      });

      if (!club) {
        return res.status(404).send("Club not found.");
      }

      const memberships = await ClubRequest.find({
        club: club._id,
        status: "approved"
      })
        .populate("student", "name branch year phone showPhone")
        .sort({ clubRole: 1, createdAt: 1 });

      const members = memberships.filter(
        (membership) => membership.student
      );

      res.render("club-members", {
        club,
        members
      });
    } catch (error) {
      console.error(
        "Unable to load club members:",
        error.message
      );

      res.status(500).send(
        "Unable to load club members right now."
      );
    }
  }
);


/* ==============================
   ADMIN: MANAGE CLUB MEMBERS
============================== */

// Open Manage Members page
app.get(
  "/admin/clubs/:slug/members",
  requireLogin,
  requireAdmin,
  async (req, res) => {
    try {
      const club = await Club.findOne({
        slug: req.params.slug
      });

      if (!club) {
        return res.status(404).send("Club not found.");
      }

      const memberships = await ClubRequest.find({
        club: club._id,
        status: "approved"
      })
        .populate("student", "name email branch year")
        .sort({ clubRole: 1, createdAt: 1 });

      const members = memberships.filter(
        (membership) => membership.student
      );

      res.render("admin/manage-members", {
        club,
        members,
        error: null,
        success: null
      });
    } catch (error) {
      console.error("Manage members error:", error.message);
      res.status(500).send("Unable to load Manage Members page.");
    }
  }
);

// Add a registered student to the club
app.post(
  "/admin/clubs/:slug/members",
  requireLogin,
  requireAdmin,
  async (req, res) => {
    try {
      const club = await Club.findOne({
        slug: req.params.slug
      });

      if (!club) {
        return res.status(404).send("Club not found.");
      }

      const email = req.body.email?.trim().toLowerCase();
      const clubRole = req.body.clubRole;

      const allowedRoles = [
        "President",
        "Vice President",
        "Secretary",
        "Joint Secretary",
        "Coordinator",
        "Member"
      ];

      if (!email || !allowedRoles.includes(clubRole)) {
        return res.status(400).send(
          "Please enter a valid email and club role."
        );
      }

      const student = await User.findOne({
        email,
        role: "student"
      });

      if (!student) {
        return res.status(404).send(
          "No registered student found with this email. Ask the student to register first."
        );
      }

      let membership = await ClubRequest.findOne({
        student: student._id,
        club: club._id
      });

      if (membership && membership.status === "approved") {
        return res.status(409).send(
          "This student is already a member of this club."
        );
      }

      if (membership) {
        membership.status = "approved";
        membership.clubRole = clubRole;
        await membership.save();
      } else {
        await ClubRequest.create({
          student: student._id,
          club: club._id,
          status: "approved",
          clubRole
        });
      }

      return res.redirect(
        `/admin/clubs/${encodeURIComponent(club.slug)}/members`
      );
    } catch (error) {
      console.error("Adding club member failed:", error.message);

      if (error.code === 11000) {
        return res.status(409).send(
          "This student already has a membership record for this club."
        );
      }

      res.status(500).send("Unable to add club member.");
    }
  }
);


/* ==============================
   ADMIN: UPDATE MEMBER ROLE
============================== */

app.post(
  "/admin/clubs/:slug/members/:membershipId/role",
  requireLogin,
  requireAdmin,
  async (req, res) => {
    try {
      const club = await Club.findOne({
        slug: req.params.slug
      });

      if (!club) {
        return res.status(404).send("Club not found.");
      }

      const allowedRoles = [
        "President",
        "Vice President",
        "Secretary",
        "Joint Secretary",
        "Coordinator",
        "Member"
      ];

      const { clubRole } = req.body;

      if (!allowedRoles.includes(clubRole)) {
        return res.status(400).send("Invalid club role.");
      }

      const membership = await ClubRequest.findOne({
        _id: req.params.membershipId,
        club: club._id,
        status: "approved"
      });

      if (!membership) {
        return res.status(404).send(
          "Approved membership not found."
        );
      }

      membership.clubRole = clubRole;
      await membership.save();

      res.redirect(
        `/admin/clubs/${encodeURIComponent(club.slug)}/members`
      );
    } catch (error) {
      console.error("Role update failed:", error.message);
      res.status(500).send("Unable to update member role.");
    }
  }
);

/* ==============================
   ADMIN: REMOVE CLUB MEMBER
============================== */

app.post(
  "/admin/clubs/:slug/members/:membershipId/remove",
  requireLogin,
  requireAdmin,
  async (req, res) => {
    try {
      const club = await Club.findOne({
        slug: req.params.slug
      });

      if (!club) {
        return res.status(404).send("Club not found.");
      }

      const membership = await ClubRequest.findOne({
        _id: req.params.membershipId,
        club: club._id,
        status: "approved"
      });

      if (!membership) {
        return res.status(404).send(
          "Approved membership not found."
        );
      }

      await ClubRequest.deleteOne({
        _id: membership._id
      });

      res.redirect(
        `/admin/clubs/${encodeURIComponent(club.slug)}/members`
      );
    } catch (error) {
      console.error("Member removal failed:", error.message);
      res.status(500).send("Unable to remove club member.");
    }
  }
);


// ==============================
// INDIVIDUAL CLUB DETAILS
// ==============================

app.get("/clubs/:slug", async (req, res) => {
  try {
    console.log("Requested club:", req.params.slug);

    const club = await Club.findOne({
      slug: req.params.slug
    });

    if (!club) {
      return res.status(404).send("Club not found.");
    }

    let membershipRequest = null;

    if (
      req.session.userId &&
      req.session.role === "student"
    ) {
      membershipRequest = await ClubRequest.findOne({
        student: req.session.userId,
        club: club._id
      });
    }

    res.render("club-details", {
      club,
      membershipStatus: membershipRequest
        ? membershipRequest.status
        : null
    });
  } catch (error) {
    console.error("Club details error:", error);

    res.status(500).send(
      "Failed to load club details. Check terminal."
    );
  }
});

// ==============================
// STUDENT: REQUEST TO JOIN A CLUB
// ==============================

app.post(
  "/clubs/:slug/request",
  requireLogin,
  async (req, res) => {
    try {
      if (req.session.role !== "student") {
        return res.status(403).send(
          "Only students can request club membership."
        );
      }

      const club = await Club.findOne({
        slug: req.params.slug
      });

      if (!club) {
        return res.status(404).send("Club not found.");
      }

      let request = await ClubRequest.findOne({
        student: req.session.userId,
        club: club._id
      });

      if (request && request.status !== "rejected") {
        return res.redirect(
          `/clubs/${encodeURIComponent(club.slug)}`
        );
      }

      if (request) {
        request.status = "pending";
        request.clubRole = "Member";
        await request.save();
      } else {
        await ClubRequest.create({
          student: req.session.userId,
          club: club._id,
          status: "pending",
          clubRole: "Member"
        });
      }

      res.redirect(
        `/clubs/${encodeURIComponent(club.slug)}`
      );
    } catch (error) {
      if (error.code === 11000) {
        return res.redirect(
          `/clubs/${encodeURIComponent(req.params.slug)}`
        );
      }

      console.error("Club request failed:", error.message);

      res.status(500).send(
        "Unable to submit club request."
      );
    }
  }
);

// ==============================
// ADMIN: VIEW CLUB REQUESTS
// ==============================

app.get(
  "/admin/club-requests",
  requireLogin,
  requireAdmin,
  async (req, res) => {
    try {
      const requests = await ClubRequest.find()
        .populate(
          "student",
          "name email branch year phone showPhone"
        )
        .populate("club", "name slug")
        .sort({ createdAt: -1 });

      res.render("admin/club-requests", { requests });
    } catch (error) {
      console.error(
        "Loading requests failed:",
        error.message
      );

      res.status(500).send(
        "Unable to load club requests."
      );
    }
  }
);

// ==============================
// ADMIN: APPROVE REQUEST
// ==============================

app.post(
  "/admin/club-requests/:requestId/approve",
  requireLogin,
  requireAdmin,
  async (req, res) => {
    try {
      const allowedRoles = [
        "President",
        "Vice President",
        "Secretary",
        "Joint Secretary",
        "Coordinator",
        "Member"
      ];

      const { clubRole } = req.body;

      if (!allowedRoles.includes(clubRole)) {
        return res.status(400).send("Invalid club role.");
      }

      const request = await ClubRequest.findOne({
        _id: req.params.requestId,
        status: "pending"
      });

      if (!request) {
        return res.status(404).send(
          "Pending request not found."
        );
      }

      request.status = "approved";
      request.clubRole = clubRole;

      await request.save();

      res.redirect("/admin/club-requests");
    } catch (error) {
      console.error("Approval failed:", error.message);

      res.status(500).send(
        "Unable to approve request."
      );
    }
  }
);

// ==============================
// ADMIN: REJECT REQUEST
// ==============================

app.post(
  "/admin/club-requests/:requestId/reject",
  requireLogin,
  requireAdmin,
  async (req, res) => {
    try {
      const request = await ClubRequest.findOne({
        _id: req.params.requestId,
        status: "pending"
      });

      if (!request) {
        return res.status(404).send(
          "Pending request not found."
        );
      }

      request.status = "rejected";
      await request.save();

      res.redirect("/admin/club-requests");
    } catch (error) {
      console.error("Rejection failed:", error.message);

      res.status(500).send(
        "Unable to reject request."
      );
    }
  }
);

// ==============================
// ADMIN: ADD NEW CLUB
// ==============================

app.get(
  "/admin/clubs/new",
  requireLogin,
  requireAdmin,
  (req, res) => {
    res.render("admin/add-club");
  }
);

app.post(
  "/admin/clubs",
  requireLogin,
  requireAdmin,
  async (req, res) => {
    try {
      const name = req.body.name?.trim();
      const category = req.body.category?.trim();
      const description = req.body.description?.trim();
      const emoji = req.body.emoji?.trim() || "🎓";

      const activities = (req.body.activities || "")
        .split("\n")
        .map((activity) => activity.trim())
        .filter(Boolean);

      if (!name || !category || !description) {
        return res.status(400).render("admin/add-club", {
          error: "Please fill in all required fields."
        });
      }

      const slug = name
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (!slug) {
        return res.status(400).render("admin/add-club", {
          error: "Please enter a valid club name."
        });
      }

      const existingClub = await Club.findOne({ slug });

      if (existingClub) {
        return res.status(409).render("admin/add-club", {
          error: "A club with this name already exists."
        });
      }

      await Club.create({
        name,
        slug,
        category,
        description,
        emoji,
        activities,
        events: []
      });

      res.redirect("/clubs");
    } catch (error) {
      console.error(
        "Failed to create club:",
        error.message
      );

      res.status(500).render("admin/add-club", {
        error: "Unable to save club. Please try again."
      });
    }
  }
);

// ==============================
// EDIT CLUB PAGE
// Admin: any club
// President/Coordinator: their own approved club
// ==============================

app.get(
  "/admin/clubs/:slug/edit",
  requireClubEditor,
  async (req, res) => {
    try {
      const club = await Club.findOne({
        slug: req.params.slug
      });

      if (!club) {
        return res.status(404).send("Club not found.");
      }

      res.render("admin/edit-club", { club });
    } catch (error) {
      console.error(
        "Edit page error:",
        error.message
      );

      res.status(500).send(
        "Unable to load edit page."
      );
    }
  }
);

// ==============================
// UPDATE CLUB
// ==============================

app.post(
  "/admin/clubs/:slug/edit",
  requireClubEditor,
  async (req, res) => {
    try {
      const {
        name,
        category,
        emoji,
        description,
        activities,
        eventName,
        eventDate,
        updateTitle,
        updateContent
      } = req.body;

      // Club name is required only when the user is Admin.
      if (
        (req.session.role === "admin" && !name?.trim()) ||
        !category?.trim() ||
        !description?.trim()
      ) {
        return res.status(400).send(
          req.session.role === "admin"
            ? "Name, category and description are required."
            : "Category and description are required."
        );
      }

      const club = await Club.findOne({
        slug: req.params.slug
      });

      if (!club) {
        return res.status(404).send("Club not found.");
      }

      // Only Admin can change the club name and URL slug.
      if (req.session.role === "admin") {
        const cleanName = name.trim();

        const newSlug = cleanName
          .toLowerCase()
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

        if (!newSlug) {
          return res.status(400).send(
            "Please enter a valid club name."
          );
        }

        club.name = cleanName;
        club.slug = newSlug;
      }

      // Validate announcement fields.
      const title = (updateTitle || "").trim();
      const content = (updateContent || "").trim();

      if (
        (title && !content) ||
        (!title && content)
      ) {
        return res.status(400).send(
          "Enter both the update title and details, or leave both empty."
        );
      }

      if (
        title.length > 150 ||
        content.length > 5000
      ) {
        return res.status(400).send(
          "Update title or details exceed the allowed length."
        );
      }

      // Update editable information.
      // Name and slug remain Admin-only.
      club.category = category.trim();
      club.emoji = emoji?.trim() || "🎓";
      club.description = description.trim();

      club.activities = (activities || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      // Keep the existing one-event form behavior.
      club.events =
        eventName?.trim() && eventDate
          ? [
              {
                name: eventName.trim(),
                date: eventDate
              }
            ]
          : [];

      // Add an announcement when both fields are provided.
      if (title && content) {
        // Ensure updates exists in the Club schema.
        if (!club.updates) {
          club.updates = [];
        }

        club.updates.push({
          title,
          content,
          publishedAt: new Date()
        });
      }

      await club.save();

      res.redirect(
        `/clubs/${encodeURIComponent(club.slug)}`
      );
    } catch (error) {
      console.error(
        "Club update failed:",
        error.message
      );

      if (error.code === 11000) {
        return res.status(409).send(
          "A club with this name already exists."
        );
      }

      res.status(500).send(
        "Unable to update club. Please try again."
      );
    }
  }
);

// ==============================
// ADMIN: DELETE CLUB
// ==============================

app.post(
  "/admin/clubs/:slug/delete",
  requireLogin,
  requireAdmin,
  async (req, res) => {
    try {
      const club = await Club.findOneAndDelete({
        slug: req.params.slug
      });

      if (!club) {
        return res.status(404).send("Club not found.");
      }

      // Remove membership requests associated with deleted club.
      await ClubRequest.deleteMany({
        club: club._id
      });

      console.log(`Club deleted: ${club.name}`);

      res.redirect("/clubs");
    } catch (error) {
      console.error(
        "Club deletion failed:",
        error.message
      );

      res.status(500).send(
        "Unable to delete club."
      );
    }
  }
);

// ==============================
// ADMIN: CREATE ADMIN ACCOUNT
// ==============================

app.get(
  "/admin/register",
  requireLogin,
  requireAdmin,
  (req, res) => {
    res.render("admin/create-admin", {
      error: null
    });
  }
);

app.post(
  "/admin/register",
  requireLogin,
  requireAdmin,
  async (req, res) => {
    try {
      const name = req.body.name?.trim();
      const email = req.body.email?.trim().toLowerCase();
      const password = req.body.password;

      if (
        !name ||
        name.length > 80 ||
        !email ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof password !== "string" ||
        password.length < 8 ||
        password.length > 72
      ) {
        return res.status(400).render(
          "admin/create-admin",
          {
            error:
              "Enter a valid name, email and password (8–72 characters)."
          }
        );
      }

      const existingUser = await User.findOne({
        email
      });

      if (existingUser) {
        return res.status(409).render(
          "admin/create-admin",
          {
            error:
              "An account with this email already exists."
          }
        );
      }

      const hashedPassword = await bcrypt.hash(
        password,
        12
      );

      await User.create({
        name,
        email,
        password: hashedPassword,
        role: "admin"
      });

      res.redirect("/admin/clubs/new");
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).render(
          "admin/create-admin",
          {
            error:
              "An account with this email already exists."
          }
        );
      }

      console.error(
        "Admin creation failed:",
        error.message
      );

      res.status(500).render(
        "admin/create-admin",
        {
          error:
            "Unable to create admin account right now."
        }
      );
    }
  }
);

// ==============================
// START SERVER
// ==============================

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `Campus Hub running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error.message
    );

    process.exit(1);
  }
}

startServer();