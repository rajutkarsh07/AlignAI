import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const { projectId, roadmapId } = useParams<{ projectId: string; roadmapId: string }>();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<string>(projectId || '');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRoadmap, setSelectedRoadmap] = useState<string>(roadmapId || '');
  const [viewMode, setViewMode] = useState<'timeline' | 'kanban' | 'list'>('timeline');
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

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response: any = await api.get('/projects');
      return response.success ? response.data : [];
    },
  });

  // Fetch roadmaps for selected project
  const { data: roadmaps = [], isLoading: roadmapsLoading } = useQuery<Roadmap[]>({
    queryKey: ['roadmaps', selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const response: any = await api.get(`/roadmap/project/${selectedProject}`);
      return response.success ? response.data : [];
    },
    enabled: !!selectedProject,
  });

  // Fetch specific roadmap details
  const { data: roadmapDetails, isLoading: roadmapLoading } = useQuery<Roadmap>({
    queryKey: ['roadmap', selectedRoadmap],
    queryFn: async () => {
      const response: any = await api.get(`/roadmap/${selectedRoadmap}`);
      return response.success ? response.data : null;
    },
    enabled: !!selectedRoadmap,
  });

  // Generate roadmap mutation
  const generateRoadmapMutation = useMutation({
    mutationFn: async (roadmapData: any) => {
      const response: any = await api.post('/roadmap/generate', {
        ...roadmapData,
        projectId: selectedProject,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] });
      setShowCreateForm(false);
      resetNewRoadmap();
    },
  });

  // Update roadmap item status mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ roadmapId, itemId, updates }: { roadmapId: string; itemId: string; updates: any }) => {
      const response: any = await api.put(`/roadmap/${roadmapId}/items/${itemId}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] });
    },
  });

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

    const roadmapData = {
      ...newRoadmap,
      allocationType: newRoadmap.type,
      ...(newRoadmap.type === 'custom' && { customAllocation: newRoadmap.customAllocation }),
    };

    generateRoadmapMutation.mutate(roadmapData);
  };

  const updateItemStatus = (itemId: string, status: RoadmapItem['status']) => {
    if (!selectedRoadmap) return;
    updateItemMutation.mutate({ 
      roadmapId: selectedRoadmap, 
      itemId, 
      updates: { status } 
    });
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
    return roadmapDetails.items.filter(item => item.timeframe.quarter === quarter);
  };

  const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];

  const allocationStrategies = {
    'strategic-only': { strategic: 70, customerDriven: 20, maintenance: 10 },
    'customer-only': { strategic: 20, customerDriven: 70, maintenance: 10 },
    'balanced': { strategic: 60, customerDriven: 30, maintenance: 10 },
    'custom': newRoadmap.customAllocation,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Roadmap View
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Visualize and manage product roadmaps
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
          {selectedProject && roadmaps.length > 0 && (
            <select
              value={selectedRoadmap}
              onChange={(e) => setSelectedRoadmap(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Roadmap</option>
              {roadmaps.map((roadmap) => (
                <option key={roadmap._id} value={roadmap._id}>
                  {roadmap.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={!selectedProject}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SparklesIcon className="h-4 w-4 mr-2" />
            Generate Roadmap
          </button>
        </div>
      </div>

      {!selectedProject && (
        <div className="text-center py-12">
          <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No project selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select a project to view and manage roadmaps.
          </p>
        </div>
      )}

      {selectedProject && (
        <>
          {/* Generate Roadmap Form */}
          {showCreateForm && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Generate New Roadmap</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={newRoadmap.name}
                      onChange={(e) => setNewRoadmap(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Roadmap name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time Horizon</label>
                    <select
                      value={newRoadmap.timeHorizon}
                      onChange={(e) => setNewRoadmap(prev => ({ ...prev, timeHorizon: e.target.value as any }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="quarter">Quarter</option>
                      <option value="half-year">Half Year</option>
                      <option value="year">Year</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newRoadmap.description}
                    onChange={(e) => setNewRoadmap(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Roadmap description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Allocation Strategy</label>
                  <div className="space-y-3">
                    {Object.entries({
                      'balanced': 'Balanced (60% Strategic, 30% Customer, 10% Maintenance)',
                      'strategic-only': 'Strategic Focus (70% Strategic, 20% Customer, 10% Maintenance)',
                      'customer-only': 'Customer-Driven (20% Strategic, 70% Customer, 10% Maintenance)',
                      'custom': 'Custom Allocation'
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center">
                        <input
                          id={key}
                          name="roadmap-type"
                          type="radio"
                          value={key}
                          checked={newRoadmap.type === key}
                          onChange={(e) => setNewRoadmap(prev => ({ ...prev, type: e.target.value as any }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor={key} className="ml-3 text-sm text-gray-900">
                          {label}
                        </label>
                      </div>
                    ))}
                  </div>

                  {newRoadmap.type === 'custom' && (
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Strategic %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={newRoadmap.customAllocation.strategic}
                          onChange={(e) => setNewRoadmap(prev => ({
                            ...prev,
                            customAllocation: {
                              ...prev.customAllocation,
                              strategic: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Customer %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={newRoadmap.customAllocation.customerDriven}
                          onChange={(e) => setNewRoadmap(prev => ({
                            ...prev,
                            customAllocation: {
                              ...prev.customAllocation,
                              customerDriven: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Maintenance %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={newRoadmap.customAllocation.maintenance}
                          onChange={(e) => setNewRoadmap(prev => ({
                            ...prev,
                            customAllocation: {
                              ...prev.customAllocation,
                              maintenance: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateRoadmap}
                    disabled={!newRoadmap.name.trim() || generateRoadmapMutation.isPending}
                    className="px-4 py-2 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generateRoadmapMutation.isPending ? 'Generating...' : 'Generate Roadmap'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Roadmap List */}
          {!selectedRoadmap && roadmaps.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Available Roadmaps</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Select a roadmap to view details
                </p>
              </div>
              <ul className="divide-y divide-gray-200">
                {roadmaps.map((roadmap) => (
                  <li key={roadmap._id} className="px-4 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900">{roadmap.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{roadmap.description}</p>
                        <div className="mt-2 flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(roadmap.type)}`}>
                            {roadmap.type.replace('-', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">{roadmap.timeHorizon}</span>
                          <span className="text-xs text-gray-500">{roadmap.items.length} items</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedRoadmap(roadmap._id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        View Details
                        <ArrowRightIcon className="ml-1 h-3 w-3" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Roadmap Details */}
          {selectedRoadmap && roadmapDetails && (
            <>
              {/* Roadmap Header */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{roadmapDetails.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{roadmapDetails.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{roadmapDetails.items.length} Items</div>
                      <div className="text-sm text-gray-500">{roadmapDetails.timeHorizon}</div>
                    </div>
                    <button
                      onClick={() => setSelectedRoadmap('')}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      ← Back to list
                    </button>
                  </div>
                </div>

                {/* Allocation Strategy */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-semibold text-blue-900">{roadmapDetails.allocationStrategy.strategic}%</div>
                    <div className="text-sm text-blue-700">Strategic</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-semibold text-green-900">{roadmapDetails.allocationStrategy.customerDriven}%</div>
                    <div className="text-sm text-green-700">Customer-Driven</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-semibold text-yellow-900">{roadmapDetails.allocationStrategy.maintenance}%</div>
                    <div className="text-sm text-yellow-700">Maintenance</div>
                  </div>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex justify-center">
                <div className="bg-white rounded-lg shadow p-1 flex">
                  {[
                    { key: 'timeline', label: 'Timeline', icon: CalendarIcon },
                    { key: 'kanban', label: 'Kanban', icon: ChartBarIcon },
                    { key: 'list', label: 'List', icon: ClockIcon },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setViewMode(key as any)}
                      className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
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

              {/* Timeline View */}
              {viewMode === 'timeline' && (
                <div className="space-y-6">
                  {quarters.map((quarter) => {
                    const items = getQuarterItems(quarter);
                    if (items.length === 0) return null;

                    return (
                      <div key={quarter} className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h4 className="text-lg font-medium text-gray-900">{quarter}</h4>
                          <p className="text-sm text-gray-500">{items.length} items planned</p>
                        </div>
                        <div className="p-6">
                          <div className="grid gap-4">
                            {items.map((item) => (
                              <div key={item._id} className="border text-left border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="text-sm font-medium text-gray-900">{item.title}</h5>
                                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                    <div className="mt-2 flex items-center space-x-2">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                                        {item.category.replace('-', ' ')}
                                      </span>
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                        {item.priority}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {item.timeframe.estimatedDuration.value} {item.timeframe.estimatedDuration.unit}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {item.resourceAllocation.teamMembers} team members
                                      </span>
                                    </div>
                                    {item.successMetrics.length > 0 && (
                                      <div className="mt-2">
                                        <div className="text-xs font-medium text-gray-700">Success Metrics:</div>
                                        <ul className="text-xs text-gray-600 list-disc list-inside">
                                          {item.successMetrics.slice(0, 2).map((metric, index) => (
                                            <li key={index}>{metric}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                  <select
                                    value={item.status}
                                    onChange={(e) => updateItemStatus(item._id, e.target.value as RoadmapItem['status'])}
                                    className={`text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(item.status)}`}
                                  >
                                    <option value="proposed">Proposed</option>
                                    <option value="approved">Approved</option>
                                    <option value="in-progress">In Progress</option>
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
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {['proposed', 'approved', 'in-progress', 'completed', 'cancelled'].map((status) => {
                    const items = roadmapDetails.items.filter(item => item.status === status);
                    return (
                      <div key={status} className="bg-white shadow rounded-lg">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <h4 className="text-sm font-medium text-gray-900 capitalize">
                            {status.replace('-', ' ')} ({items.length})
                          </h4>
                        </div>
                        <div className="p-4 space-y-3">
                          {items.map((item) => (
                            <div key={item._id} className="border border-gray-200 rounded-lg p-3">
                              <h5 className="text-sm font-medium text-gray-900">{item.title}</h5>
                              <div className="mt-2 flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                                  {item.category.replace('-', ' ')}
                                </span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                  {item.priority}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{item.timeframe.quarter}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {roadmapDetails.items.map((item) => (
                      <li key={item._id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                            <div className="mt-2 flex items-center space-x-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                                {item.category.replace('-', ' ')}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                {item.priority}
                              </span>
                              <span className="text-xs text-gray-500">{item.timeframe.quarter}</span>
                              <span className="text-xs text-gray-500">
                                {item.timeframe.estimatedDuration.value} {item.timeframe.estimatedDuration.unit}
                              </span>
                            </div>
                          </div>
                          <select
                            value={item.status}
                            onChange={(e) => updateItemStatus(item._id, e.target.value as RoadmapItem['status'])}
                            className={`text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(item.status)}`}
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
              )}
            </>
          )}

          {/* Empty state for no roadmaps */}
          {selectedProject && !selectedRoadmap && roadmaps.length === 0 && !roadmapsLoading && (
            <div className="text-center py-12">
              <MapIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No roadmaps yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Generate your first AI-powered roadmap to get started.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RoadmapView;
