# Setup Guide for AlignAI

This guide will help you set up the AlignAI project locally for development.

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- **At least one AI provider** (choose one):
  - **Google Gemini** (Good balance of speed/quality) - [Get Key](https://aistudio.google.com/app/apikey)
  - **Groq** (Fastest, Free Llama models) - [Get Key](https://console.groq.com/keys)
  - **OpenAI** (Industry standard) - [Get Key](https://platform.openai.com/api-keys)
  - **Google Vertex AI** (Enterprise) - Requires GCP project

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd AlignAI/server
npm install
npm run setup
```

The `npm run setup` command executes the `scripts/setup.js` script, which:
- Checks your Node.js version
- Creates necessary directories
- Installs backend and frontend dependencies
- Sets up environment variable files

### 2. Environment Configuration

The setup script creates `.env.example`. Copy it to `.env`:

```bash
cp .env.example .env
```

Update `.env` with your specific configuration.

#### Server & Database

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/alignai
FRONTEND_URL=http://localhost:3000
```

#### AI Provider Configuration

Choose one provider by setting `AI_PROVIDER`.

**Option A: Groq (Recommended for Speed & Cost)**
```env
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile  # Optional, default shown
```

**Option B: Google Gemini**
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash  # Optional, default shown
```

**Option C: OpenAI**
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini  # Optional, default shown
```

**Option D: Google Vertex AI**
```env
AI_PROVIDER=vertex
VERTEX_PROJECT=your_gcp_project_id
VERTEX_LOCATION=global
VERTEX_MODEL=gemini-2.5-flash
```

### 3. Google Cloud Setup (Only for Vertex AI)

If you chose `AI_PROVIDER=vertex`:

1. Create a Google Cloud Project
2. Enable Vertex AI API
3. Create a service account with Vertex AI permissions
4. Download the service account key as `service-account-key.json`
5. Place it in the root directory
6. Set `GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json` in `.env`

### 4. Start Development

```bash
# Start both backend and frontend
npm run dev-full

# Or start individually
npm run dev          # Backend only (on port 5001)
npm run client:dev   # Frontend only (on port 3000)
```

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd client && npm test

# Run integration tests
npm run test:integration
```
