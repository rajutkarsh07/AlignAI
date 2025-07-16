import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  FolderIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserGroupIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface Project {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  goals: Array<{
    title: string;
    status: 'planned' | 'in-progress' | 'completed' | 'on-hold';
  }>;
  version: number;
}

interface ProjectsResponse {
  success: boolean;
  data: Project[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);

  useEffect(() => {
    loadProjects();
  }, [currentPage, searchTerm]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
      });

      const response: any = await api.get(`/projects?${params}`);

      if (response.success) {
        setProjects(response.data);
        setTotalPages(response.pagination.pages);
        setTotalProjects(response.pagination.total);
      }
    } catch (error: any) {
      console.error('Error loading projects:', error);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await api.delete(`/projects/${projectId}`);
      loadProjects(); // Reload the list
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      planned: 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      'on-hold': 'bg-yellow-100 text-yellow-800',
    };

    return (
      statusColors[status as keyof typeof statusColors] ||
      'bg-gray-100 text-gray-800'
    );
  };

  const getGoalsSummary = (goals: Project['goals']) => {
    const completed = goals.filter((g) => g.status === 'completed').length;
    const total = goals.length;
    return { completed, total };
  };

  if (loading && projects.length === 0) {
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
                Projects
              </h1>
              <p className="mt-2 text-base text-gray-500">
                Manage your AI-powered product roadmap projects
              </p>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
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

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="bg-white shadow-2xl rounded-2xl border border-blue-100">
          <div className="px-8 py-8 bg-gradient-to-r from-gray-50 to-white rounded-2xl">
            {/* Search Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Find Projects
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Search through {totalProjects} projects
                </p>
              </div>
              <div className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {projects.length} shown
              </div>
            </div>

            {/* Enhanced Search Bar */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-200" />
              </div>
              <input
                id="search"
                name="search"
                className="block w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 text-gray-900 transition-all duration-200 ease-in-out focus:outline-none focus:placeholder-gray-300 focus:ring-0 focus:border-orange-400 focus:bg-white hover:border-gray-300 shadow-sm focus:shadow-md"
                placeholder="Search projects by name or description..."
                type="search"
                value={searchTerm}
                onChange={handleSearch}
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  aria-label="Clear search"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Search Results Summary */}
            {searchTerm && (
              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">Search results for:</span>
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-md font-medium">
                    "{searchTerm}"
                  </span>
                </div>
                {projects.length === 0 ? (
                  <span className="text-red-600 font-medium">
                    No matches found
                  </span>
                ) : (
                  <span className="text-green-600 font-medium">
                    {projects.length} project{projects.length !== 1 ? 's' : ''}{' '}
                    found
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      {projects.length === 0 && !loading ? (
        <div className="text-center py-12 bg-white shadow-2xl rounded-2xl border border-blue-100">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No projects found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? 'Try adjusting your search terms.'
              : 'Get started by creating a new project.'}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="bg-white shadow-2xl rounded-2xl border border-blue-100">
            <ul className="divide-y divide-gray-100">
              {projects.map((project) => {
                const goalsSummary = getGoalsSummary(project.goals);
                return (
                  <li key={project._id}>
                    <div className="px-8 py-6 flex items-center justify-between hover:bg-blue-50/60 transition-colors duration-200 group">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                            <FolderIcon className="h-6 w-6 text-orange-600" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 px-4">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <Link
                                to={`/projects/${project._id}`}
                                className="text-base font-medium text-blue-700 truncate hover:text-orange-600"
                              >
                                {project.name}
                              </Link>
                              <p className="text-sm text-gray-500 truncate mt-1">
                                {project.description}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              Updated{' '}
                              {new Date(project.updatedAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <UserGroupIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              {goalsSummary.completed}/{goalsSummary.total}{' '}
                              goals completed
                            </div>
                            <div className="text-xs text-gray-400">
                              v{project.version}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Action buttons */}
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

                        {/* Dropdown menu */}
                        <div className="relative flex items-center space-x-1">
                          <Link
                            to={`/projects/${project._id}/edit`}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Edit project"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProject(project._id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete project"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                          <Link
                            to={`/projects/${project._id}`}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="bg-white shadow-2xl rounded-2xl border border-blue-100 px-6 py-4 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * 10 + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, totalProjects)}
                  </span>{' '}
                  of <span className="font-medium">{totalProjects}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-base font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-base font-medium rounded-none ${
                          pageNum === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-base font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && projects.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            Loading...
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
