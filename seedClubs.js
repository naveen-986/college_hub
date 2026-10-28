
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Club = require("./models/Club");

const clubs = [
  {
    name: "Coding Club",
    slug: "coding-club",
    category: "Technology",
    emoji: "💻",
    description: "Learn programming, solve problems, and build software projects with fellow students.",
    activities: [
      "DSA practice sessions",
      "Coding competitions",
      "Hackathons",
      "Peer learning workshops"
    ],
    events: [
      { name: "DSA Practice Session", date: "Coming Soon" },
      { name: "Campus Coding Challenge", date: "Coming Soon" }
    ]
  },
  {
    name: "Robotics Club",
    slug: "robotics-club",
    category: "Engineering",
    emoji: "🤖",
    description: "Explore robotics, electronics, sensors, and automation through practical projects.",
    activities: [
      "Robot building workshops",
      "Sensor projects",
      "Automation experiments",
      "Robotics competitions"
    ],
    events: [
      { name: "Robotics Workshop", date: "Coming Soon" }
    ]
  },
  {
    name: "Drone Learning Club",
    slug: "drone-learning-club",
    category: "Emerging Technology",
    emoji: "🚁",
    description: "Learn about drone technology, flight fundamentals, and responsible UAV applications.",
    activities: [
      "Drone technology sessions",
      "Flight controller learning",
      "UAV project discussions",
      "Drone demonstrations"
    ],
    events: [
      { name: "Introduction to Drones", date: "Coming Soon" }
    ]
  },
  {
    name: "Cultural Club",
    slug: "cultural-club",
    category: "Arts & Culture",
    emoji: "🎭",
    description: "Celebrate creativity through performances, festivals, and student events.",
    activities: [
      "Dance and music",
      "Cultural festivals",
      "Stage performances",
      "Event coordination"
    ],
    events: [
      { name: "Cultural Meetup", date: "Coming Soon" }
    ]
  },
  {
    name: "Photography Club",
    slug: "photography-club",
    category: "Creative Arts",
    emoji: "📸",
    description: "Capture campus life and develop photography and visual storytelling skills.",
    activities: [
      "Photo walks",
      "Photography workshops",
      "Photo editing",
      "Campus event coverage"
    ],
    events: [
      { name: "Campus Photo Walk", date: "Coming Soon" }
    ]
  },
  {
    name: "Sports Club",
    slug: "sports-club",
    category: "Sports & Fitness",
    emoji: "🏆",
    description: "Build teamwork and sportsmanship through games, practice, and competitions.",
    activities: [
      "Sports tournaments",
      "Team practice",
      "Inter-college competitions",
      "Recreational games"
    ],
    events: [
      { name: "Sports Meetup", date: "Coming Soon" }
    ]
  },
  {
    name: "Entrepreneurship Club",
    slug: "entrepreneurship-club",
    category: "Innovation",
    emoji: "🚀",
    description: "Explore startup ideas, innovation, business thinking, and teamwork.",
    activities: [
      "Startup idea discussions",
      "Pitching practice",
      "Entrepreneurship workshops",
      "Business brainstorming"
    ],
    events: [
      { name: "Startup Idea Session", date: "Coming Soon" }
    ]
  },
  {
    name: "Literary Club",
    slug: "literary-club",
    category: "Literature & Communication",
    emoji: "📚",
    description: "Improve communication and creativity through reading, writing, and discussion.",
    activities: [
      "Debates and discussions",
      "Creative writing",
      "Poetry and storytelling",
      "Public speaking"
    ],
    events: [
      { name: "Literary Meetup", date: "Coming Soon" }
    ]
  }
];

async function seedClubs() {
  try {
    await connectDB();

    for (const club of clubs) {
      await Club.updateOne(
        { slug: club.slug },
        { $set: club },
        { upsert: true, runValidators: true }
      );
    }

    console.log(`${clubs.length} clubs seeded successfully.`);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedClubs();
