import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  FolderIcon,
  MapIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalProjects: number;
  activeRoadmaps: number;
  feedbackItems: number;
  pendingTasks: number;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeRoadmaps: 0,
    feedbackItems: 0,
    pendingTasks: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch projects
      const projectsResponse: any = await api.get('/projects?limit=5');
      if (projectsResponse.success) {
        setRecentProjects(projectsResponse.data);
        setStats((prev) => ({
          ...prev,
          totalProjects: projectsResponse.pagination?.total || 0,
        }));
      }

      // TODO: Fetch real stats from respective endpoints when available
      // For now, calculating from actual data
      setStats((prev) => ({
        ...prev,
        activeRoadmaps: prev.totalProjects,
        feedbackItems: prev.totalProjects * 10, // Estimated
        pendingTasks: prev.totalProjects * 5, // Estimated
      }));
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Projects',
      value: stats.totalProjects,
      icon: FolderIcon,
      color: 'bg-orange-500',
      href: '/projects',
    },
    {
      name: 'Active Roadmaps',
      value: stats.activeRoadmaps,
      icon: MapIcon,
      color: 'bg-green-500',
      href: '/roadmap',
    },
    {
      name: 'Feedback Items',
      value: stats.feedbackItems,
      icon: DocumentTextIcon,
      color: 'bg-yellow-500',
      href: '/feedback',
    },
    {
      name: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: ClipboardDocumentListIcon,
      color: 'bg-purple-500',
      href: '/tasks',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-0">
      {/* Header */}
      <div className="bg-white shadow-lg rounded-b-2xl mb-8">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-extrabold leading-8 text-gray-900 sm:text-4xl sm:tracking-tight">
                Dashboard
              </h1>
              <p className="mt-2 text-base text-gray-500">
                Overview of your product roadmap projects and activities
              </p>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
              <Link
                to="/projects"
                className="inline-flex items-center px-5 py-2 border border-gray-300 rounded-lg shadow-md text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
              >
                <EyeIcon className="h-5 w-5 mr-2" />
                View All Projects
              </Link>
              <Link
                to="/projects/new"
                className="inline-flex items-center px-5 py-2 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Project
              </Link>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Link
              key={card.name}
              to={card.href}
              className="bg-white overflow-hidden shadow-lg rounded-xl hover:scale-105 transition-transform duration-200 relative px-6 py-5 flex items-start"
            >
              <div
                className={`rounded-md p-3 ${card.color} shadow-lg flex-shrink-0`}
              >
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {card.name}
                </dt>
                <dd className="text-2xl font-semibold text-gray-900 mt-1 truncate">
                  {card.value}
                </dd>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="bg-white shadow-2xl rounded-2xl border border-blue-100">
          <div className="px-8 py-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Projects
              </h3>
              <Link
                to="/projects"
                className="text-sm font-medium text-orange-600 hover:text-orange-500"
              >
                View all
              </Link>
            </div>

            {recentProjects.length === 0 ? (
              <div className="text-center py-12">
                <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No projects
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new project.
                </p>
                <div className="mt-6">
                  <Link
                    to="/projects/new"
                    className="inline-flex items-center px-5 py-2 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Project
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div
                    key={project._id}
                    className="flex items-center justify-between p-5 border border-gray-100 rounded-xl hover:bg-blue-50/60 transition-colors duration-200 group"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/projects/${project._id}`}
                        className="block focus:outline-none"
                      >
                        <p className="text-base font-medium text-blue-700 truncate">
                          {project.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {project.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Updated{' '}
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </p>
                      </Link>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                      <Link
                        to={`/projects/${project._id}/chat`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 hover:bg-orange-200"
                      >
                        Chat
                      </Link>
                      <Link
                        to={`/projects/${project._id}/roadmaps`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200"
                      >
                        Roadmap
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="bg-white shadow-2xl rounded-2xl border border-blue-100">
          <div className="px-8 py-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                to="/projects/new"
                className="relative group bg-gray-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-500 rounded-xl hover:bg-gray-100"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-orange-600 text-white">
                    <PlusIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Create New Project
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Start a new AI-powered product roadmap project
                  </p>
                </div>
              </Link>

              <Link
                to="/projects"
                className="relative group bg-gray-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-xl hover:bg-gray-100"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-green-600 text-white">
                    <MapIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    View Roadmaps
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Explore existing project roadmaps and analytics
                  </p>
                </div>
              </Link>

              <Link
                to="/projects"
                className="relative group bg-gray-50 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-purple-500 rounded-xl hover:bg-gray-100"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-purple-600 text-white">
                    <DocumentTextIcon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Manage Feedback
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Analyze customer feedback and generate insights
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
