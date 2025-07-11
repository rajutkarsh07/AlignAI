import React from 'react';
import { MessageCircle } from 'lucide-react';

const Chat = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Chat Assistant</h1>
        <p className="mt-2 text-gray-600">
          Chat with AI to get insights and recommendations
        </p>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">AI Chat Interface</h3>
            <p className="text-gray-500 mb-4">
              Ask questions about your project, feedback, and roadmap planning
            </p>
            <p className="text-sm text-gray-400">
              AI will provide context-aware responses based on your project data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat; 