# Roadmap Assistant - Installation Guide

## Prerequisites

Before installing the Roadmap Assistant, ensure you have the following:

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **MongoDB 5.0+** - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)

### Required Accounts
- **Google Cloud Platform Account** - [Sign up here](https://cloud.google.com/)
- **MongoDB Atlas** (optional, for cloud database) - [Sign up here](https://www.mongodb.com/atlas)

## Quick Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd roadmap-assistant
```

### 2. Run the Setup Script
```bash
chmod +x setup.sh
./setup.sh
```

### 3. Configure Environment Variables

#### Server Configuration (`server/.env`)
```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/roadmap_assistant

# Google Cloud Vertex AI Configuration
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
VERTEX_AI_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=5000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

#### Client Configuration (`client/.env`)
```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5000

# Socket.io Configuration
REACT_APP_SOCKET_URL=http://localhost:5000

# Feature Flags
REACT_APP_ENABLE_AI=true
REACT_APP_ENABLE_FILE_UPLOAD=true
REACT_APP_ENABLE_REAL_TIME=true

# Environment
REACT_APP_ENV=development
```

### 4. Set Up Google Cloud Vertex AI

#### Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Vertex AI API:
   - Go to APIs & Services > Library
   - Search for "Vertex AI API"
   - Click "Enable"

#### Create a Service Account
1. Go to IAM & Admin > Service Accounts
2. Click "Create Service Account"
3. Give it a name (e.g., "roadmap-assistant")
4. Grant the following roles:
   - Vertex AI User
   - Vertex AI Service Agent
5. Create and download the JSON key file
6. Place the key file in a secure location
7. Update `GOOGLE_APPLICATION_CREDENTIALS` in `server/.env`

### 5. Start the Application

#### Development Mode
```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend client (port 3000).

#### Production Mode
```bash
# Build the frontend
npm run build

# Start the server
npm start
```

### 6. Access the Application
Open your browser and navigate to: http://localhost:3000

## Manual Installation (Alternative)

If you prefer to install manually:

### 1. Install Dependencies
```bash
# Root dependencies
npm install

# Server dependencies
cd server
npm install
cd ..

# Client dependencies
cd client
npm install
cd ..
```

### 2. Create Directories
```bash
mkdir -p server/uploads
mkdir -p client/public
```

### 3. Copy Environment Files
```bash
cp server/env.example server/.env
cp client/env.example client/.env
```

### 4. Configure Environment Variables
Edit the `.env` files as described above.

## Database Setup

### Local MongoDB
1. Install MongoDB on your system
2. Start the MongoDB service:
   ```bash
   # Linux/macOS
   sudo systemctl start mongod
   
   # macOS (with Homebrew)
   brew services start mongodb-community
   
   # Windows
   net start MongoDB
   ```

### MongoDB Atlas (Cloud)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `server/.env`

## File Upload Configuration

The application supports file uploads for:
- Project documents (PDF, DOCX, DOC, TXT)
- Customer feedback documents
- General file uploads

Files are stored in the `server/uploads` directory by default.

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running and the connection string is correct.

#### 2. Google Cloud Authentication Error
```
Error: Could not load the default credentials
```
**Solution**: 
- Verify the service account key file path
- Ensure the key file has the correct permissions
- Check that the Vertex AI API is enabled

#### 3. Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution**: Change the port in `server/.env` or kill the process using the port.

#### 4. Node.js Version Error
```
Error: Unsupported Node.js version
```
**Solution**: Update to Node.js 18+ using a version manager like `nvm`.

### Performance Optimization

#### For Production
1. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name "roadmap-assistant"
   ```

2. Set up a reverse proxy (nginx/Apache)

3. Use MongoDB Atlas for better performance

4. Enable compression and caching

#### For Development
1. Use nodemon for auto-restart:
   ```bash
   npm install -g nodemon
   nodemon server/index.js
   ```

2. Enable hot reload for React:
   ```bash
   cd client
   npm start
   ```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **Service Account Keys**: Store Google Cloud keys securely
3. **JWT Secrets**: Use strong, unique JWT secrets
4. **File Uploads**: Validate file types and sizes
5. **Rate Limiting**: Configure appropriate rate limits
6. **CORS**: Restrict CORS origins in production

## Support

If you encounter issues:

1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all prerequisites are installed
4. Check the MongoDB connection
5. Verify Google Cloud credentials

For additional help, please refer to the main README.md file or create an issue in the repository. 