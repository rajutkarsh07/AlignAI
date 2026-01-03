import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import CustomSelect from '../components/CustomSelect';

interface ProjectFormData {
  name: string;
  description: string;
  officialPlan: string;
  goals: Array<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    targetQuarter: string;
    status: 'planned' | 'in-progress' | 'completed' | 'on-hold';
  }>;
}

const ProjectForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== 'new');

  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    officialPlan: '',
    goals: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadMode, setUploadMode] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      const response: any = await api.get(`/projects/${id}`);
      if (response.success) {
        const project = response.data;
        setFormData({
          name: project.name,
          description: project.description,
          officialPlan: project.officialPlan || '',
          goals: project.goals || [],
        });
      }
    } catch (error) {
      setError('Failed to load project');
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing && id) {
      loadProject();
    }
  }, [isEditing, id, loadProject]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGoalChange = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.map((goal, i) =>
        i === index ? { ...goal, [field]: value } : goal
      ),
    }));
  };

  const addGoal = () => {
    setFormData((prev) => ({
      ...prev,
      goals: [
        ...prev.goals,
        {
          title: '',
          description: '',
          priority: 'medium' as const,
          targetQuarter: '',
          status: 'planned' as const,
        },
      ],
    }));
  };

  const removeGoal = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (uploadMode && file) {
        // Upload file mode
        const formDataUpload = new FormData();
        formDataUpload.append('document', file);
        formDataUpload.append('name', formData.name);
        formDataUpload.append('description', formData.description);

        const response: any = await api.post(
          '/projects/upload',
          formDataUpload,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (response.success) {
          setSuccess('Project created successfully from document!');
          setTimeout(() => navigate('/projects'), 2000);
        }
      } else {
        // Regular form submission
        if (isEditing && id) {
          const response: any = await api.put(`/projects/${id}`, formData);
          if (response.success) {
            setSuccess('Project updated successfully!');
            setTimeout(() => navigate(`/projects/${id}`), 2000);
          }
        } else {
          const response: any = await api.post('/projects', formData);
          if (response.success) {
            setSuccess('Project created successfully!');
            setTimeout(() => navigate('/projects'), 2000);
          }
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save project');
      console.error('Error saving project:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEditing
              ? 'Update your project details and goals'
              : 'Create a new AI-powered product roadmap project'}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="text-green-800">{success}</div>
          </div>
        )}

        {!isEditing && (
          <div className="mb-6 border-b border-gray-200 pb-6">
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setUploadMode(false)}
                className={`px-4 py-2 rounded-md font-medium ${!uploadMode
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
              >
                Manual Entry
              </button>
              <button
                type="button"
                onClick={() => setUploadMode(true)}
                className={`px-4 py-2 rounded-md font-medium ${uploadMode
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
              >
                Upload Document
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                required
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Brief project description"
              />
            </div>
          </div>

          {uploadMode ? (
            <div>
              <label
                htmlFor="document"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Upload Project Document *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="document"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="document"
                        name="document"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.docx,.doc,.txt"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOCX, DOC, TXT up to 10MB
                  </p>
                  {file && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label
                htmlFor="officialPlan"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Official Project Plan *
              </label>
              <textarea
                id="officialPlan"
                name="officialPlan"
                required
                rows={8}
                value={formData.officialPlan}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your project's official plan, goals, and requirements. Our AI will help format this into a structured roadmap."
              />
            </div>
          )}

          {!uploadMode && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Project Goals
                </h3>
                <button
                  type="button"
                  onClick={addGoal}
                  className="bg-accent-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  Add Goal
                </button>
              </div>

              {formData.goals.map((goal, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-md p-4 mb-4"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-md font-medium text-gray-800">
                      Goal {index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeGoal(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={goal.title}
                        onChange={(e) =>
                          handleGoalChange(index, 'title', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Goal title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <CustomSelect
                        value={goal.priority}
                        onChange={(e) =>
                          handleGoalChange(index, 'priority', e.target.value)
                        }
                        options={[
                          { value: 'low', label: 'Low' },
                          { value: 'medium', label: 'Medium' },
                          { value: 'high', label: 'High' },
                          { value: 'critical', label: 'Critical' },
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Quarter
                      </label>
                      <input
                        type="text"
                        value={goal.targetQuarter}
                        onChange={(e) =>
                          handleGoalChange(
                            index,
                            'targetQuarter',
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Q1 2024"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <CustomSelect
                        value={goal.status}
                        onChange={(e) =>
                          handleGoalChange(index, 'status', e.target.value)
                        }
                        options={[
                          { value: 'planned', label: 'Planned' },
                          { value: 'in-progress', label: 'In Progress' },
                          { value: 'completed', label: 'Completed' },
                          { value: 'on-hold', label: 'On Hold' },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={goal.description}
                      onChange={(e) =>
                        handleGoalChange(index, 'description', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Describe the goal in detail"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (uploadMode && !file)}
              className="px-6 py-2 bg-accent-500 text-white rounded-md hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : isEditing ? (
                'Update Project'
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;
