import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/ProjectList';
import ProjectView from './pages/ProjectView';
import ProjectOverview from './pages/ProjectOverview';
import ProjectForm from './pages/ProjectForm';
import FeedbackManagement from './pages/FeedbackManagement';
import TaskManagement from './pages/TaskManagement';
import ChatInterface from './pages/ChatInterface';
import RoadmapView from './pages/RoadmapView';
import Analytics from './pages/Analytics';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="projects" element={<ProjectList />} />
            <Route path="projects/new" element={<ProjectForm />} />

            {/* Nested project routes */}
            <Route path="projects/:id" element={<ProjectView />}>
              <Route index element={<ProjectOverview />} />
              <Route path="feedback" element={<FeedbackManagement />} />
              <Route path="tasks" element={<TaskManagement />} />
              <Route path="roadmaps" element={<RoadmapView />} />
              <Route path="roadmaps/:roadmapId" element={<RoadmapView />} />
              <Route path="chat" element={<ChatInterface />} />
              <Route path="chat/:sessionId" element={<ChatInterface />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>

            <Route path="projects/:id/edit" element={<ProjectForm />} />

            {/* Global routes */}
            <Route path="chat" element={<ChatInterface />} />
            <Route path="chat/:sessionId" element={<ChatInterface />} />
            <Route path="feedback" element={<FeedbackManagement />} />
            <Route path="tasks" element={<TaskManagement />} />
            <Route path="roadmap" element={<RoadmapView />} />
            <Route path="roadmap/:roadmapId" element={<RoadmapView />} />
            <Route path="analytics" element={<Analytics />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
