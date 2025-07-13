import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
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
} from '@heroicons/react/24/outline';

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
}

interface Project {
  _id: string;
  name: string;
  description: string;
}

const TaskManagement: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [selectedProject, setSelectedProject] = useState<string>(
    projectId || ''
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
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
  const [taskSummary, setTaskSummary] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [isEnhancingTask, setIsEnhancingTask] = useState(false);

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
      if (!selectedProject) {
        setTasks([]);
        setTaskSummary({});
        return;
      }

      setIsLoading(true);
      try {
        const endpoint = selectedProject
          ? `/tasks/project/${selectedProject}`
          : '/tasks';
        const response: any = await api.get(endpoint);
        if (response.success) {
          setTasks(response.data.tasks || []);
          setTaskSummary(response.data.summary || {});
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
        acceptanceCriteria: newTask.acceptanceCriteria.filter((criteria) =>
          criteria.trim()
        ),
        tags: [],
      };

      const response: any = await api.post('/tasks', {
        ...taskData,
        projectId: selectedProject,
      });

      if (response.success) {
        // Refresh tasks
        const tasksResponse: any = await api.get(
          `/tasks/project/${selectedProject}`
        );
        if (tasksResponse.success) {
          setTasks(tasksResponse.data.tasks || []);
          setTaskSummary(tasksResponse.data.summary || {});
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
    setIsUpdatingTask(true);
    try {
      const response: any = await api.put(`/tasks/${taskId}`, { status });
      if (response.success) {
        // Refresh tasks
        const tasksResponse: any = await api.get(
          `/tasks/project/${selectedProject}`
        );
        if (tasksResponse.success) {
          setTasks(tasksResponse.data.tasks || []);
          setTaskSummary(tasksResponse.data.summary || {});
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsUpdatingTask(false);
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
        return 'bg-orange-100 text-orange-800';
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
      case 'done':
        return <CheckIcon className="h-4 w-4" />;
      case 'in-progress':
        return <ClockIcon className="h-4 w-4" />;
      case 'blocked':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Task Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Create, track, and manage project tasks
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
          {projects.length > 0 && !projectId && (
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            disabled={!selectedProject}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Task
          </button>
        </div>
      </div>

      {!selectedProject && (
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No project selected
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Select a project to view and manage tasks.
          </p>
        </div>
      )}

      {selectedProject && (
        <>
          {/* Task Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Tasks
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {taskStats.total}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        In Progress
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {taskStats.inProgress}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completed
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {taskStats.done}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Blocked
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {taskStats.blocked}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CalendarIcon className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        To Do
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {taskStats.todo}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="mt-1 block px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="mt-1 block px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Add Task Form Modal */}
          {showAddForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Add New Task
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      resetNewTask();
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        type="text"
                        value={newTask.title}
                        onChange={(e) =>
                          setNewTask((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Task title..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        value={newTask.category}
                        onChange={(e) =>
                          setNewTask((prev) => ({
                            ...prev,
                            category: e.target.value as any,
                          }))
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
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <div className="mt-1">
                      <textarea
                        value={newTask.description}
                        onChange={(e) =>
                          setNewTask((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Task description... (supports markdown)"
                      />
                      {newTask.description && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-md border">
                          <div className="text-xs font-medium text-gray-700 mb-2">
                            Preview:
                          </div>
                          <div className="prose prose-xs max-w-none text-sm text-gray-600">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {newTask.description}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <button
                        onClick={handleEnhanceTask}
                        disabled={
                          !newTask.title.trim() ||
                          !newTask.description.trim() ||
                          isEnhancingTask
                        }
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <SparklesIcon className="h-4 w-4 mr-1" />
                        {isEnhancingTask ? 'Enhancing...' : 'Enhance with AI'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <select
                        value={newTask.priority}
                        onChange={(e) =>
                          setNewTask((prev) => ({
                            ...prev,
                            priority: e.target.value as any,
                          }))
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
                      <label className="block text-sm font-medium text-gray-700">
                        Assignee
                      </label>
                      <input
                        type="text"
                        value={newTask.assignee}
                        onChange={(e) =>
                          setNewTask((prev) => ({
                            ...prev,
                            assignee: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Assignee email..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) =>
                          setNewTask((prev) => ({
                            ...prev,
                            dueDate: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Acceptance Criteria
                    </label>
                    {newTask.acceptanceCriteria.map((criteria, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={criteria}
                          onChange={(e) =>
                            updateAcceptanceCriteria(index, e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Acceptance criteria..."
                        />
                        {newTask.acceptanceCriteria.length > 1 && (
                          <button
                            onClick={() => removeAcceptanceCriteria(index)}
                            className="px-3 py-2 text-red-600 hover:text-red-500"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addAcceptanceCriteria}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      + Add criteria
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      resetNewTask();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTask}
                    disabled={
                      !newTask.title.trim() ||
                      !newTask.description.trim() ||
                      isCreatingTask
                    }
                    className="px-4 py-2 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingTask ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tasks List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Tasks
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {filteredTasks.length} of {tasks.length} tasks
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No tasks
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first task.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <li key={task._id} className="px-4 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getStatusIcon(task.status)}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {task.title}
                            </h4>
                            <div className="text-sm text-gray-500 mt-1 prose prose-sm max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {task.description}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center space-x-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {task.status.replace('-', ' ')}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                          <span className="text-xs text-gray-500">
                            {task.category}
                          </span>
                          {task.assignee && (
                            <span className="text-xs text-gray-500">
                              @{task.assignee}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-xs text-gray-500">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {expandedTask === task._id && (
                          <div className="mt-4 space-y-3">
                            {task.acceptanceCriteria.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">
                                  Acceptance Criteria:
                                </h5>
                                <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                                  {task.acceptanceCriteria.map(
                                    (criteria, index) => (
                                      <li key={index}>{criteria}</li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                            {task.aiSuggestions && (
                              <div>
                                <h5 className="text-sm font-medium text-gray-900">
                                  AI Suggestions:
                                </h5>
                                <div className="mt-1 text-sm text-gray-600 space-y-2">
                                  {task.aiSuggestions.enhancementRecommendations
                                    .length > 0 && (
                                    <div>
                                      <h6 className="text-xs font-medium text-gray-700 mb-1">
                                        Enhancement Recommendations:
                                      </h6>
                                      <div className="prose prose-xs max-w-none">
                                        <ReactMarkdown
                                          remarkPlugins={[remarkGfm]}
                                        >
                                          {task.aiSuggestions.enhancementRecommendations
                                            .map((rec, index) => `- ${rec}`)
                                            .join('\n')}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  )}
                                  {task.aiSuggestions.riskAssessment && (
                                    <div>
                                      <h6 className="text-xs font-medium text-gray-700 mb-1">
                                        Risk Assessment:
                                      </h6>
                                      <div className="prose prose-xs max-w-none">
                                        <ReactMarkdown
                                          remarkPlugins={[remarkGfm]}
                                        >
                                          {task.aiSuggestions.riskAssessment}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  )}
                                  {task.aiSuggestions.resourceRequirements
                                    .length > 0 && (
                                    <div>
                                      <h6 className="text-xs font-medium text-gray-700 mb-1">
                                        Resource Requirements:
                                      </h6>
                                      <div className="prose prose-xs max-w-none">
                                        <ReactMarkdown
                                          remarkPlugins={[remarkGfm]}
                                        >
                                          {task.aiSuggestions.resourceRequirements
                                            .map((req, index) => `- ${req}`)
                                            .join('\n')}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  )}
                                  {task.aiSuggestions.successMetrics.length >
                                    0 && (
                                    <div>
                                      <h6 className="text-xs font-medium text-gray-700 mb-1">
                                        Success Metrics:
                                      </h6>
                                      <div className="prose prose-xs max-w-none">
                                        <ReactMarkdown
                                          remarkPlugins={[remarkGfm]}
                                        >
                                          {task.aiSuggestions.successMetrics
                                            .map(
                                              (metric, index) => `- ${metric}`
                                            )
                                            .join('\n')}
                                        </ReactMarkdown>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <select
                          value={task.status}
                          onChange={(e) =>
                            updateTaskStatus(
                              task._id,
                              e.target.value as Task['status']
                            )
                          }
                          className="text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="done">Done</option>
                          <option value="blocked">Blocked</option>
                        </select>

                        <button
                          onClick={() =>
                            setExpandedTask(
                              expandedTask === task._id ? null : task._id
                            )
                          }
                          className="text-gray-400 hover:text-gray-500"
                        >
                          {expandedTask === task._id ? (
                            <ChevronUpIcon className="h-5 w-5" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TaskManagement;
