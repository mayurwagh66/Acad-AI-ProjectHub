# Acad AI ProjectHub

**An AI-powered academic project management platform that streamlines collaboration between students, team leaders, and faculty members.**

## About the Project

Acad AI ProjectHub is a comprehensive web application designed to revolutionize academic project management. It solves the common challenges faced by students and faculty in managing group projects, tracking progress, and ensuring effective collaboration. The platform leverages Google's Gemini AI to provide intelligent task planning, automated milestone generation, smart reminders, and detailed progress analytics.

The system addresses key pain points in academic project management:
- **Fragmented Communication**: Centralized chat and file sharing within project contexts
- **Poor Task Management**: AI-driven task breakdown and assignment with progress tracking
- **Lack of Faculty Oversight**: Real-time project monitoring and evaluation tools for faculty
- **Manual Progress Reporting**: Automated PDF report generation with charts and insights
- **Inefficient Planning**: AI-powered project planning with itinerary-style guidance

## Built With

- **Backend Framework**: Node.js / Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with bcryptjs
- **AI Integration**: Google Gemini AI (gemini-1.5-flash-latest)
- **File Handling**: Express-fileupload
- **PDF Generation**: html-pdf
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Charts & Visualization**: Chart.js
- **UI Framework**: Material Icons, Inter Font
- **Task Scheduling**: node-cron
- **Validation**: express-validator

## Key Features

### 🤖 AI-Powered Project Management
- **Intelligent Task Planning**: AI generates detailed project itineraries with task breakdowns and timelines
- **Auto Milestone Planning**: Automatic milestone generation based on project complexity and deadlines
- **Smart Reminders**: Context-aware, prioritized reminders for students based on task urgency and deadlines
- **Productivity Insights**: AI analysis of team performance with personalized suggestions

### 👥 Multi-Role Collaboration
- **Student Dashboard**: Project overview, task management, and AI assistance
- **Team Leader Controls**: Task assignment, project completion authority, and team coordination
- **Faculty Oversight**: Project monitoring, evaluation tools, and progress analytics

### 📊 Advanced Analytics & Reporting
- **Real-time Progress Tracking**: Visual donut charts showing completion rates and task status
- **Automated PDF Reports**: Weekly/monthly reports with charts, risk assessment, and AI summaries
- **Productivity Metrics**: Team performance analysis with actionable insights

### 💬 Communication & File Management
- **Project-based Chat**: Real-time messaging within project contexts
- **File Upload & Sharing**: Version-controlled file management with download capabilities
- **Faculty Suggestions**: Direct feedback system from faculty to student teams

### 🔐 Security & Authentication
- **Role-based Access Control**: Student, Team Leader, and Faculty permissions
- **JWT Authentication**: Secure token-based authentication
- **Project Authorization**: Granular permissions for project access and modifications

## Getting Started

### Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** (comes with Node.js)

Check your versions:
```bash
node -v
npm -v
mongod --version
```

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your_username/acad-ai-projecthub.git
cd acad-ai-projecthub
```

2. **Install dependencies:**
```bash
npm install
```

3. **Environment Configuration:**

Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Fill in the following environment variables in your `.env` file:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/acad_ai_projecthub

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Google Gemini AI API Key (get from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=5000

```

**Environment Variables Explained:**
- `MONGO_URI`: MongoDB connection string for your database
- `JWT_SECRET`: Secret key for signing JWT tokens (use a strong, random string)
- `GEMINI_API_KEY`: API key from Google AI Studio for AI features
- `PORT`: Port number for the server (default: 5000)

### How to Run the Project

1. **Start MongoDB:**
```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
# or
mongod
```

2. **Start the application:**
```bash
npm start
```

3. **Access the application:**
Open your browser and navigate to `http://localhost:5000`

You should see the Acad AI ProjectHub interface with login/register options.

## Detailed File Structure

