import React from 'react';
import { FolderOpen } from 'lucide-react';

const Project = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
        <p className="mt-2 text-gray-600">
          Manage your project details, goals, and company objectives
        </p>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Project Management</h3>
            <p className="text-gray-500 mb-4">
              Upload project documents or manually enter project details and goals
            </p>
            <p className="text-sm text-gray-400">
              This page will allow you to manage project context for AI analysis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Project; 