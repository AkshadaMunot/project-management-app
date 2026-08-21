
# Task Management System

A full-stack task management application for managing projects and tasks from a single workspace.

## Features

- Google Sign-In authentication
- Guest login
- User profile management
- Edit profile information
- Protected workspace routes
- Project management
- Task management
- Project details
- Task details
- Light and Dark theme
- Multiple color modes
- User-specific theme and color preferences
- Responsive workspace layout
- Sidebar navigation
- Logout functionality

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- NestJS
- TypeScript
- MongoDB

### Authentication

- Google Identity Services
- Google Sign-In

## Project Structure

```text
Ablespace/
│
├── frontend/
│   ├── app/
│   │   ├── workspace/
│   │   │   ├── tasks/
│   │   │   ├── projects/
│   │   │   ├── profile/
│   │   │   └── ...
│   │   ├── components/
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── projects/
│   │   ├── tasks/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
````

## Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MongoDB
* Git

## Installation

Clone the repository:

```bash
git clone https://github.com/AkshadaMunot/project-management-app.git
```

Move into the project directory:

```bash
cd project-management-app
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create the required environment file:

```text
.env.local
```

Add the required frontend environment variables:

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

Then start the frontend:

```bash
npm run dev
```

The frontend will run on:

```text
http://localhost:3000
```

### Backend Setup

Open another terminal and move into the backend:

```bash
cd backend
npm install
```

Create the required environment file:

```text
.env
```

Add the environment variables required by the backend configuration.

Then start the backend:

```bash
npm run start:dev
```

## Authentication

The application supports Google Sign-In using Google Identity Services.

For local development, configure the Google Client ID in the frontend environment variables.

The backend handles the Google authentication request and returns the authenticated user information to the frontend.

## Workspace

After authentication, users can access the workspace.

The workspace contains:

* Profile
* Tasks
* Projects
* Theme settings
* Logout

## Projects

Users can create and manage projects from the Projects section.

Each project can contain project information and associated tasks.

## Tasks

Users can create and manage tasks from the Tasks section.

Tasks can be viewed individually through the task details page.

## Profile

The Profile section allows users to:

* View their profile information
* Edit their name
* Edit their email
* View their account type

## Theme and Color Modes

The application supports:

### Theme

* Light Mode
* Dark Mode

### Color Modes

* Blue
* Amber
* Pink
* Rose
* Emerald
* Black

Theme and color preferences are stored separately for each logged-in user.

New users use:

```text
Light Mode
Blue
```

as the default.

## Environment Variables

Environment files contain sensitive configuration and should not be committed to GitHub.

Use `.env.example` files to document required variables without exposing actual secrets.

## Security

The following files and folders are excluded from Git:

* `.env`
* `.env.local`
* `node_modules`
* `.next`
* Build files
* Local environment configuration

Never commit API keys, Google client secrets, database credentials, or other sensitive values to the repository.

## Running the Application

Start the backend:

```bash
cd backend
npm run start:dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Future Improvements

Possible future improvements include:

* Deployment to production
* Better task filtering and searching
* Project/task statistics
* User profile picture support
* Role-based access control
* Improved validation and error handling
* Notifications
* Team collaboration features

