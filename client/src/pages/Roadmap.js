import React from 'react';
import { BarChart3 } from 'lucide-react';

const Roadmap = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Roadmap Generator</h1>
        <p className="mt-2 text-gray-600">
          Generate balanced product roadmaps with AI assistance
        </p>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Roadmap Generation</h3>
            <p className="text-gray-500 mb-4">
              Create visual roadmaps that balance company goals with customer feedback
            </p>
            <p className="text-sm text-gray-400">
              AI will generate task cards and timelines based on your requirements
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roadmap; 