```
acad-ai-projecthub/
├── app.js                          # Main server entry point
├── package.json                    # Project dependencies and scripts
├── .env                           # Environment variables (create this)
├── config/
│   └── db.js                      # MongoDB connection configuration
├── middleware/
│   ├── auth.js                    # JWT authentication middleware
│   └── error.js                   # Global error handling middleware
├── models/
│   ├── User.js                    # User schema (student, faculty, team_leader)
│   ├── Project.js                 # Project schema with AI plan details
│   ├── Task.js                    # Task schema with assignment and status
│   ├── ChatMessage.js             # Chat message schema
│   └── File.js                    # File upload schema
├── routes/
│   ├── auth.js                    # Authentication routes (login/register)
│   ├── dashboard.js               # Dashboard data endpoints
│   ├── projects.js                # Project CRUD and AI planning
│   ├── tasks.js                   # Task management endpoints
│   ├── files.js                   # File upload/download endpoints
│   ├── chat.js                    # Real-time chat endpoints
│   ├── analytics.js               # Productivity insights and analytics
│   ├── reports.js                 # PDF report generation
│   ├── feedback.js                # Faculty feedback system
│   └── reminders.js               # Smart reminder generation
├── public/
│   ├── index.html                 # Main HTML file with all views
│   ├── css/
│   │   └── style.css              # Application styling
│   └── js/
│       └── main.js                # Frontend JavaScript logic
├── uploads/                       # File upload directory
├── utils/
│   ├── cron-jobs.js               # Scheduled tasks and notifications
└── daigram/                       # Project documentation and diagrams
```

**Key File Explanations:**
- `app.js`: Main server file that sets up Express, middleware, routes, and starts the server
- `models/`: Mongoose schemas defining the database structure for users, projects, tasks, etc.
- `routes/`: API endpoint definitions organized by functionality
- `public/`: Frontend files served as static content
- `middleware/`: Custom middleware for authentication and error handling
- `utils/`: Utility functions for cron jobs and external integrations

## API Endpoints

### Authentication
- **POST** `/api/auth/register` - Register a new user
- **POST** `/api/auth/login` - User login

### Projects
- **GET** `/api/projects` - Get all projects for authenticated user
- **POST** `/api/projects` - Create a new project
- **GET** `/api/projects/:id` - Get project by ID
- **PUT** `/api/projects/:id` - Update project (role-based permissions)
- **DELETE** `/api/projects/:id` - Delete project (owner only)
- **POST** `/api/projects/join` - Join an existing project
- **POST** `/api/projects/ai-plan` - Generate AI task plan
- **PUT** `/api/projects/approve-plan/:projectId` - Approve AI plan (team leader only)
- **POST** `/api/projects/auto-milestones` - Generate auto milestones
- **PUT** `/api/projects/assign-faculty/:projectId` - Assign faculty to project

### Tasks
- **GET** `/api/tasks/project/:projectId` - Get tasks for a project
- **POST** `/api/tasks` - Create a new task
- **PUT** `/api/tasks/:id` - Update task status
- **PUT** `/api/tasks/:id/submit` - Submit task completion

### Files
- **POST** `/api/files/upload/:projectId` - Upload file to project
- **GET** `/api/files/project/:projectId` - Get files for project
- **GET** `/api/files/download/:fileId` - Download file

### Chat
- **GET** `/api/chat/projects/:projectId` - Get chat messages
- **POST** `/api/chat/projects/:projectId` - Send chat message

### Analytics & Reports
- **GET** `/api/analytics/productivity/:projectId` - Get productivity insights
- **GET** `/api/reports/generate/:projectId` - Generate PDF report
- **POST** `/api/reminders/generate` - Generate smart reminders

### Faculty Features
- **POST** `/api/projects/:projectId/faculty-suggestions` - Add faculty suggestion
- **GET** `/api/projects/:projectId/faculty-suggestions` - Get faculty suggestions
- **PUT** `/api/projects/evaluate/:projectId` - Evaluate project (faculty only)

## User Roles & Permissions

### Student
- Create and join projects
- View assigned tasks and project details
- Use AI planning features
- Upload files and participate in chat
- Submit task completions

### Team Leader
- All student permissions
- Assign tasks to team members
- Approve/reject AI-generated plans
- Mark projects as completed
- Manage team coordination

### Faculty
- View all assigned projects
- Monitor project progress with analytics
- Provide feedback and suggestions
- Generate and download reports
- Evaluate and grade projects
- Mark projects as completed

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



## Support

For support and questions, please open an issue in the GitHub repository or contact the development team.

---


