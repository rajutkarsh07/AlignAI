# AlignAI - AI-Powered Product Management Platform

A comprehensive product management tool that helps balance strategic goals with customer feedback using AI-powered analysis and roadmap generation.

## 🚀 Features

### Core Capabilities

- **Intelligent Project Management**: Upload documents or manually input project descriptions with AI-powered formatting
- **Advanced Feedback Analysis**: AI categorization, sentiment analysis, and keyword extraction from customer feedback
- **Multi-Agent AI System**: Specialized agents for general questions, roadmap generation, and task enhancement
- **Smart Roadmapping**: Generate balanced roadmaps using various allocation strategies (60/30/10, custom, etc.)
- **Interactive Chat Interface**: Natural language interaction with AI agents
- **Real-time Collaboration**: Socket.io powered real-time updates
- **Comprehensive Analytics**: Project performance insights and trends

### AI Agents

1. **General Agent**: Answers product management questions and provides strategic insights
2. **Roadmap Agent**: Generates comprehensive roadmaps with intelligent prioritization
3. **Task Enhancer Agent**: Enhances task descriptions with acceptance criteria and recommendations

### Key Features

- **Document Upload**: Support for PDF, DOCX, DOC, and TXT files (Projects); PDF, DOCX, DOC and TXT(Feedback)
- **Feedback Management**: Ignore/unignore feedback items, bulk analysis, CSV import
- **Task Management**: AI-enhanced task creation with acceptance criteria
- **Roadmap Generation**: Multiple allocation strategies and timeline horizons
- **Analytics Dashboard**: Performance metrics and insights
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## 🛠️ Tech Stack

### Backend

- **Node.js** with Express.js (MVC architecture)
- **MongoDB** with Mongoose ODM
- **Google Vertex AI** (Gemini 2.5 Flash model)
- **Socket.io** for real-time communication
- **Multer** for file uploads
- **PDF-Parse & Mammoth** for document processing

### Frontend

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Query** for API state management
- **React Router** for navigation
- **React DnD** for drag and drop
- **Recharts** for data visualization
- **Heroicons** for icons

### AI & External Services

- **Multi-Provider AI Support**:
  - **Google Gemini API** - Fast, cost-effective option for most use cases
  - **OpenAI ChatGPT** - GPT-4o, GPT-4o-mini, and other OpenAI models
  - **Google Vertex AI** - Enterprise-grade option with Gemini 2.5 Flash
- **Tavily MCP** for external web search (when needed)
- **LlamaIndex** for advanced document processing

## 🚀 Getting Started

 For detailed installation and configuration instructions, please refer to [SETUP.md](./SETUP.md).

 This guide covers:
 - Prerequisites
 - Environment Configuration
 - Running the Application
 - Testing

## 📖 Usage Guide

### Creating Your First Project

1. **Navigate to Dashboard**: Visit `http://localhost:3000`
2. **Create Project**: Click "New Project"
3. **Project Setup**:
   - Enter project name and description
   - Upload project documents (PDF/DOCX/TXT) or enter text manually
   - AI will format and structure your project plan

### Managing Feedback

1. **Upload Feedback**: Go to Feedback section
   - Upload documents containing customer feedback (PDF, DOCX, DOC, TXT)
   - Or manually enter feedback items
2. **AI Analysis**: System automatically:
   - Categorizes feedback (bug-report, feature-request, etc.)
   - Analyzes sentiment (positive, negative, neutral)
   - Assigns priority levels
   - Extracts keywords and themes

### Using the AI Chat Assistant

Access three specialized agents:

#### General Agent

```
"What are the top customer pain points?"
"How should we prioritize our backlog?"
"What are industry best practices for feature prioritization?"
```

#### Roadmap Agent

```
"Create a balanced roadmap for Q1 2024"
"Generate a customer-driven plan with 70% customer requests"
"Show me a strategic roadmap focusing on revenue growth"
```

#### Task Enhancer Agent

```
"Title: User Authentication
Description: Implement secure login system"
```

### Generating Roadmaps

1. **Natural Language**: Ask the roadmap agent to create roadmaps
2. **Allocation Strategies**:

   - **Balanced**: 60% strategic, 30% customer-driven, 10% maintenance
   - **Strategic**: 70% strategic, 20% customer-driven, 10% maintenance
   - **Customer-driven**: 20% strategic, 70% customer-driven, 10% maintenance
   - **Custom**: Define your own percentages

3. **AI considers**:
   - Project strategic goals
   - Customer feedback priority and frequency
   - Resource constraints
   - Timeline feasibility
   - Risk assessment

## 🔧 API Reference

