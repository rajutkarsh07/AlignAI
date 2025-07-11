# Roadmap Assistant 🚀

An AI-powered product roadmap assistant that intelligently balances company goals with customer feedback to help product managers make informed decisions.

## Features ✨

### Core Functionality
- **Project Management**: Upload or manually input project descriptions and company goals
- **Customer Feedback Processing**: Import and manage customer feedback from various sources
- **AI-Powered Analysis**: Two specialized AI agents for different tasks
- **Smart Roadmap Generation**: Create balanced roadmaps considering both company goals and customer needs
- **Interactive Chat Interface**: Natural language interaction with the AI assistant

### Key Capabilities
- **Document Upload**: Support for PDF, DOCX, DOC files for project plans and feedback
- **Feedback Management**: Mark feedback as relevant/irrelevant, organize by priority
- **Task Creation**: AI-suggested task enhancements based on context
- **Visual Roadmaps**: Generate visual task cards and timelines
- **Context Memory**: AI remembers project context and feedback across sessions

## Tech Stack 🛠️

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express (MVC architecture)
- **AI**: Google Vertex AI Gemini 2.5 Flash
- **Database**: MongoDB
- **File Processing**: Multer, PDF parsing libraries
- **Real-time**: Socket.io for live updates

## Quick Start 🚀

### Prerequisites
- Node.js (v18+)
- MongoDB
- Google Cloud Platform account with Vertex AI enabled

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd roadmap-assistant
npm run install-all
```

2. **Environment Setup:**
```bash
# Copy environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
```

3. **Configure Environment Variables:**
```bash
# Server (.env)
MONGODB_URI=your_mongodb_connection_string
GOOGLE_APPLICATION_CREDENTIALS=path_to_your_service_account_key.json
VERTEX_AI_PROJECT_ID=your_gcp_project_id
VERTEX_AI_LOCATION=us-central1
JWT_SECRET=your_jwt_secret
PORT=5000

# Client (.env)
REACT_APP_API_URL=http://localhost:5000
```

4. **Start the application:**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage Guide 📖

### 1. Project Setup
- Click "Update Project Details" to input your company's goals and plans
- Upload documents or manually enter project information
- Save the project context for AI reference

### 2. Feedback Management
- Upload customer feedback documents or add text manually
- Review and mark feedback as relevant/irrelevant
- Organize feedback by priority and category

### 3. AI Interaction
- Use the chat interface to ask questions about your roadmap
- Ask for balanced plans, customer insights, or task suggestions
- Generate visual roadmaps with specific time allocations

### 4. Task Creation
- Create tasks with AI-suggested enhancements
- Get recommendations based on customer feedback and project goals
- Organize tasks into visual roadmap cards

## API Endpoints 📡

### Project Management
- `POST /api/projects` - Create/update project details
- `GET /api/projects` - Get current project context

### Feedback Management
- `POST /api/feedback` - Add feedback
- `GET /api/feedback` - Get all feedback
- `PUT /api/feedback/:id` - Update feedback status
- `DELETE /api/feedback/:id` - Remove feedback

### AI Services
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/ai/roadmap` - Generate roadmap
- `POST /api/ai/suggest-task` - Get task suggestions

### Tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks` - Get all tasks
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## Architecture 🏗️

### Frontend Structure
```
client/
├── src/
│   ├── components/
│   │   ├── Chat/
│   │   ├── Project/
│   │   ├── Feedback/
│   │   ├── Roadmap/
│   │   └── Tasks/
│   ├── services/
│   ├── hooks/
│   └── utils/
```

### Backend Structure
```
server/
├── controllers/
├── models/
├── routes/
├── services/
│   ├── ai/
│   ├── fileProcessing/
│   └── roadmap/
└── middleware/
```

## AI Agents 🤖

### 1. Chat Agent
- Handles general questions and context-aware responses
- Remembers project details and feedback history
- Provides insights and recommendations

### 2. Roadmap Agent
- Generates visual roadmaps and task cards
- Balances company goals with customer feedback
- Creates time-based project plans

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License 📄

MIT License - see LICENSE file for details

## Support 💬

For support and questions, please open an issue in the repository. 