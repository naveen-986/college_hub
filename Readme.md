# Campus Hub - Student Portal

## Introduction

Campus Hub is a web-based student portal developed to make campus information and resources easily accessible to students. It provides a common platform for viewing notices, exploring student clubs, sharing study materials, and accessing lost and found information.

The main goal of this project is to simplify campus communication and encourage student participation in college activities.

## Features

- User registration and login
- Campus notice board
- Browse clubs and view club details
- Club membership management
- Role-based access for Admins, Presidents, Coordinators, and Students
- Edit club information based on permissions
- Add, remove, and update club member roles
- Search clubs by name
- Study notes sharing
- Lost and found section

## Technologies Used

**Frontend**
- HTML
- CSS
- JavaScript
- EJS

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB
- Mongoose

**Authentication**
- Express Session
- bcrypt

## User Roles

**Admin:** Can manage clubs, members, and administrative operations.

**President:** Can edit the club assigned to them.

**Coordinator:** Can edit the club assigned to them.

**Club Member:** Can access club-related features according to their permissions.

**Student:** Can browse campus information and access available student features.

## Installation and Setup

### Prerequisites

- Node.js and npm
- MongoDB or a MongoDB Atlas account
- Git

### Step 1: Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### Step 2: Open the Project Directory

```bash
cd campus-hub
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment Variables

Create a `.env` file in the project root directory and add the environment variables required by the application.

Example:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
```

Use the variable names expected by your application. Do not upload your `.env` file to GitHub.

### Step 5: Run the Application

If your `package.json` contains a start script, run:

```bash
npm start
```

Otherwise, if `app.js` is the application entry point, run:

```bash
node app.js
```

### Step 6: Open the Application

Open the following URL in your browser:

```text
http://localhost:3000
```

## Project Structure

```text
campus-hub/
├── models/
├── public/
│   ├── css/
│   ├── js/
│   └── images/
├── views/
│   ├── admin/
│   └── partials/
├── app.js
├── package.json
├── .env
└── README.md
```

The structure shown above is illustrative. Update it to match the actual files and folders in the repository.

## Future Improvements

- Email notifications for important notices
- Club event registration
- Student profile management
- Improved search and filtering
- Better mobile responsiveness
- Online deployment

## Conclusion

Campus Hub aims to provide students with a convenient way to access campus updates, discover clubs, share learning resources, and participate in college activities. The project also demonstrates the use of web development technologies, database integration, authentication, and role-based access control.

## License

This project was developed for educational purposes.

---

Developed as a student project.