### Projects

- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `POST /api/projects/upload` - Create from document
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/goals` - Add goal
- `PUT /api/projects/:id/goals/:goalId` - Update goal
- `DELETE /api/projects/:id/goals/:goalId` - Delete goal

### Feedback

- `GET /api/feedback` - Get all feedback items across all projects
- `GET /api/feedback/project/:projectId` - Get project feedback
- `POST /api/feedback` - Create feedback collection
- `POST /api/feedback/upload` - Upload feedback document (PDF, DOCX, DOC, TXT, **CSV**)
- `POST /api/feedback/enhance` - Enhance raw feedback text with AI analysis
- `PUT /api/feedback/:id/items/:itemId/ignore` - Toggle ignore status
- `GET /api/feedback/project/:projectId/analytics` - Get feedback analytics for a project

### Tasks

- `GET /api/tasks` - Get all tasks across all projects
- `GET /api/tasks/project/:projectId` - Get project tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create task
- `POST /api/tasks/enhance` - Enhance task description using AI
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/dependencies` - Add dependency
- `DELETE /api/tasks/:id/dependencies/:dependencyId` - Remove dependency
- `GET /api/tasks/project/:projectId/analytics` - Get task analytics for a project
- `GET /api/tasks/project/:projectId/kanban` - Get tasks organized by status (Kanban view)

### Roadmaps

- `GET /api/roadmap` - Get all roadmaps across all projects
- `GET /api/roadmap/project/:projectId` - Get project roadmaps
- `GET /api/roadmap/:id` - Get roadmap by ID
- `POST /api/roadmap/generate` - Generate AI roadmap
- `POST /api/roadmap` - Create roadmap manually
- `PUT /api/roadmap/:id` - Update roadmap
- `DELETE /api/roadmap/:id` - Delete roadmap
- `POST /api/roadmap/:id/items` - Add roadmap item
- `PUT /api/roadmap/:id/items/:itemId` - Update roadmap item
- `DELETE /api/roadmap/:id/items/:itemId` - Delete roadmap item
- `POST /api/roadmap/:id/convert-to-tasks` - Convert roadmap items to tasks
- `GET /api/roadmap/project/:projectId/analytics` - Get roadmap analytics for a project

### Chat

- `GET /api/chat/project/:projectId/sessions` - Get all chat sessions for a project
- `GET /api/chat/sessions/:sessionId` - Get session history
- `POST /api/chat/sessions` - Create chat session
- `POST /api/chat/sessions/:sessionId/messages` - Send message
- `PUT /api/chat/sessions/:sessionId` - Update session
- `DELETE /api/chat/sessions/:sessionId` - Delete session
- `POST /api/chat/sessions/:sessionId/clear` - Clear session
- `GET /api/chat/sessions/:sessionId/export?format=json|txt` - Export chat session (JSON or TXT)

### Health

- `GET /api/health` - Health check endpoint

## 🎯 Example Use Cases

### Scenario 1: Mobile App Product Manager

1. Upload PRD document for new social features
2. Import App Store reviews and user surveys (CSV supported)
3. Ask: "Create a balanced 6-month roadmap focusing on user engagement"
4. AI generates roadmap balancing strategic features with user-requested improvements

### Scenario 2: SaaS Product Team

1. Input quarterly OKRs and strategic initiatives
2. Upload customer support tickets and feature requests
3. Ask: "What are our top 5 customer pain points and how should we address them?"
4. Generate customer-driven roadmap for next quarter

### Scenario 3: Enterprise Software

1. Upload business requirements document
2. Import stakeholder feedback from multiple channels
3. Ask: "Create a roadmap that addresses 70% strategic goals and 30% customer requests"
4. Export roadmap items as actionable tasks

## 🔒 Security & Best Practices

- Environment variables for sensitive data
- Rate limiting on API endpoints
- Input validation and sanitization
- File upload restrictions and scanning
- MongoDB connection security
- CORS configuration
- Error handling without data exposure
- JWT secret present for future authentication (no auth endpoints yet)



## 📊 Monitoring & Analytics

The application provides comprehensive analytics:

- Project completion rates
- Feedback sentiment trends
- Roadmap accuracy metrics
- User engagement statistics
- AI agent performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:

1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed description
4. Include environment details and logs

## 🔮 Roadmap

- [ ] Enhanced AI models and agents
- [ ] Advanced analytics and reporting
- [ ] Integration with project management tools
- [ ] Multi-language support
- [ ] Advanced collaboration features
- [ ] Mobile application
- [ ] API marketplace integrations

---

Built with ❤️ for product managers who want to balance strategy with customer needs.
