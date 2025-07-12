import React from 'react';
import { useParams } from 'react-router-dom';

const Analytics: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-secondary-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Analytics
          </h2>
          <p className="mt-1 text-sm text-secondary-500">
            Project analytics and insights
          </p>
        </div>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-secondary-900">Coming Soon</h3>
          <p className="mt-1 text-sm text-secondary-500">
            Analytics dashboard will be available soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
