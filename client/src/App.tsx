import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import ProjectForm from './pages/ProjectForm';
import FeedbackManagement from './pages/FeedbackManagement';
import TaskManagement from './pages/TaskManagement';
import ChatInterface from './pages/ChatInterface';
import RoadmapView from './pages/RoadmapView';
import Analytics from './pages/Analytics';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<ProjectList />} />
              <Route path="projects/new" element={<ProjectForm />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
              <Route path="projects/:id/edit" element={<ProjectForm />} />
              
              {/* Global routes */}
              <Route path="chat" element={<ChatInterface />} />
              <Route path="chat/:sessionId" element={<ChatInterface />} />
              <Route path="feedback" element={<FeedbackManagement />} />
              <Route path="tasks" element={<TaskManagement />} />
              <Route path="roadmap" element={<RoadmapView />} />
              <Route path="roadmap/:roadmapId" element={<RoadmapView />} />
              <Route path="analytics" element={<Analytics />} />
              
              {/* Project-specific routes */}
              <Route path="projects/:id/feedback" element={<FeedbackManagement />} />
              <Route path="projects/:id/tasks" element={<TaskManagement />} />
              <Route path="projects/:id/chat" element={<ChatInterface />} />
              <Route path="projects/:id/chat/:sessionId" element={<ChatInterface />} />
              <Route path="projects/:id/roadmaps" element={<RoadmapView />} />
              <Route path="projects/:id/roadmaps/:roadmapId" element={<RoadmapView />} />
              <Route path="projects/:id/analytics" element={<Analytics />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </div>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
