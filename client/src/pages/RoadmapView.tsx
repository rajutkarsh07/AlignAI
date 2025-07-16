import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import {
  PlusIcon,
  MapIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot,
} from '@hello-pangea/dnd';
import CustomSelect from '../components/CustomSelect';

interface RoadmapItem {
  _id: string;
  title: string;
  description: string;
  category: 'strategic' | 'customer-driven' | 'maintenance' | 'innovation';
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeframe: {
    quarter: string;
    estimatedDuration: {
      value: number;
      unit: 'weeks' | 'months';
    };
  };
  resourceAllocation: {
    percentage: number;
    teamMembers: number;
    estimatedCost: number;
  };
  dependencies: string[];
  relatedFeedback: Array<{
    relevanceScore: number;
    customerQuotes: string[];
  }>;
  businessJustification: {
    strategicAlignment: number;
    customerImpact: number;
    revenueImpact: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  successMetrics: string[];
  status: 'proposed' | 'approved' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

interface Roadmap {
  _id: string;
  name: string;
  description: string;
  type: 'strategic-only' | 'customer-only' | 'balanced' | 'custom';
  timeHorizon: 'quarter' | 'half-year' | 'year';
  allocationStrategy: {
    strategic: number;
    customerDriven: number;
    maintenance: number;
  };
  items: RoadmapItem[];
  rationale: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
}

const RoadmapView: React.FC = () => {
  const { projectId, roadmapId } = useParams<{
    projectId: string;
    roadmapId: string;
  }>();
  const [selectedProject, setSelectedProject] = useState<string>(
    projectId || ''
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRoadmap, setSelectedRoadmap] = useState<string>(
    roadmapId || ''
  );
  const [viewMode, setViewMode] = useState<'timeline' | 'kanban' | 'list'>(
    'timeline'
  );
  const [newRoadmap, setNewRoadmap] = useState<{
    name: string;
    description: string;
    type: 'strategic-only' | 'customer-only' | 'balanced' | 'custom';
    timeHorizon: 'quarter' | 'half-year' | 'year';
    customAllocation: {
      strategic: number;
      customerDriven: number;
      maintenance: number;
    };
  }>({
    name: '',
    description: '',
    type: 'balanced',
    timeHorizon: 'quarter',
    customAllocation: {
      strategic: 60,
      customerDriven: 30,
      maintenance: 10,
    },
  });

  // State for data fetching
  const [projects, setProjects] = useState<Project[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [roadmapDetails, setRoadmapDetails] = useState<Roadmap | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingRoadmaps, setIsLoadingRoadmaps] = useState(false);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);

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

  // Fetch roadmaps for selected project or all projects
  useEffect(() => {
    const fetchRoadmaps = async () => {
      if (!selectedProject) {
        // Fetch all roadmaps
        setIsLoadingRoadmaps(true);
        try {
          const response: any = await api.get('/roadmap');
          setRoadmaps(response.success ? response.data : []);
        } catch (error) {
          console.error('Error fetching all roadmaps:', error);
          setRoadmaps([]);
        } finally {
          setIsLoadingRoadmaps(false);
        }
        return;
      }

      setIsLoadingRoadmaps(true);
      try {
        const response: any = await api.get(
          `/roadmap/project/${selectedProject}`
        );
        setRoadmaps(response.success ? response.data : []);
      } catch (error) {
        console.error('Error fetching roadmaps:', error);
        setRoadmaps([]);
      } finally {
        setIsLoadingRoadmaps(false);
      }
    };

    fetchRoadmaps();
  }, [selectedProject]);

  // Fetch specific roadmap details
  useEffect(() => {
    const fetchRoadmapDetails = async () => {
      if (!selectedRoadmap) {
        setRoadmapDetails(null);
        return;
      }

      setIsLoadingRoadmap(true);
      try {
        const response: any = await api.get(`/roadmap/${selectedRoadmap}`);
        setRoadmapDetails(response.success ? response.data : null);
      } catch (error) {
        console.error('Error fetching roadmap details:', error);
      } finally {
        setIsLoadingRoadmap(false);
      }
    };

    fetchRoadmapDetails();
  }, [selectedRoadmap]);

  const resetNewRoadmap = () => {
    setNewRoadmap({
      name: '',
      description: '',
      type: 'balanced',
      timeHorizon: 'quarter',
      customAllocation: {
        strategic: 60,
        customerDriven: 30,
        maintenance: 10,
      },
    });
  };

  const handleGenerateRoadmap = async () => {
    if (!newRoadmap.name.trim() || !selectedProject) return;

    setIsGeneratingRoadmap(true);
    try {
      const roadmapData = {
        ...newRoadmap,
        allocationType: newRoadmap.type,
        ...(newRoadmap.type === 'custom' && {
          customAllocation: newRoadmap.customAllocation,
        }),
      };

      const response: any = await api.post('/roadmap/generate', {
        ...roadmapData,
        projectId: selectedProject,
      });

      if (response.success) {
        // Refresh roadmaps
        const roadmapsResponse: any = await api.get(
          `/roadmap/project/${selectedProject}`
        );
        if (roadmapsResponse.success) {
          setRoadmaps(roadmapsResponse.data);
        }
        setShowCreateForm(false);
        resetNewRoadmap();
      }
    } catch (error) {
      console.error('Error generating roadmap:', error);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const updateItemStatus = async (
    itemId: string,
    status: RoadmapItem['status']
  ) => {
    if (!selectedRoadmap) return;

    setIsUpdatingItem(true);
    try {
      const response: any = await api.put(
        `/roadmap/${selectedRoadmap}/items/${itemId}`,
        { status }
      );
      if (response.success) {
        // Refresh roadmap details
        const roadmapResponse: any = await api.get(
          `/roadmap/${selectedRoadmap}`
        );
        if (roadmapResponse.success) {
          setRoadmapDetails(roadmapResponse.data);
        }
      }
    } catch (error) {
      console.error('Error updating roadmap item:', error);
    } finally {
      setIsUpdatingItem(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strategic':
        return 'bg-blue-100 text-blue-800';
      case 'customer-driven':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'innovation':
        return 'bg-purple-100 text-purple-800';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'proposed':
        return 'bg-gray-100 text-gray-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuarterItems = (quarter: string) => {
    if (!roadmapDetails) return [];
    return roadmapDetails.items.filter(
      (item) => item.timeframe.quarter === quarter
    );
  };

  const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];

  const allocationStrategies = {
    'strategic-only': { strategic: 70, customerDriven: 20, maintenance: 10 },
    'customer-only': { strategic: 20, customerDriven: 70, maintenance: 10 },
    balanced: { strategic: 60, customerDriven: 30, maintenance: 10 },
    custom: newRoadmap.customAllocation,
  };

  // Kanban drag-and-drop handler
  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !roadmapDetails) return;
    const { draggableId, destination, source } = result;
    const item = roadmapDetails.items.find((i) => i._id === draggableId);
    if (!item) return;
    const newStatus = destination.droppableId as RoadmapItem['status'];
    if (item.status !== newStatus) {
      updateItemStatus(item._id, newStatus);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-0">
      {/* Header */}
      <div className="bg-white shadow-lg rounded-b-2xl mb-8">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-3xl font-extrabold leading-8 text-gray-900 sm:text-4xl sm:tracking-tight">
                Roadmap View
              </h2>
              <p className="mt-2 text-base text-gray-500">
                Visualize and manage product roadmaps
              </p>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
              {projects.length > 0 && !projectId && (
                <CustomSelect
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  options={[
                    { value: '', label: 'Select Project' },
                    ...projects.map((project) => ({
                      value: project._id,
                      label: project.name,
                    })),
                  ]}
                  className="w-64"
                  label=""
                />
              )}
              {projectId && selectedProject && (
                <div className="px-4 py-2 border border-gray-300 rounded-lg text-base bg-gray-50 text-gray-700">
                  {projects.find((p) => p._id === selectedProject)?.name ||
                    `Project ${selectedProject}`}
                </div>
              )}
              {selectedProject && roadmaps.length > 0 && (
                <CustomSelect
                  value={selectedRoadmap}
                  onChange={(e) => setSelectedRoadmap(e.target.value)}
                  options={[
                    { value: '', label: 'Select Roadmap' },
                    ...roadmaps.map((roadmap) => ({
                      value: roadmap._id,
                      label: roadmap.name,
                    })),
                  ]}
                  className="w-64"
                  label=""
                />
              )}
              <button
                onClick={() => setShowCreateForm(true)}
                disabled={!selectedProject}
                className="inline-flex items-center px-5 py-2 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                Generate Roadmap
              </button>
            </div>
          </div>
        </div>
      </div>

      {!selectedProject && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <MapIcon className="mx-auto h-14 w-14 text-blue-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No project selected
            </h3>
            <p className="mt-2 text-base text-gray-500">
              Select a project to view and manage roadmaps.
            </p>
          </div>
        </div>
      )}

      {selectedProject && (
        <>
          {/* Generate Roadmap Form */}
          {showCreateForm && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
              <div className="bg-white shadow-2xl rounded-2xl border border-blue-100 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Generate New Roadmap
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        value={newRoadmap.name}
                        onChange={(e) =>
                          setNewRoadmap((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Roadmap name..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Time Horizon
                      </label>
                      <select
                        value={newRoadmap.timeHorizon}
                        onChange={(e) =>
                          setNewRoadmap((prev) => ({
                            ...prev,
                            timeHorizon: e.target.value as any,
                          }))
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="quarter">Quarter</option>
                        <option value="half-year">Half Year</option>
                        <option value="year">Year</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={newRoadmap.description}
                      onChange={(e) =>
                        setNewRoadmap((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={2}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Roadmap description..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Allocation Strategy
                    </label>
                    <div className="space-y-3">
                      {Object.entries({
                        balanced:
                          'Balanced (60% Strategic, 30% Customer, 10% Maintenance)',
                        'strategic-only':
                          'Strategic Focus (70% Strategic, 20% Customer, 10% Maintenance)',
                        'customer-only':
                          'Customer-Driven (20% Strategic, 70% Customer, 10% Maintenance)',
                        custom: 'Custom Allocation',
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center">
                          <input
                            id={key}
                            name="roadmap-type"
                            type="radio"
                            value={key}
                            checked={newRoadmap.type === key}
                            onChange={(e) =>
                              setNewRoadmap((prev) => ({
                                ...prev,
                                type: e.target.value as any,
                              }))
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label
                            htmlFor={key}
                            className="ml-3 text-sm text-gray-900"
                          >
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>

                    {newRoadmap.type === 'custom' && (
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Strategic %
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={newRoadmap.customAllocation.strategic}
                            onChange={(e) =>
                              setNewRoadmap((prev) => ({
                                ...prev,
                                customAllocation: {
                                  ...prev.customAllocation,
                                  strategic: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Customer %
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={newRoadmap.customAllocation.customerDriven}
                            onChange={(e) =>
                              setNewRoadmap((prev) => ({
                                ...prev,
                                customAllocation: {
                                  ...prev.customAllocation,
                                  customerDriven: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Maintenance %
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={newRoadmap.customAllocation.maintenance}
                            onChange={(e) =>
                              setNewRoadmap((prev) => ({
                                ...prev,
                                customAllocation: {
                                  ...prev.customAllocation,
                                  maintenance: parseInt(e.target.value) || 0,
                                },
                              }))
                            }
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        resetNewRoadmap();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerateRoadmap}
                      disabled={!newRoadmap.name.trim() || isGeneratingRoadmap}
                      className="px-4 py-2 border border-transparent rounded-lg text-white bg-gradient-to-r from-orange-600 to-yellow-500 hover:from-orange-700 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingRoadmap
                        ? 'Generating...'
                        : 'Generate Roadmap'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Roadmap List */}
          {!selectedRoadmap && roadmaps.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
              <div className="bg-white shadow-2xl rounded-2xl border border-blue-100 p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Available Roadmaps
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roadmaps.map((roadmap) => {
                    const showProject = !selectedProject;
                    const project =
                      showProject && roadmap.projectId
                        ? projects.find((p) => {
                            const pid =
                              typeof roadmap.projectId === 'object' &&
                              roadmap.projectId !== null
                                ? (roadmap.projectId as any)._id
                                : roadmap.projectId;
                            return p._id === pid;
                          })
                        : null;
                    return (
                      <div
                        key={roadmap._id}
                        className="relative bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 flex flex-col group overflow-hidden min-h-[180px]"
                      >
                        <div className="flex flex-col flex-1 p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <MapIcon className="h-5 w-5 text-blue-400" />
                            <span className="text-base font-bold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                              {roadmap.name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                            {roadmap.description}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${getCategoryColor(
                                roadmap.type
                              )} border border-opacity-30`}
                            >
                              {roadmap.type.replace('-', ' ')}
                            </span>
                            <span className="inline-flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5">
                              {roadmap.timeHorizon}
                            </span>
                            <span className="inline-flex items-center gap-1 bg-gray-100 rounded px-2 py-0.5">
                              {roadmap.items.length} items
                            </span>
                            {showProject && project && (
                              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 rounded px-2 py-0.5 font-semibold border border-orange-200">
                                <span className="font-bold">Project:</span>{' '}
                                {project.name}
                              </span>
                            )}
                          </div>
                          <div className="flex-1" />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => setSelectedRoadmap(roadmap._id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200"
                            >
                              View Details
                              <ArrowRightIcon className="ml-1 h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Roadmap Details */}
          {selectedRoadmap && roadmapDetails && (
            <>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
                <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-blue-100">
                  {/* Header Section */}
                  <div className="px-8 py-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                          <span className="bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full">
                            Roadmap
                          </span>
                          {roadmapDetails.name}
                        </h3>
                        <p className="text-gray-600 mt-2 leading-relaxed">
                          {roadmapDetails.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-500">
                            Total Items
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            {roadmapDetails.items.length}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedRoadmap('')}
                          className="p-2 rounded-full hover:bg-gray-50 transition-colors duration-200 text-gray-400 hover:text-gray-600"
                          aria-label="Go back"
                        >
                          <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Allocation Strategy */}
                  <div className="px-8 py-6 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                      Allocation Strategy
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      {/* Strategic */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-100 shadow-sm">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                          <span className="text-sm font-medium text-blue-800">
                            Strategic
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-blue-900 mt-2">
                          {roadmapDetails.allocationStrategy.strategic}%
                        </div>
                        <div className="mt-2 h-2 w-full bg-blue-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{
                              width: `${roadmapDetails.allocationStrategy.strategic}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Customer-Driven */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-100 shadow-sm">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                          <span className="text-sm font-medium text-green-800">
                            Customer-Driven
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-green-900 mt-2">
                          {roadmapDetails.allocationStrategy.customerDriven}%
                        </div>
                        <div className="mt-2 h-2 w-full bg-green-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-600 rounded-full"
                            style={{
                              width: `${roadmapDetails.allocationStrategy.customerDriven}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Maintenance */}
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-100 shadow-sm">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                          <span className="text-sm font-medium text-amber-800">
                            Maintenance
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-amber-900 mt-2">
                          {roadmapDetails.allocationStrategy.maintenance}%
                        </div>
                        <div className="mt-2 h-2 w-full bg-amber-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{
                              width: `${roadmapDetails.allocationStrategy.maintenance}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Time Horizon */}
                  <div className="px-8 py-4 bg-white border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">
                        Time Horizon
                      </span>
                      <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                        {roadmapDetails.timeHorizon}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* View Mode Toggle */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                <div className="flex justify-center">
                  <div className="bg-white rounded-xl shadow-lg p-1 flex border border-blue-100">
                    {[
                      {
                        key: 'timeline',
                        label: 'Timeline',
                        icon: CalendarIcon,
                      },
                      { key: 'kanban', label: 'Kanban', icon: ChartBarIcon },
                      { key: 'list', label: 'List', icon: ClockIcon },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setViewMode(key as any)}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                          viewMode === key
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline View */}
              {viewMode === 'timeline' && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                  {quarters.map((quarter) => {
                    const items = getQuarterItems(quarter);
                    if (items.length === 0) return null;

                    return (
                      <div
                        key={quarter}
                        className="bg-white shadow-2xl rounded-2xl border border-blue-100"
                      >
                        <div className="px-8 py-6 border-b border-gray-200">
                          <h4 className="text-lg font-medium text-gray-900">
                            {quarter}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {items.length} items planned
                          </p>
                        </div>
                        <div className="p-8">
                          <div className="grid gap-4">
                            {items.map((item) => (
                              <div
                                key={item._id}
                                className="border text-left border-gray-200 rounded-xl p-4 hover:bg-blue-50/60 transition-colors duration-200"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="text-sm font-medium text-gray-900">
                                      {item.title}
                                    </h5>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {item.description}
                                    </p>
                                    <div className="mt-2 flex items-center space-x-2">
                                      <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                                          item.category
                                        )}`}
                                      >
                                        {item.category.replace('-', ' ')}
                                      </span>
                                      <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                          item.priority
                                        )}`}
                                      >
                                        {item.priority}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {item.timeframe.estimatedDuration.value}{' '}
                                        {item.timeframe.estimatedDuration.unit}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {item.resourceAllocation.teamMembers}{' '}
                                        team members
                                      </span>
                                    </div>
                                    {item.successMetrics.length > 0 && (
                                      <div className="mt-2">
                                        <div className="text-xs font-medium text-gray-700">
                                          Success Metrics:
                                        </div>
                                        <ul className="text-xs text-gray-600 list-disc list-inside">
                                          {item.successMetrics
                                            .slice(0, 2)
                                            .map((metric, index) => (
                                              <li key={index}>{metric}</li>
                                            ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                  <select
                                    value={item.status}
                                    onChange={(e) =>
                                      updateItemStatus(
                                        item._id,
                                        e.target.value as RoadmapItem['status']
                                      )
                                    }
                                    className={`text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(
                                      item.status
                                    )}`}
                                  >
                                    <option value="proposed">Proposed</option>
                                    <option value="approved">Approved</option>
                                    <option value="in-progress">
                                      In Progress
                                    </option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Kanban View */}
              {viewMode === 'kanban' && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <DragDropContext onDragEnd={onDragEnd}>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                      {[
                        'proposed',
                        'approved',
                        'in-progress',
                        'completed',
                        'cancelled',
                      ].map((status) => {
                        const items = roadmapDetails.items.filter(
                          (item) => item.status === status
                        );
                        return (
                          <Droppable droppableId={status} key={status}>
                            {(
                              provided: DroppableProvided,
                              snapshot: DroppableStateSnapshot
                            ) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`bg-white shadow-2xl rounded-2xl border border-blue-100 min-h-[120px] transition-all ${
                                  snapshot.isDraggingOver
                                    ? 'ring-2 ring-blue-400'
                                    : ''
                                }`}
                              >
                                <div className="px-6 py-4 border-b border-gray-200">
                                  <h4 className="text-sm font-medium text-gray-900 capitalize">
                                    {status.replace('-', ' ')} ({items.length})
                                  </h4>
                                </div>
                                <div className="p-6 space-y-3">
                                  {items.map((item, idx) => (
                                    <Draggable
                                      key={item._id}
                                      draggableId={item._id}
                                      index={idx}
                                    >
                                      {(
                                        provided: DraggableProvided,
                                        snapshot: DraggableStateSnapshot
                                      ) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`border border-gray-200 rounded-xl p-3 bg-white transition-shadow ${
                                            snapshot.isDragging
                                              ? 'shadow-xl ring-2 ring-blue-400'
                                              : ''
                                          }`}
                                        >
                                          <h5 className="text-sm font-medium text-gray-900">
                                            {item.title}
                                          </h5>
                                          <div className="mt-2 flex items-center space-x-2">
                                            <span
                                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                                                item.category
                                              )}`}
                                            >
                                              {item.category.replace('-', ' ')}
                                            </span>
                                            <span
                                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                                item.priority
                                              )}`}
                                            >
                                              {item.priority}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {item.timeframe.quarter}
                                          </p>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              </div>
                            )}
                          </Droppable>
                        );
                      })}
                    </div>
                  </DragDropContext>
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="bg-white shadow-2xl rounded-2xl border border-blue-100 overflow-hidden">
                    <ul className="divide-y divide-gray-100">
                      {roadmapDetails.items.map((item) => (
                        <li
                          key={item._id}
                          className="px-8 py-6 hover:bg-blue-50/60 transition-colors duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900">
                                {item.title}
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {item.description}
                              </p>
                              <div className="mt-2 flex items-center space-x-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                                    item.category
                                  )}`}
                                >
                                  {item.category.replace('-', ' ')}
                                </span>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                                    item.priority
                                  )}`}
                                >
                                  {item.priority}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {item.timeframe.quarter}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {item.timeframe.estimatedDuration.value}{' '}
                                  {item.timeframe.estimatedDuration.unit}
                                </span>
                              </div>
                            </div>
                            <select
                              value={item.status}
                              onChange={(e) =>
                                updateItemStatus(
                                  item._id,
                                  e.target.value as RoadmapItem['status']
                                )
                              }
                              className={`text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(
                                item.status
                              )}`}
                            >
                              <option value="proposed">Proposed</option>
                              <option value="approved">Approved</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty state for no roadmaps */}
          {selectedProject &&
            !selectedRoadmap &&
            roadmaps.length === 0 &&
            !isLoadingRoadmaps && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center py-16">
                  <MapIcon className="mx-auto h-14 w-14 text-blue-300" />
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    No roadmaps yet
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    Generate your first AI-powered roadmap to get started.
                  </p>
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
};

export default RoadmapView;
