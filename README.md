# Acad AI ProjectHub

**An AI-powered academic project management platform that streamlines collaboration between students, team leaders, and faculty members.**

[![Node.js](https://img.shields.io/badge/Node.js-v16%2B-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.x-lightgrey)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v4.4%2B-green)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4.x-black)](https://socket.io/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-1.5--flash-blue)](https://ai.google.dev/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow)](https://opensource.org/licenses/ISC)

---

## 📖 About the Project

Acad AI ProjectHub is a comprehensive web application designed to revolutionize academic project management. It solves the common challenges faced by students and faculty in managing group projects, tracking progress, and ensuring effective collaboration.

The platform leverages **Google's Gemini AI** to provide intelligent task planning, automated milestone generation, smart reminders, and detailed progress analytics.

**Key Problems Solved:**
- 🗂️ **Fragmented Communication** — Centralized chat and file sharing within project contexts
- 📋 **Poor Task Management** — AI-driven task breakdown and assignment with progress tracking
- 👁️ **Lack of Faculty Oversight** — Real-time project monitoring and evaluation tools for faculty
- 📄 **Manual Progress Reporting** — Automated PDF report generation with charts and insights
- 🧠 **Inefficient Planning** — AI-powered project planning with itinerary-style guidance

---

## 🛠️ Built With

| Layer | Technology |
|---|---|
| **Runtime** | Node.js (v16+) |
| **Framework** | Express.js v5 |
| **Database** | MongoDB + Mongoose ODM |
| **Authentication** | JWT + bcryptjs |
| **AI Integration** | Google Gemini AI (`gemini-1.5-flash-latest`) |
| **Real-time** | Socket.io v4 |
| **File Handling** | express-fileupload |
| **PDF Generation** | html-pdf |
| **Scheduling** | node-cron |
| **Validation** | express-validator |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Charts** | Chart.js |
| **UI** | Material Icons, Inter Font |

---

## ✨ Key Features

### 🤖 AI-Powered Project Management
- **Intelligent Task Planning** — AI generates detailed project itineraries with task breakdowns and timelines
- **Auto Milestone Planning** — Automatic milestone generation based on project complexity and deadlines
- **Smart Reminders** — Context-aware, prioritized reminders based on task urgency and deadlines
- **Productivity Insights** — AI analysis of team performance with personalized suggestions

### 👥 Multi-Role Collaboration
- **Student Dashboard** — Project overview, task management, and AI assistance
- **Team Leader Controls** — Task assignment, project completion authority, and team coordination
- **Faculty Oversight** — Project monitoring, evaluation tools, and progress analytics

### 📊 Advanced Analytics & Reporting
- **Real-time Progress Tracking** — Visual donut charts showing completion rates and task status
- **Automated PDF Reports** — Weekly/monthly reports with charts, risk assessment, and AI summaries
- **Productivity Metrics** — Team performance analysis with actionable insights

### 💬 Communication & File Management
- **Project-based Chat** — Instant real-time messaging powered by Socket.io
- **File Upload & Sharing** — File management with download capabilities
- **Faculty Suggestions** — Direct feedback system from faculty to student teams

### 🔐 Security & Authentication
- **Role-based Access Control** — Student, Team Leader, and Faculty permissions
- **JWT Authentication** — Secure token-based authentication
- **Project Authorization** — Granular permissions for project access and modifications

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** v16 or higher
- **MongoDB** v4.4 or higher
- **npm** (comes with Node.js)

```bash
node -v
npm -v
mongod --version
```

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/mayurwagh66/Acad-AI-ProjectHub.git
cd Acad-AI-ProjectHub
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database
MONGO_URI=mongodb://localhost:27017/acad_ai_projecthub

# JWT Secret (use a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Google Gemini AI (get from https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# Server
PORT=5000

# Nextcloud Storage (optional)
NEXTCLOUD_URL=http://localhost:8088
NEXTCLOUD_USER=admin
NEXTCLOUD_PASSWORD=admin_password
NEXTCLOUD_UPLOAD_DIR=acad_ai_uploads
```

### Running the Project

1. **Start MongoDB:**
```bash
# Windows
net start MongoDB

# macOS / Linux
sudo systemctl start mongod
```

2. **Start the server:**
```bash
npm start
```

3. **Open in browser:**
```
http://localhost:5000
```

---

## 📁 Project Structure

```
acad-ai-projecthub/
├── app.js                      # Main server entry point
├── package.json                # Dependencies and scripts
├── .env                        # Environment variables (create from .env.example)
├── config/
│   └── db.js                   # MongoDB connection
├── middleware/
│   ├── auth.js                 # JWT authentication middleware
│   └── error.js                # Global error handling
├── models/
│   ├── User.js                 # User schema (student / faculty / team_leader)
│   ├── Project.js              # Project schema with AI plan details
│   ├── Task.js                 # Task schema with assignment and status
│   ├── ChatMessage.js          # Chat message schema
│   └── File.js                 # File upload schema
├── routes/
│   ├── auth.js                 # Login / Register
│   ├── dashboard.js            # Dashboard data
│   ├── projects.js             # Projects CRUD + AI planning
│   ├── tasks.js                # Task management
│   ├── files.js                # File upload / download
│   ├── chat.js                 # Real-time chat
│   ├── analytics.js            # Productivity insights
│   ├── reports.js              # PDF report generation
│   ├── feedback.js             # Faculty feedback
│   └── reminders.js            # Smart reminders
├── public/
│   ├── index.html              # Main SPA HTML
│   ├── css/style.css           # Application styles
│   └── js/main.js              # Frontend logic
├── utils/
│   └── cron-jobs.js            # Scheduled tasks
├── uploads/                    # Uploaded files directory
└── daigram/                    # Architecture diagrams
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | User login |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects for user |
| POST | `/api/projects` | Create a new project |
| GET | `/api/projects/:id` | Get project by ID |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project (owner only) |
| POST | `/api/projects/join` | Join existing project |
| POST | `/api/projects/ai-plan` | Generate AI task plan |
| PUT | `/api/projects/approve-plan/:projectId` | Approve AI plan (team leader) |
| POST | `/api/projects/auto-milestones` | Generate auto milestones |
| PUT | `/api/projects/assign-faculty/:projectId` | Assign faculty to project |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/project/:projectId` | Get tasks for a project |
| POST | `/api/tasks` | Create a new task |
| PUT | `/api/tasks/:id` | Update task status |
| PUT | `/api/tasks/:id/submit` | Submit task completion |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/files/upload/:projectId` | Upload file to project |
| GET | `/api/files/project/:projectId` | Get project files |
| GET | `/api/files/download/:fileId` | Download file |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/projects/:projectId` | Get chat history |
| POST | `/api/chat/projects/:projectId` | Send message (broadcasts via `new_message` Socket.io event) |

### Analytics & Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/productivity/:projectId` | Get productivity insights |
| GET | `/api/reports/generate/:projectId` | Generate PDF report |
| POST | `/api/reminders/generate` | Generate smart reminders |

### Faculty
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/:projectId/faculty-suggestions` | Add faculty suggestion |
| GET | `/api/projects/:projectId/faculty-suggestions` | Get faculty suggestions |
| PUT | `/api/projects/evaluate/:projectId` | Evaluate project |

---

## 👤 User Roles & Permissions

| Feature | Student | Team Leader | Faculty |
|---------|---------|-------------|---------|
| Create/Join Projects | ✅ | ✅ | — |
| View Assigned Tasks | ✅ | ✅ | — |
| Submit Task Completions | ✅ | ✅ | — |
| Upload Files & Chat | ✅ | ✅ | — |
| Use AI Planning | ✅ | ✅ | — |
| Assign Tasks | — | ✅ | — |
| Approve AI Plans | — | ✅ | — |
| Mark Project Complete | — | ✅ | ✅ |
| View Analytics | — | ✅ | ✅ |
| Provide Feedback | — | — | ✅ |
| Evaluate & Grade | — | — | ✅ |
| Generate Reports | — | — | ✅ |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 💬 Support

For support and questions, please open an issue in the [GitHub repository](https://github.com/mayurwagh66/Acad-AI-ProjectHub/issues).

---

**Built with ❤️ for academic excellence and collaborative learning**
