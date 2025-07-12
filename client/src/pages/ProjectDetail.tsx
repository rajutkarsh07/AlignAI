import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectsApi } from '../services/api';

const ProjectDetail: React.FC = () => {
  const params = useParams();
  const id = params.id || (params as any).id;
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await projectsApi.getById(id);
        setProject(response.data);
      } catch (err: any) {
        setError(err.message || 'Error loading project');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading project</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold text-secondary-900">
          {project.name}
        </h1>
        <p className="mt-2 text-secondary-600">{project.description}</p>

        <div className="mt-6">
          <h2 className="text-lg font-medium text-secondary-900 mb-4">
            Project Plan
          </h2>
          <div className="prose prose-sm max-w-none">
            {project.formattedPlan ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: project.formattedPlan.replace(/\n/g, '<br>'),
                }}
              />
            ) : (
              <p className="whitespace-pre-wrap">{project.officialPlan}</p>
            )}
          </div>
        </div>

        {project.goals && project.goals.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-medium text-secondary-900 mb-4">
              Goals
            </h2>
            <div className="space-y-3">
              {project.goals.map((goal: any) => (
                <div
                  key={goal._id}
                  className="p-4 border border-secondary-200 rounded-lg"
                >
                  <h3 className="font-medium text-secondary-900">
                    {goal.title}
                  </h3>
                  <p className="text-sm text-secondary-600 mt-1">
                    {goal.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                      ${
                        goal.priority === 'high'
                          ? 'bg-red-100 text-red-800'
                          : goal.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {goal.priority}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                      ${
                        goal.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : goal.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {goal.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
