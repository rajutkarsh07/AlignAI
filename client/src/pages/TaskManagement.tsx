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
      setIsLoading(true);
      try {
        let endpoint = '/tasks';
        if (selectedProject) {
          endpoint = `/tasks/project/${selectedProject}`;
        }
        const response: any = await api.get(endpoint);
        if (response.success) {
          setTasks(response.data.tasks || []);
          setTaskSummary(response.data.summary || {});
        } else {
          setTasks([]);
          setTaskSummary({});
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setTasks([]);
        setTaskSummary({});
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
      const { assignee, ...rest } = newTask;
      const taskData = {
        ...newTask,
        assignedTo: assignee,
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
          {projects.length > 0 && (
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
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          )}
          <button
            onClick={() => setShowAddForm(true)}
            disabled={!selectedProject && projects.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Project</label>
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
              className="mt-1 block px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <CustomSelect
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'todo', label: 'To Do' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'done', label: 'Done' },
                { value: 'blocked', label: 'Blocked' },
              ]}
              className="mt-1 block px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
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
              className="mt-1 block px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Task Stats */}
      {selectedProject && (
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
        </div>
      )}

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
                  <CustomSelect
                    value={newTask.category}
                    onChange={(e) =>
                      setNewTask((prev) => ({
                        ...prev,
                        category: e.target.value as any,
                      }))
                    }
                    options={[
                      { value: 'feature', label: 'Feature' },
                      { value: 'bug-fix', label: 'Bug Fix' },
                      { value: 'improvement', label: 'Improvement' },
                      { value: 'research', label: 'Research' },
                      { value: 'maintenance', label: 'Maintenance' },
                      { value: 'design', label: 'Design' },
                      { value: 'testing', label: 'Testing' },
                    ]}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                  <CustomSelect
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask((prev) => ({
                        ...prev,
                        priority: e.target.value as any,
                      }))
                    }
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'critical', label: 'Critical' },
                    ]}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
          <h3 className="text-lg leading-6 font-medium text-gray-900">Tasks</h3>
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first task.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredTasks.map((task) => {
              // Find project name if showing all projects
              const showProject = !selectedProject;
              const project = showProject
                ? projects.find(
                    (p) => p._id === (task.projectId || task.project?._id)
                  )
                : null;
              return (
                <div
                  key={task._id}
                  className="relative bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-200 flex flex-col group overflow-hidden"
                  style={{ minHeight: 220 }}
                >
                  <div className="flex items-center justify-between px-5 pt-5 pb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <span className="text-base font-bold text-gray-900 truncate max-w-[180px] group-hover:text-orange-600 transition-colors">
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(
                          task.status
                        )} border border-opacity-30`}
                      >
                        {task.status.replace('-', ' ')}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(
                          task.priority
                        )} border border-opacity-30`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  <div className="px-5 pb-2 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5">
                      <span className="font-medium">Category:</span>{' '}
                      {task.category}
                    </span>
                    {task.assignee && (
                      <span className="inline-flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5">
                        <UserIcon className="h-4 w-4 text-gray-400" /> @
                        {task.assignee}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="inline-flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {showProject && project && (
                      <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 rounded px-2 py-0.5 font-semibold border border-orange-200">
                        <span className="font-bold">Project:</span>{' '}
                        {project.name}
                      </span>
                    )}
                  </div>
                  <div className="px-5 pb-2 text-xs text-gray-400 flex gap-2">
                    <span>
                      Created: {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>
                      Updated: {new Date(task.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="px-5 pb-4">
                    <button
                      onClick={() =>
                        setExpandedTask(
                          expandedTask === task._id ? null : task._id
                        )
                      }
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1 mt-2 focus:outline-none"
                    >
                      {expandedTask === task._id ? (
                        <>
                          <ChevronUpIcon className="h-4 w-4" /> Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDownIcon className="h-4 w-4" /> View Details
                        </>
                      )}
                    </button>
                    {expandedTask === task._id && (
                      <div className="mt-3 space-y-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="text-sm text-gray-700">
                          <span className="font-semibold">Description:</span>
                          <div className="prose prose-sm max-w-none mt-1">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {task.description}
                            </ReactMarkdown>
                          </div>
                        </div>
                        {task.acceptanceCriteria.length > 0 && (
                          <div>
                            <h5 className="text-xs font-semibold text-gray-700 mb-1">
                              Acceptance Criteria:
                            </h5>
                            <ul className="list-disc list-inside text-xs text-gray-600">
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
                            <h5 className="text-xs font-semibold text-gray-700 mb-1">
                              AI Suggestions:
                            </h5>
                            <div className="space-y-2">
                              {task.aiSuggestions.enhancementRecommendations
                                .length > 0 && (
                                <div>
                                  <span className="font-medium">
                                    Enhancement Recommendations:
                                  </span>
                                  <div className="prose prose-xs max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {task.aiSuggestions.enhancementRecommendations
                                        .map((rec) => `- ${rec}`)
                                        .join('\n')}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )}
                              {task.aiSuggestions.riskAssessment && (
                                <div>
                                  <span className="font-medium">
                                    Risk Assessment:
                                  </span>
                                  <div className="prose prose-xs max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {task.aiSuggestions.riskAssessment}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )}
                              {task.aiSuggestions.resourceRequirements.length >
                                0 && (
                                <div>
                                  <span className="font-medium">
                                    Resource Requirements:
                                  </span>
                                  <div className="prose prose-xs max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {task.aiSuggestions.resourceRequirements
                                        .map((req) => `- ${req}`)
                                        .join('\n')}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )}
                              {task.aiSuggestions.successMetrics.length > 0 && (
                                <div>
                                  <span className="font-medium">
                                    Success Metrics:
                                  </span>
                                  <div className="prose prose-xs max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {task.aiSuggestions.successMetrics
                                        .map((metric) => `- ${metric}`)
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
                  <div className="flex items-center justify-between px-5 pb-5 mt-auto border-t border-gray-100 pt-3 bg-gradient-to-t from-gray-50 to-white">
                    <CustomSelect
                      value={task.status}
                      onChange={(e) =>
                        updateTaskStatus(
                          task._id,
                          e.target.value as Task['status']
                        )
                      }
                      options={[
                        { value: 'todo', label: 'To Do' },
                        { value: 'in-progress', label: 'In Progress' },
                        { value: 'done', label: 'Done' },
                        { value: 'blocked', label: 'Blocked' },
                      ]}
                      className="text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-1 bg-white"
                    />
                    {/* You can add more actions here if needed */}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManagement;
