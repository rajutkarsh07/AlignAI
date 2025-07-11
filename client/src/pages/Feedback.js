import React from 'react';
import { MessageSquare } from 'lucide-react';

const Feedback = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customer Feedback</h1>
        <p className="mt-2 text-gray-600">
          Manage and analyze customer feedback from various sources
        </p>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Feedback Management</h3>
            <p className="text-gray-500 mb-4">
              Upload feedback documents or manually add customer feedback
            </p>
            <p className="text-sm text-gray-400">
              AI will analyze and categorize feedback for better insights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback; 