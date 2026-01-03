import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useSetPageHeader } from '../context/PageHeaderContext';
import * as XLSX from 'xlsx';
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
  ArrowDownTrayIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  ChartPieIcon,
  ArrowPathIcon,
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
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Interfaces (RoadmapItem, Roadmap, Project) remain unchanged...
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

interface WireframeComponent {
  id: string;
  type: 'header' | 'navigation' | 'content' | 'sidebar' | 'footer' | 'form' | 'button' | 'card' | 'modal';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
  relatedRoadmapItems: string[];
}

interface WireframeScreen {
  id: string;
  name: string;
  device: 'mobile' | 'tablet' | 'desktop';
  category: 'user-flow' | 'feature' | 'redesign' | 'new-feature';
  components: WireframeComponent[];
  relatedQuarter: string;
  estimatedEffort: number;
}

const RoadmapView: React.FC = () => {
  const params = useParams<{
    id?: string;
    projectId?: string;
    roadmapId?: string;
  }>();

  // Support both nested route (id) and standalone route (projectId)
  const projectId = params.id || params.projectId;
  const roadmapId = params.roadmapId;

  const [selectedProject, setSelectedProject] = useState<string>(
    projectId || ''
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRoadmap, setSelectedRoadmap] = useState<string>(
    roadmapId || ''
  );

  const [viewMode, setViewMode] = useState<'timeline' | 'kanban' | 'list' | 'insights'
  >('timeline');
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
  const [insightsMode, setInsightsMode] = useState<'analytics' | 'wireframes'>('analytics');
  const [wireframes, setWireframes] = useState<WireframeScreen[]>([]);
  const [selectedWireframe, setSelectedWireframe] = useState<string>('');
  const [isGeneratingWireframes, setIsGeneratingWireframes] = useState(false);

  // Data fetching useEffects remain unchanged...
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

  useEffect(() => {
    const fetchRoadmaps = async () => {
      if (!selectedProject) {
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

  // All handler functions (resetNewRoadmap, handleGenerateRoadmap, etc.) remain unchanged...
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

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || !roadmapDetails) return;
    const { draggableId, destination } = result;
    const item = roadmapDetails.items.find((i) => i._id === draggableId);
    if (!item) return;
    const newStatus = destination.droppableId as RoadmapItem['status'];
    if (item.status !== newStatus) {
      updateItemStatus(item._id, newStatus);
    }
  };

  // Helper functions for colors and data filtering remain unchanged...
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strategic':
        return 'bg-primary-100 text-primary-800';
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
        return 'bg-accent-100 text-accent-800';
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
        return 'bg-primary-100 text-primary-800';
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

  const generateWireframes = async () => {
    if (!roadmapDetails) return;

    setIsGeneratingWireframes(true);
    try {
      const mockWireframes: WireframeScreen[] = roadmapDetails.items
        .filter(item => item.category !== 'maintenance')
        .slice(0, 6)
        .map((item, index) => ({
          id: `wireframe-${item._id}`,
          name: `${item.title} - UI Design`,
          device: ['mobile', 'tablet', 'desktop'][index % 3] as 'mobile' | 'tablet' | 'desktop',
          category: item.category === 'customer-driven' ? 'feature' : 'new-feature',
          relatedQuarter: item.timeframe.quarter,
          estimatedEffort: Math.floor(Math.random() * 20) + 5,
          components: [
            {
              id: `comp-${index}-1`,
              type: 'header',
              title: 'Navigation Header',
              description: 'Main navigation with user actions',
              priority: 'high',
              dependencies: [],
              relatedRoadmapItems: [item._id],
            },
            {
              id: `comp-${index}-2`,
              type: 'content',
              title: item.title,
              description: item.description,
              priority: item.priority === 'critical' ? 'high' : item.priority,
              dependencies: item.dependencies,
              relatedRoadmapItems: [item._id],
            },
            {
              id: `comp-${index}-3`,
              type: 'button',
              title: 'Action Buttons',
              description: 'Primary and secondary actions for user interaction',
              priority: 'medium',
              dependencies: [],
              relatedRoadmapItems: [item._id],
            },
          ],
        }));

      setWireframes(mockWireframes);
    } catch (error) {
      console.error('Error generating wireframes:', error);
    } finally {
      setIsGeneratingWireframes(false);
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile':
        return DevicePhoneMobileIcon;
      case 'tablet':
        return DeviceTabletIcon;
      case 'desktop':
        return ComputerDesktopIcon;
      default:
        return ComputerDesktopIcon;
    }
  };

  const getComponentTypeColor = (type: string) => {
    switch (type) {
      case 'header':
        return 'bg-primary-100 text-primary-800';
      case 'navigation':
        return 'bg-indigo-100 text-indigo-800';
      case 'content':
        return 'bg-green-100 text-green-800';
      case 'form':
        return 'bg-yellow-100 text-yellow-800';
      case 'button':
        return 'bg-accent-100 text-accent-800';
      case 'modal':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];

  const allocationStrategies = {
    'strategic-only': { strategic: 70, customerDriven: 20, maintenance: 10 },
    'customer-only': { strategic: 20, customerDriven: 70, maintenance: 10 },
    balanced: { strategic: 60, customerDriven: 30, maintenance: 10 },
    custom: newRoadmap.customAllocation,
  };

  // NEW: Memoized data for charts
  const insightsData = useMemo(() => {
    if (!roadmapDetails) {
      return {
        categoryDistribution: [],
        priorityBreakdown: [],
        statusOverview: [],
        quarterlyLoad: [],
      };
    }

    const items = roadmapDetails.items;

    const categoryCounts = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<RoadmapItem['category'], number>);
    const categoryDistribution = Object.entries(categoryCounts).map(
      ([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '),
        value,
      })
    );

    const priorityOrder = ['critical', 'high', 'medium', 'low'];
    const priorityCounts = items.reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1;
      return acc;
    }, {} as Record<RoadmapItem['priority'], number>);
    const priorityBreakdown = priorityOrder.map((p) => ({
      name: p.charAt(0).toUpperCase() + p.slice(1),
      count: priorityCounts[p as RoadmapItem['priority']] || 0,
    }));

    const statusCounts = items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<RoadmapItem['status'], number>);
    const statusOverview = Object.entries(statusCounts).map(
      ([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '),
        value,
      })
    );

    const quarterCounts = items.reduce((acc, item) => {
      const quarter = item.timeframe.quarter;
      acc[quarter] = (acc[quarter] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const quarterlyLoad = Object.entries(quarterCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      categoryDistribution,
      priorityBreakdown,
      statusOverview,
      quarterlyLoad,
    };
  }, [roadmapDetails]);

  // NEW: Colors for charts
  const CHART_COLORS = {
    category: {
      strategic: '#0353A4',
      'customer-driven': '#C58882',
      maintenance: '#8E3B46',
      innovation: '#FB3640',
    },
    priority: {
      critical: '#FB3640',
      high: '#8E3B46',
      medium: '#C58882',
      low: '#0353A4',
    },
    status: {
      proposed: '#6b7280',
      approved: '#0353A4',
      'in-progress': '#C58882',
      completed: '#8E3B46',
      cancelled: '#FB3640',
    },
  };


  // Excel download function
  const downloadExcel = () => {
    if (!roadmapDetails) return;

    const workbook = XLSX.utils.book_new();

    // Tab 1: Roadmap Overview
    const overviewData = [
      ['Roadmap Name', roadmapDetails.name],
      ['Description', roadmapDetails.description],
      ['Type', roadmapDetails.type],
      ['Time Horizon', roadmapDetails.timeHorizon],
      ['Created Date', new Date(roadmapDetails.createdAt).toLocaleDateString()],
      ['Last Updated', new Date(roadmapDetails.updatedAt).toLocaleDateString()],
      ['Total Items', roadmapDetails.items.length],
      [],
      ['Allocation Strategy'],
      ['Strategic', `${roadmapDetails.allocationStrategy.strategic}%`],
      ['Customer-Driven', `${roadmapDetails.allocationStrategy.customerDriven}%`],
      ['Maintenance', `${roadmapDetails.allocationStrategy.maintenance}%`],
    ];
    const overviewWorksheet = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewWorksheet, 'Overview');

    // Tab 2: Complete Timeline
    const timelineData = [
      [
        'Quarter',
        'Title',
        'Description',
        'Category',
        'Priority',
        'Status',
        'Duration',
        'Team Members',
        'Cost Estimate',
        'Strategic Alignment',
        'Customer Impact',
        'Revenue Impact',
        'Risk Level',
        'Success Metrics',
        'Dependencies',
        'Customer Quotes',
      ],
    ];

    roadmapDetails.items.forEach((item) => {
      timelineData.push([
        item.timeframe.quarter,
        item.title,
        item.description,
        item.category,
        item.priority,
        item.status,
        `${item.timeframe.estimatedDuration.value} ${item.timeframe.estimatedDuration.unit}`,
        item.resourceAllocation.teamMembers.toString(),
        `$${item.resourceAllocation.estimatedCost.toLocaleString()}`,
        item.businessJustification.strategicAlignment.toString(),
        item.businessJustification.customerImpact.toString(),
        item.businessJustification.revenueImpact.toString(),
        item.businessJustification.riskLevel,
        item.successMetrics.join('; '),
        item.dependencies.join('; '),
        item.relatedFeedback.map(f => f.customerQuotes.join('; ')).join(' | '),
      ]);
    });

    const timelineWorksheet = XLSX.utils.aoa_to_sheet(timelineData);
    XLSX.utils.book_append_sheet(workbook, timelineWorksheet, 'Complete Timeline');

    // Tab 3-6: By Quarter
    const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];
    quarters.forEach((quarter) => {
      const quarterItems = roadmapDetails.items.filter(
        (item) => item.timeframe.quarter === quarter
      );

      if (quarterItems.length > 0) {
        const quarterData = [
          [
            'Title',
            'Description',
            'Category',
            'Priority',
            'Status',
            'Duration',
            'Team Members',
            'Cost Estimate',
            'Success Metrics',
          ],
        ];

        quarterItems.forEach((item) => {
          quarterData.push([
            item.title,
            item.description,
            item.category,
            item.priority,
            item.status,
            `${item.timeframe.estimatedDuration.value} ${item.timeframe.estimatedDuration.unit}`,
            item.resourceAllocation.teamMembers.toString(),
            `$${item.resourceAllocation.estimatedCost.toLocaleString()}`,
            item.successMetrics.join('; '),
          ]);
        });

        const quarterWorksheet = XLSX.utils.aoa_to_sheet(quarterData);
        XLSX.utils.book_append_sheet(workbook, quarterWorksheet, quarter);
      }
    });

    // Tab 7-10: By Category
    const categories = ['strategic', 'customer-driven', 'maintenance', 'innovation'];
    categories.forEach((category) => {
      const categoryItems = roadmapDetails.items.filter(
        (item) => item.category === category
      );

      if (categoryItems.length > 0) {
        const categoryData = [
          [
            'Quarter',
            'Title',
            'Description',
            'Priority',
            'Status',
            'Duration',
            'Team Members',
            'Cost Estimate',
            'Strategic Alignment',
            'Customer Impact',
            'Revenue Impact',
            'Risk Level',
          ],
        ];

        categoryItems.forEach((item) => {
          categoryData.push([
            item.timeframe.quarter,
            item.title,
            item.description,
            item.priority,
            item.status,
            `${item.timeframe.estimatedDuration.value} ${item.timeframe.estimatedDuration.unit}`,
            item.resourceAllocation.teamMembers.toString(),
            `$${item.resourceAllocation.estimatedCost.toLocaleString()}`,
            item.businessJustification.strategicAlignment.toString(),
            item.businessJustification.customerImpact.toString(),
            item.businessJustification.revenueImpact.toString(),
            item.businessJustification.riskLevel,
          ]);
        });

        const categoryWorksheet = XLSX.utils.aoa_to_sheet(categoryData);
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ');
        XLSX.utils.book_append_sheet(workbook, categoryWorksheet, categoryName);
      }
    });

    // Tab 11: Analytics Summary
    const analyticsData = [
      ['Analytics Summary'],
      [],
      ['Status Distribution'],
      ['Status', 'Count'],
    ];

    const statusCounts = roadmapDetails.items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(statusCounts).forEach(([status, count]) => {
      analyticsData.push([status, count.toString()]);
    });

    analyticsData.push([''], ['Priority Distribution'], ['Priority', 'Count']);

    const priorityCounts = roadmapDetails.items.reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(priorityCounts).forEach(([priority, count]) => {
      analyticsData.push([priority, count.toString()]);
    });

    analyticsData.push([''], ['Category Distribution'], ['Category', 'Count']);

    const categoryCounts = roadmapDetails.items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(categoryCounts).forEach(([category, count]) => {
      analyticsData.push([category, count.toString()]);
    });

    // Add resource allocation summary
    const totalTeamMembers = roadmapDetails.items.reduce(
      (sum, item) => sum + item.resourceAllocation.teamMembers,
      0
    );
    const totalCost = roadmapDetails.items.reduce(
      (sum, item) => sum + item.resourceAllocation.estimatedCost,
      0
    );

    analyticsData.push(
      [''],
      ['Resource Summary'],
      ['Total Team Members', totalTeamMembers.toString()],
      ['Total Estimated Cost', `$${totalCost.toLocaleString()}`],
      ['Average Team Size', (totalTeamMembers / roadmapDetails.items.length).toFixed(1)],
      ['Average Cost per Item', `$${(totalCost / roadmapDetails.items.length).toLocaleString()}`]
    );

    const analyticsWorksheet = XLSX.utils.aoa_to_sheet(analyticsData);
    XLSX.utils.book_append_sheet(workbook, analyticsWorksheet, 'Analytics');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `roadmap-${roadmapDetails.name.replace(/[^a-zA-Z0-9]/g, '_')}-${timestamp}.xlsx`;

    // Download the file
    XLSX.writeFile(workbook, filename);
  };

  // Set page header
  const isNestedInProject = !!params.id; // Check if we're in a nested project route

  useSetPageHeader(
    'Roadmap View',
    isNestedInProject
      ? 'Visualize and manage product roadmaps for this project'
      : 'Visualize and manage product roadmaps',
    <>
      {/* Only show project selector if NOT in nested project route */}
      {projects.length > 0 && !isNestedInProject && (
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
          className="w-48"
          label=""
        />
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
          className="w-48"
          label=""
        />
      )}
      <button
        onClick={() => setShowCreateForm(true)}
        disabled={!selectedProject}
        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-accent-500 hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <SparklesIcon className="h-4 w-4 mr-2" />
        Generate Roadmap
      </button>
    </>,
    [selectedProject, projects, selectedRoadmap, roadmaps, isNestedInProject]
  );

  return (
    <div className="space-y-8">
      {!selectedProject && (
        <div className="text-center py-16">
          <MapIcon className="mx-auto h-14 w-14 text-primary-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No project selected
          </h3>
          <p className="mt-2 text-base text-gray-500">
            Select a project to view and manage roadmaps.
          </p>
        </div>
      )}

      {selectedProject && (
        <>
          {/* Generate Roadmap Form */}
          {showCreateForm && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
              <div className="bg-white shadow-2xl rounded-2xl border border-primary-100 p-8">
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
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
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
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                      className="px-4 py-2 border border-transparent rounded-lg text-white bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
          {!selectedRoadmap && isLoadingRoadmaps && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
              <div className="text-center py-16">
                <ArrowPathIcon className="mx-auto h-10 w-10 text-blue-400 animate-spin" />
                <p className="mt-4 text-base text-gray-500">Loading roadmaps...</p>
              </div>
            </div>
          )}
          {!selectedRoadmap && !isLoadingRoadmaps && roadmaps.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
              <div className="bg-white shadow-2xl rounded-2xl border border-primary-100 p-8">
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
                        className="relative bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 flex flex-col group overflow-hidden min-h-[180px]"
                      >
                        <div className="flex flex-col flex-1 p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <MapIcon className="h-5 w-5 text-primary-400" />
                            <span className="text-base font-bold text-gray-900 truncate group-hover:text-accent-600 transition-colors">
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
                              <span className="inline-flex items-center gap-1 bg-secondary-100 text-secondary-700 rounded px-2 py-0.5 font-semibold border border-secondary-200">
                                <span className="font-bold">Project:</span>{' '}
                                {project.name}
                              </span>
                            )}
                          </div>
                          <div className="flex-1" />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => setSelectedRoadmap(roadmap._id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-lg text-primary-700 bg-primary-100 hover:bg-primary-200"
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
          {selectedRoadmap && isLoadingRoadmap && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
              <div className="text-center py-16">
                <ArrowPathIcon className="mx-auto h-10 w-10 text-blue-400 animate-spin" />
                <p className="mt-4 text-base text-gray-500">Loading roadmap details...</p>
              </div>
            </div>
          )}
          {selectedRoadmap && !isLoadingRoadmap && roadmapDetails && (
            <>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
                <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-primary-100">
                  {/* Header Section */}
                  <div className="px-8 py-6 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                          <span className="bg-primary-100 text-primary-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full">
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
                      <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-100 shadow-sm">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="h-3 w-3 rounded-full bg-primary-500"></div>
                          <span className="text-sm font-medium text-primary-800">
                            Strategic
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-primary-900 mt-2">
                          {roadmapDetails.allocationStrategy.strategic}%
                        </div>
                        <div className="mt-2 h-2 w-full bg-primary-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-600 rounded-full"
                            style={{
                              width: `${roadmapDetails.allocationStrategy.strategic}%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Customer-Driven */}
                      <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-4 border border-secondary-100 shadow-sm">
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
                      <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-4 border border-accent-100 shadow-sm">
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
              {/* UPDATED: View Mode Toggle */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                <div className="flex justify-center">
                  <div className="bg-white rounded-xl shadow-lg p-1 flex border border-primary-100">
                    {[
                      { key: 'timeline', label: 'Timeline', icon: CalendarIcon },
                      { key: 'kanban', label: 'Kanban', icon: ChartBarIcon },
                      { key: 'list', label: 'List', icon: ClockIcon },
                      { key: 'insights', label: 'Insights', icon: ChartPieIcon }, // Added Insights tab
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() =>
                          setViewMode(
                            key as 'timeline' | 'kanban' | 'list' | 'insights'
                          )
                        }
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${viewMode === key
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-500 hover:text-gray-700'
                          }`}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={downloadExcel}
                    disabled={!roadmapDetails}
                    className="inline-flex items-center ml-3 rounded-xl shadow-lg border px-5 py-2 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-accent-500 hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Download Excel
                  </button>
                </div>

              </div>

              {/* Timeline, Kanban, and List views remain unchanged */}
              {/* Timeline View */}
              {viewMode === 'timeline' && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                  {quarters.map((quarter) => {
                    const items = getQuarterItems(quarter);
                    if (items.length === 0) return null;

                    return (
                      <div
                        key={quarter}
                        className="bg-white shadow-2xl rounded-2xl border border-primary-100"
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
                                className="border text-left border-gray-200 rounded-xl p-4 hover:bg-primary-50/60 transition-colors duration-200"
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
                                        {
                                          item.timeframe.estimatedDuration.value
                                        }{' '}
                                        {item.timeframe.estimatedDuration.unit}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {item.resourceAllocation.teamMembers} team
                                        members
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
                                    className={`text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${getStatusColor(
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
                                className={`bg-white shadow-2xl rounded-2xl border border-primary-100 min-h-[120px] transition-all ${snapshot.isDraggingOver
                                  ? 'ring-2 ring-primary-400'
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
                                          className={`border border-gray-200 rounded-xl p-3 bg-white transition-shadow ${snapshot.isDragging
                                            ? 'shadow-xl ring-2 ring-primary-400'
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
                  <div className="bg-white shadow-2xl rounded-2xl border border-primary-100 overflow-hidden">
                    <ul className="divide-y divide-gray-100">
                      {roadmapDetails.items.map((item) => (
                        <li
                          key={item._id}
                          className="px-8 py-6 hover:bg-primary-50/60 transition-colors duration-200"
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
                              className={`text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${getStatusColor(
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
                  <MapIcon className="mx-auto h-14 w-14 text-primary-300" />
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
      )
      }

      {/* NEW: Insights View */}
      {
        viewMode === 'insights' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Insights Mode Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-white rounded-xl shadow-lg p-1 flex border border-primary-100">
                {[
                  { key: 'analytics', label: 'Analytics', icon: ChartPieIcon },
                  { key: 'wireframes', label: 'Wireframes', icon: ComputerDesktopIcon },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setInsightsMode(key as 'analytics' | 'wireframes')}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${insightsMode === key
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Analytics View */}
            {insightsMode === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Distribution Chart */}
                <div className="bg-white shadow-2xl rounded-2xl border border-primary-100 p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Category Distribution
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={insightsData.categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                        }
                      >
                        {insightsData.categoryDistribution.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                CHART_COLORS.category[
                                entry.name
                                  .toLowerCase()
                                  .replace(' ', '-') as keyof typeof CHART_COLORS.category
                                ]
                              }
                            />
                          )
                        )}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Priority Breakdown Chart */}
                <div className="bg-white shadow-2xl rounded-2xl border border-primary-100 p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Priority Breakdown
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={insightsData.priorityBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count">
                        {insightsData.priorityBreakdown.map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                CHART_COLORS.priority[
                                entry.name.toLowerCase() as keyof typeof CHART_COLORS.priority
                                ]
                              }
                            />
                          )
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Status Overview Chart */}
                <div className="bg-white shadow-2xl rounded-2xl border border-primary-100 p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Status Overview
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={insightsData.statusOverview}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label
                      >
                        {insightsData.statusOverview.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              CHART_COLORS.status[
                              entry.name
                                .toLowerCase()
                                .replace(' ', '-') as keyof typeof CHART_COLORS.status
                              ]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Quarterly Load Chart */}
                <div className="bg-white shadow-2xl rounded-2xl border border-primary-100 p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Quarterly Load (# of Items)
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={insightsData.quarterlyLoad}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Wireframes View */}
            {insightsMode === 'wireframes' && (
              <div className="space-y-8">
                {/* Wireframes Header */}
                <div className="bg-white shadow-2xl rounded-2xl border border-primary-100 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">
                        UI Wireframes
                      </h4>
                      <p className="text-sm text-gray-600">
                        Generate wireframes based on roadmap items for visual planning
                      </p>
                    </div>
                    <button
                      onClick={generateWireframes}
                      disabled={isGeneratingWireframes || !roadmapDetails}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-accent-500 hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <SparklesIcon className="h-4 w-4 mr-2" />
                      {isGeneratingWireframes ? 'Generating...' : 'Generate Wireframes'}
                    </button>
                  </div>
                </div>

                {/* Wireframes List */}
                {wireframes.length > 0 && (
                  <div className="space-y-6">
                    {/* Wireframes Overview */}
                    <div className="bg-white shadow-2xl rounded-2xl border border-primary-100 p-6">
                      <h5 className="text-md font-semibold text-gray-800 mb-4">
                        Generated Wireframes ({wireframes.length})
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {wireframes.map((wireframe) => {
                          const DeviceIcon = getDeviceIcon(wireframe.device);
                          return (
                            <div
                              key={wireframe.id}
                              className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${selectedWireframe === wireframe.id
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-primary-300 hover:bg-primary-25'
                                }`}
                              onClick={() => setSelectedWireframe(wireframe.id)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <DeviceIcon className="h-5 w-5 text-primary-600" />
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${wireframe.category === 'feature'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-purple-100 text-purple-800'
                                    }`}
                                >
                                  {wireframe.category.replace('-', ' ')}
                                </span>
                              </div>
                              <h6 className="text-sm font-medium text-gray-900 mb-1">
                                {wireframe.name}
                              </h6>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{wireframe.device}</span>
                                <span>{wireframe.estimatedEffort}h effort</span>
                              </div>
                              <div className="mt-2 text-xs text-gray-600">
                                {wireframe.components.length} components • {wireframe.relatedQuarter}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Selected Wireframe Details */}
                    {selectedWireframe && (
                      <div className="bg-white shadow-2xl rounded-2xl border border-primary-100 p-6">
                        {(() => {
                          const wireframe = wireframes.find(w => w.id === selectedWireframe);
                          if (!wireframe) return null;
                          const DeviceIcon = getDeviceIcon(wireframe.device);

                          return (
                            <>
                              <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                  <DeviceIcon className="h-6 w-6 text-primary-600" />
                                  <div>
                                    <h5 className="text-lg font-semibold text-gray-800">
                                      {wireframe.name}
                                    </h5>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                      <span className="capitalize">{wireframe.device}</span>
                                      <span>•</span>
                                      <span>{wireframe.relatedQuarter}</span>
                                      <span>•</span>
                                      <span>{wireframe.estimatedEffort}h estimated effort</span>
                                    </div>
                                  </div>
                                </div>
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${wireframe.category === 'feature'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-purple-100 text-purple-800'
                                    }`}
                                >
                                  {wireframe.category.replace('-', ' ')}
                                </span>
                              </div>

                              <div>
                                <h6 className="text-md font-semibold text-gray-700 mb-4">
                                  Components ({wireframe.components.length})
                                </h6>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {wireframe.components.map((component) => (
                                    <div
                                      key={component.id}
                                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <h6 className="text-sm font-medium text-gray-900">
                                          {component.title}
                                        </h6>
                                        <span
                                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getComponentTypeColor(
                                            component.type
                                          )}`}
                                        >
                                          {component.type}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-600 mb-2">
                                        {component.description}
                                      </p>
                                      <div className="flex items-center justify-between">
                                        <span
                                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                            component.priority
                                          )}`}
                                        >
                                          {component.priority} priority
                                        </span>
                                        {component.dependencies.length > 0 && (
                                          <span className="text-xs text-gray-500">
                                            {component.dependencies.length} dependencies
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State for Wireframes */}
                {wireframes.length === 0 && (
                  <div className="bg-white shadow-2xl rounded-2xl border border-primary-100 p-12">
                    <div className="text-center">
                      <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">
                        No wireframes generated
                      </h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Click "Generate Wireframes" to create UI wireframes based on your roadmap items.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      }
    </div >
  );
};

export default RoadmapView;
