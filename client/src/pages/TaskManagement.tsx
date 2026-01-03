import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useSetPageHeader } from '../context/PageHeaderContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  PlusIcon,
  CheckIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import CustomSelect from '../components/CustomSelect';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  category:
  | 'feature'
  | 'bug-fix'
  | 'improvement'
  | 'research'
  | 'maintenance'
  | 'design'
  | 'testing';
  assignee?: string;
  dueDate?: string;
  estimatedEffort?: {
    value: number;
    unit: 'hours' | 'days' | 'weeks';
  };
  acceptanceCriteria: string[];
  tags: string[];
  aiSuggestions?: {
    enhancementRecommendations: string[];
    riskAssessment: string;
    resourceRequirements: string[];
    successMetrics: string[];
  };
  businessValue?: {
    customerImpact: 'high' | 'medium' | 'low';
    revenueImpact: 'high' | 'medium' | 'low' | 'none';
    strategicAlignment: number;
  };
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  project?: { _id: string; name: string };
}

interface Project {
  _id: string;
  name: string;
  description: string;
}

const TaskManagement: React.FC = () => {
  const params = useParams<{ id?: string; projectId?: string }>();

  // Support both nested route (id) and standalone route (projectId)
  const projectId = params.id || params.projectId;
  const isNestedInProject = !!params.id; // Check if we're in a nested project route

  const [selectedProject, setSelectedProject] = useState<string>(
    projectId || ''
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    category: 'feature' as const,
    assignee: '',
    dueDate: '',
    acceptanceCriteria: [''],
  });

  // State for data fetching
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isEnhancingTask, setIsEnhancingTask] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const response: any = await api.get('/projects');
        setProjects(response.success ? response.data : []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        let endpoint = '/tasks';
        if (selectedProject) {
          endpoint = `/tasks/project/${selectedProject}`;
        }
        const response: any = await api.get(endpoint);
        if (response.success) {
          setTasks(response.data.tasks || []);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [selectedProject]);

  const resetNewTask = () => {
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      category: 'feature',
      assignee: '',
      dueDate: '',
      acceptanceCriteria: [''],
    });
  };

  const addAcceptanceCriteria = () => {
    setNewTask((prev) => ({
      ...prev,
      acceptanceCriteria: [...prev.acceptanceCriteria, ''],
    }));
  };

  const updateAcceptanceCriteria = (index: number, value: string) => {
    setNewTask((prev) => ({
      ...prev,
      acceptanceCriteria: prev.acceptanceCriteria.map((criteria, i) =>
        i === index ? value : criteria
      ),
    }));
  };

  const removeAcceptanceCriteria = (index: number) => {
    setNewTask((prev) => ({
      ...prev,
      acceptanceCriteria: prev.acceptanceCriteria.filter((_, i) => i !== index),
    }));
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !newTask.description.trim()) return;
    setIsCreatingTask(true);
    try {
      const taskData = {
        ...newTask,
        assignedTo: newTask.assignee,
        acceptanceCriteria: newTask.acceptanceCriteria.filter((criteria) =>
          criteria.trim()
        ),
        tags: [],
        projectId: selectedProject || undefined,
      };

      const response: any = await api.post('/tasks', taskData);
      if (response.success) {
        const tasksResponse: any = await api.get(
          selectedProject ? `/tasks/project/${selectedProject}` : '/tasks'
        );
        if (tasksResponse.success) {
          setTasks(tasksResponse.data.tasks || []);
        }
        setShowAddForm(false);
        resetNewTask();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleEnhanceTask = async () => {
    if (!newTask.title.trim() || !newTask.description.trim()) return;

    setIsEnhancingTask(true);
    try {
      const response: any = await api.post('/tasks/enhance', {
        title: newTask.title,
        description: newTask.description,
        projectId: selectedProject,
      });

      if (response.success && response.data) {
        const enhancedTask = response.data;
        setNewTask((prev) => ({
          ...prev,
          description: enhancedTask.enhancedDescription || prev.description,
          priority: enhancedTask.priority || prev.priority,
          category: enhancedTask.category || prev.category,
          acceptanceCriteria:
            enhancedTask.acceptanceCriteria || prev.acceptanceCriteria,
        }));
      }
    } catch (error) {
      console.error('Error enhancing task:', error);
    } finally {
      setIsEnhancingTask(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const response: any = await api.put(`/tasks/${taskId}`, { status });
      if (response.success) {
        const tasksResponse: any = await api.get(
          selectedProject ? `/tasks/project/${selectedProject}` : '/tasks'
        );
        if (tasksResponse.success) {
          setTasks(tasksResponse.data.tasks || []);
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority)
      return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-accent-100 text-accent-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return <ClockIcon className="h-4 w-4" />;
      case 'in-progress':
        return <ArrowPathIcon className="h-4 w-4" />;
      case 'done':
        return <CheckIcon className="h-4 w-4" />;
      case 'blocked':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
  };

  // Set page header
  useSetPageHeader(
    'Task Management',
    isNestedInProject
      ? 'Create, track, and manage tasks for this project'
      : 'Create, track, and manage project tasks',
    <>
      {/* Only show project selector if NOT in nested project route */}
      {!isNestedInProject && (
        <CustomSelect
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          options={[
            { value: '', label: 'All Projects' },
            ...projects.map((project) => ({
              value: project._id,
              label: project.name,
            })),
          ]}
          className="w-48"
          label=""
        />
      )}
      <button
        onClick={() => setShowAddForm(true)}
        disabled={!selectedProject && projects.length > 0}
        className="inline-flex items-center whitespace-nowrap px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-accent-500 hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Add Task
      </button>
    </>,
    undefined,
    [selectedProject, projects, isNestedInProject]
  );

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="bg-white/90 shadow-lg rounded-xl p-6 sticky top-16 z-20 border border-blue-100 mb-6">
        <div className={`grid grid-cols-1 ${isNestedInProject ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <CustomSelect
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'todo', label: 'To Do' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'done', label: 'Done' },
                { value: 'blocked', label: 'Blocked' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <CustomSelect
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              options={[
                { value: 'all', label: 'All Priorities' },
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
          </div>
          {/* Only show project filter if NOT in nested project route */}
          {!isNestedInProject && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project
              </label>
              <CustomSelect
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                options={[
                  { value: '', label: 'All Projects' },
                  ...projects.map((project) => ({
                    value: project._id,
                    label: project.name,
                  })),
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {selectedProject && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <div className="bg-white overflow-hidden shadow-lg rounded-xl hover:scale-105 transition-transform duration-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
                  <UserIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Tasks
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {taskStats.total}
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl hover:scale-105 transition-transform duration-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <ClockIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    In Progress
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {taskStats.inProgress}
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl hover:scale-105 transition-transform duration-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <CheckIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {taskStats.done}
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl hover:scale-105 transition-transform duration-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Blocked
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {taskStats.blocked}
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl hover:scale-105 transition-transform duration-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <CalendarIcon className="h-6 w-6 text-secondary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    To Do
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {taskStats.todo}
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="bg-white/90 shadow-xl overflow-hidden sm:rounded-2xl border border-blue-100">
        <div className="px-6 py-6 sm:px-8 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl leading-7 font-semibold text-gray-900">
              Tasks
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <ArrowPathIcon className="mx-auto h-10 w-10 text-blue-400 animate-spin" />
            <p className="mt-4 text-base text-gray-500">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <SparklesIcon className="mx-auto h-14 w-14 text-blue-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No tasks found
            </h3>
            <p className="mt-2 text-base text-gray-500">
              {tasks.length === 0
                ? 'Get started by creating your first task!'
                : 'Try adjusting your filters.'}
            </p>
            <div className="mt-8">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-5 py-2 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-accent-500 hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Task
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredTasks.map((task) => {
              const showProject = !selectedProject;
              const project = showProject
                ? projects.find(
                  (p) => p._id === (task.projectId || task.project?._id)
                )
                : null;

              return (
                <li
                  key={task._id}
                  className="hover:bg-blue-50/60 transition-colors duration-200 group"
                >
                  <div className="px-4 py-3 sm:px-8 sm:py-5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-[800px]:space-x-3 min-[800px]:gap-0 flex-1 min-w-0">
                        {/* Desktop - Status Badge with Text */}
                        <span
                          className={`hidden min-[800px]:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {task.status.replace('-', ' ')}
                        </span>

                        {/* Mobile - Status Icon Only */}
                        <span
                          className={`min-[800px]:hidden inline-flex items-center p-1.5 rounded-full shadow-sm flex-shrink-0 ${getStatusColor(
                            task.status
                          )}`}
                          title={task.status.replace('-', ' ')}
                        >
                          {getStatusIcon(task.status)}
                        </span>

                        <button
                          onClick={() => setSelectedTask(task)}
                          className="text-base font-medium text-primary-700 hover:text-primary-800 truncate text-left cursor-pointer transition-colors min-w-0"
                        >
                          {task.title}
                        </button>
                      </div>

                      {/* Desktop - Priority Badge */}
                      <div className="hidden min-[800px]:flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {/* Mobile - Three-Dot Menu Button (Top Right) */}
                      <div className="min-[800px]:hidden relative flex-shrink-0">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === task._id ? null : task._id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                          aria-label="More options"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>

                        {openMenuId === task._id && (
                          <>
                            {/* Backdrop to close menu */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                              <div className="py-2">
                                <div className="px-4 py-2 text-xs text-gray-500">
                                  <div className="font-semibold text-gray-700 mb-3">Task Details</div>

                                  {/* Priority */}
                                  <div className="flex items-center mb-2 pb-2 border-b border-gray-100">
                                    <span className="font-medium mr-2">Priority:</span>
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(
                                        task.priority
                                      )}`}
                                    >
                                      {task.priority}
                                    </span>
                                  </div>

                                  <div className="flex items-center mb-2">
                                    <UserIcon className="h-3 w-3 mr-2 text-gray-400" />
                                    <span className="font-medium">Assignee:</span>
                                    <span className="ml-1">{task.assignee || 'Unassigned'}</span>
                                  </div>
                                  {task.dueDate && (
                                    <div className="flex items-center mb-2">
                                      <CalendarIcon className="h-3 w-3 mr-2 text-gray-400" />
                                      <span className="font-medium">Due:</span>
                                      <span className="ml-1">{new Date(task.dueDate).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center">
                                    <ClockIcon className="h-3 w-3 mr-2 text-gray-400" />
                                    <span className="font-medium">Created:</span>
                                    <span className="ml-1">{new Date(task.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Desktop - Task Details */}
                    <div className="mt-1 hidden min-[800px]:flex min-[800px]:justify-between">
                      <div className="flex space-x-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <UserIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {task.assignee || 'Unassigned'}
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center text-sm text-gray-500">
                            <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                        {showProject && project && (
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                              {project.name}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <span>
                          Created{' '}
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Mobile - Project Name */}
                    {showProject && project && (
                      <div className="mt-1 flex min-[800px]:hidden items-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                          {project.name}
                        </span>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
              onClick={() => setSelectedTask(null)}
            >
              <div className="absolute inset-0 bg-gray-700 opacity-75"></div>
            </div>

            {/* Center modal */}
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-2xl px-6 pt-7 pb-6 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-8 border border-blue-100">
              {/* Close button */}
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="bg-white rounded-full text-gray-400 hover:text-blue-500 focus:outline-none shadow p-1 transition"
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Modal content */}
              <div>
                <div className="mt-3 sm:mt-0">
                  {/* Task header */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${getStatusColor(
                          selectedTask.status
                        )}`}
                      >
                        {selectedTask.status.replace('-', ' ')}
                      </span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${getPriorityColor(
                          selectedTask.priority
                        )}`}
                      >
                        {selectedTask.priority}
                      </span>
                    </div>
                    <h3 className="text-2xl leading-6 font-bold text-gray-900">
                      {selectedTask.title}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <UserIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {selectedTask.assignee || 'Unassigned'}
                      </div>
                      {selectedTask.dueDate && (
                        <div className="flex items-center">
                          <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          Due {new Date(selectedTask.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      <div className="flex items-center">
                        <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        Created {new Date(selectedTask.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Task details grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                      {/* Description */}
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 mb-3">
                          Description
                        </h4>
                        <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50 p-4 rounded-lg">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {selectedTask.description}
                          </ReactMarkdown>
                        </div>
                      </div>

                      {/* Acceptance Criteria */}
                      {selectedTask.acceptanceCriteria.length > 0 && (
                        <div>
                          <h4 className="text-base font-semibold text-gray-900 mb-3">
                            Acceptance Criteria
                          </h4>
                          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                            {selectedTask.acceptanceCriteria.map(
                              (criteria, index) => (
                                <li key={index}>{criteria}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                      {/* Status selector */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Status
                        </label>
                        <CustomSelect
                          value={selectedTask.status}
                          onChange={(e) => {
                            updateTaskStatus(
                              selectedTask._id,
                              e.target.value as Task['status']
                            );
                            setSelectedTask({
                              ...selectedTask,
                              status: e.target.value as Task['status'],
                            });
                          }}
                          options={[
                            { value: 'todo', label: 'To Do' },
                            {
                              value: 'in-progress',
                              label: 'In Progress',
                            },
                            { value: 'done', label: 'Done' },
                            { value: 'blocked', label: 'Blocked' },
                          ]}
                          className="w-full"
                        />
                      </div>

                      {/* AI Suggestions */}
                      {selectedTask.aiSuggestions && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">
                            AI Suggestions
                          </h4>
                          <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                            {selectedTask.aiSuggestions
                              .enhancementRecommendations.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold text-gray-700 mb-2">
                                    Enhancements
                                  </h5>
                                  <ul className="text-xs text-gray-600 space-y-1.5">
                                    {selectedTask.aiSuggestions.enhancementRecommendations.map(
                                      (rec, i) => (
                                        <li
                                          key={i}
                                          className="flex items-start"
                                        >
                                          <span className="mr-2 text-blue-600">•</span>
                                          <span>{rec}</span>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                            {selectedTask.aiSuggestions.riskAssessment && (
                              <div>
                                <h5 className="text-xs font-semibold text-gray-700 mb-2">
                                  Risk Assessment
                                </h5>
                                <p className="text-xs text-gray-600">
                                  {selectedTask.aiSuggestions.riskAssessment}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddForm && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-700 opacity-70"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-2xl px-6 pt-7 pb-6 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-8 border border-blue-100">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    resetNewTask();
                  }}
                  className="bg-white rounded-full text-gray-400 hover:text-blue-500 focus:outline-none shadow p-1 transition"
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Create New Task
                  </h3>
                  <div className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="title"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          value={newTask.title}
                          onChange={(e) =>
                            setNewTask({ ...newTask, title: e.target.value })
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="category"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Category
                        </label>
                        <select
                          id="category"
                          value={newTask.category}
                          onChange={(e) =>
                            setNewTask({
                              ...newTask,
                              category: e.target.value as any,
                            })
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="feature">Feature</option>
                          <option value="bug-fix">Bug Fix</option>
                          <option value="improvement">Improvement</option>
                          <option value="research">Research</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="design">Design</option>
                          <option value="testing">Testing</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Description
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="description"
                          rows={4}
                          value={newTask.description}
                          onChange={(e) =>
                            setNewTask({
                              ...newTask,
                              description: e.target.value,
                            })
                          }
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                        ></textarea>
                      </div>
                      <div className="mt-2">
                        <button
                          onClick={handleEnhanceTask}
                          disabled={
                            !newTask.title.trim() ||
                            !newTask.description.trim() ||
                            isEnhancingTask
                          }
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <SparklesIcon className="h-4 w-4 mr-1" />
                          {isEnhancingTask ? 'Enhancing...' : 'Enhance with AI'}
                        </button>
                      </div>
                      {newTask.description && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                          <h4 className="text-xs font-medium text-gray-500 mb-2">
                            Preview:
                          </h4>
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {newTask.description}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                      <div>
                        <label
                          htmlFor="priority"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Priority
                        </label>
                        <select
                          id="priority"
                          value={newTask.priority}
                          onChange={(e) =>
                            setNewTask({
                              ...newTask,
                              priority: e.target.value as any,
                            })
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="assignee"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Assignee
                        </label>
                        <input
                          type="text"
                          id="assignee"
                          value={newTask.assignee}
                          onChange={(e) =>
                            setNewTask({ ...newTask, assignee: e.target.value })
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Email or username"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="dueDate"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Due Date
                        </label>
                        <input
                          type="date"
                          id="dueDate"
                          value={newTask.dueDate}
                          onChange={(e) =>
                            setNewTask({ ...newTask, dueDate: e.target.value })
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Acceptance Criteria
                      </label>
                      <div className="mt-2 space-y-2">
                        {newTask.acceptanceCriteria.map((criteria, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="text"
                              value={criteria}
                              onChange={(e) =>
                                updateAcceptanceCriteria(index, e.target.value)
                              }
                              className="flex-1 block border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="Must be able to..."
                            />
                            {newTask.acceptanceCriteria.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeAcceptanceCriteria(index)}
                                className="inline-flex items-center p-1 border border-transparent rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addAcceptanceCriteria}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <PlusIcon className="h-3 w-3 mr-1" />
                          Add Criteria
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={handleCreateTask}
                  disabled={
                    !newTask.title.trim() ||
                    !newTask.description.trim() ||
                    isCreatingTask
                  }
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                >
                  {isCreatingTask ? (
                    <>
                      <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Task'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetNewTask();
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;

