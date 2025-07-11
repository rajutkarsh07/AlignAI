import React from 'react';
import { CheckSquare } from 'lucide-react';

const Tasks = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
        <p className="mt-2 text-gray-600">
          Create and manage tasks with AI-powered suggestions
        </p>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Task Management</h3>
            <p className="text-gray-500 mb-4">
              Create tasks with AI suggestions based on project goals and customer feedback
            </p>
            <p className="text-sm text-gray-400">
              Organize tasks into roadmaps and track progress
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks; 