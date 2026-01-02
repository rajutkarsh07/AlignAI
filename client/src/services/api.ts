import axios from 'axios';

const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5001/api'
    : process.env.REACT_APP_API_URL;

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  officialPlan: string;
  formattedPlan?: string;
  goals: Goal[];
  metadata: {
    industry?: string;
    teamSize?: number;
    budget?: string;
    timeline?: string;
    stakeholders?: string[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Goal {
  _id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  targetQuarter?: string;
  status: 'planned' | 'in-progress' | 'completed' | 'on-hold';
}

export interface FeedbackItem {
  _id: string;
  content: string;
  source: string;
  category: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  priority: 'critical' | 'high' | 'medium' | 'low';
  tags: string[];
  isIgnored: boolean;
  customerInfo?: {
    userId?: string;
    email?: string;
    name?: string;
    segment?: string;
  };
  extractedKeywords: string[];
  aiAnalysis: {
    summary: string;
    actionableItems: string[];
    relatedFeatures: string[];
    urgencyScore: number;
  };
  createdAt: string;
}

export interface FeedbackCollection {
  _id: string;
  projectId: string;
  name: string;
  description?: string;
  feedbackItems: FeedbackItem[];
  summary: {
    totalItems: number;
    categoryBreakdown: Record<string, number>;
    sentimentBreakdown: Record<string, number>;
    topKeywords: Array<{ keyword: string; frequency: number }>;
    actionableInsights: string[];
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface Task {
  _id: string;
  projectId: string;
  title: string;
  description: string;
  enhancedDescription?: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  estimatedEffort?: {
    value: number;
    unit: string;
  };
  actualEffort?: {
    value: number;
    unit: string;
  };
  assignedTo?: {
    name: string;
    email: string;
    role: string;
  };
  dependencies: Array<{
    taskId: string;
    type: string;
  }>;
  tags: string[];
  timeline: {
    plannedStartDate?: string;
    plannedEndDate?: string;
    actualStartDate?: string;
    actualEndDate?: string;
  };
  businessValue: {
    customerImpact: string;
    revenueImpact: string;
    strategicAlignment: number;
  };
  aiSuggestions?: {
    enhancementRecommendations: string[];
    riskAssessment: string;
    resourceRequirements: string[];
    successMetrics: string[];
  };
  acceptanceCriteria: string[];
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatSession {
  _id: string;
  projectId: string;
  sessionId: string;
  title: string;
  messages: ChatMessage[];
  context: {
    currentAgent: string;
    lastQuery: string;
    activeFilters: {
      priority: string[];
      category: string[];
      timeframe: string;
    };
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: {
    agent?: string;
    generatedRoadmap?: string;
    relatedTasks?: string[];
    searchResults?: string[];
    processingTime?: number;
  };
  timestamp: string;
}

export interface Roadmap {
  _id: string;
  projectId: string;
  name: string;
  description?: string;
  type: 'strategic-only' | 'customer-only' | 'balanced' | 'custom';
  timeHorizon: 'quarter' | 'half-year' | 'year' | 'multi-year';
  allocationStrategy: {
    strategic: number;
    customerDriven: number;
    maintenance: number;
  };
  items: RoadmapItem[];
  generationContext?: {
    userQuery: string;
    aiModel: string;
    generationTime: string;
    parameters: {
      focusAreas: string[];
      constraints: string[];
      priorities: string[];
    };
  };
  analytics: {
    totalItems: number;
    completionRate: number;
    riskScore: number;
    customerSatisfactionPotential: number;
  };
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapItem {
  _id: string;
  taskId?: string;
  title: string;
  description?: string;
  category: 'strategic' | 'customer-driven' | 'maintenance' | 'innovation';
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeframe: {
    quarter?: string;
    startDate?: string;
    endDate?: string;
    estimatedDuration: {
      value: number;
      unit: string;
    };
  };
  resourceAllocation: {
    percentage: number;
    teamMembers?: number;
    estimatedCost?: number;
  };
  dependencies: string[];
  relatedFeedback: Array<{
    feedbackId: string;
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
}

// API Functions
export const projectsApi = {
  getAll: (params?: any): Promise<ApiResponse<Project[]>> =>
    api.get('/projects', { params }),

  getById: (id: string): Promise<ApiResponse<Project>> =>
    api.get(`/projects/${id}`),

  create: (data: Partial<Project>): Promise<ApiResponse<Project>> =>
    api.post('/projects', data),

  createFromUpload: (formData: FormData): Promise<ApiResponse<Project>> =>
    api.post('/projects/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: Partial<Project>): Promise<ApiResponse<Project>> =>
    api.put(`/projects/${id}`, data),

  delete: (id: string): Promise<ApiResponse> => api.delete(`/projects/${id}`),

  addGoal: (id: string, goal: Partial<Goal>): Promise<ApiResponse<Project>> =>
    api.post(`/projects/${id}/goals`, goal),

  updateGoal: (
    id: string,
    goalId: string,
    data: Partial<Goal>
  ): Promise<ApiResponse<Project>> =>
    api.put(`/projects/${id}/goals/${goalId}`, data),

  deleteGoal: (id: string, goalId: string): Promise<ApiResponse<Project>> =>
    api.delete(`/projects/${id}/goals/${goalId}`),
};

export const feedbackApi = {
  getByProject: (projectId: string, params?: any): Promise<ApiResponse> =>
    api.get(`/feedback/project/${projectId}`, { params }),

  getById: (id: string): Promise<ApiResponse<FeedbackCollection>> =>
    api.get(`/feedback/${id}`),

  create: (data: any): Promise<ApiResponse<FeedbackCollection>> =>
    api.post('/feedback', data),

  createFromUpload: (
    formData: FormData
  ): Promise<ApiResponse<FeedbackCollection>> =>
    api.post('/feedback/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: any): Promise<ApiResponse<FeedbackCollection>> =>
    api.put(`/feedback/${id}`, data),

  toggleIgnore: (
    id: string,
    itemId: string,
    isIgnored: boolean
  ): Promise<ApiResponse<FeedbackCollection>> =>
    api.put(`/feedback/${id}/items/${itemId}/ignore`, { isIgnored }),

  delete: (id: string): Promise<ApiResponse> => api.delete(`/feedback/${id}`),

  getAnalytics: (projectId: string): Promise<ApiResponse> =>
    api.get(`/feedback/project/${projectId}/analytics`),
};

export const tasksApi = {
  getByProject: (projectId: string, params?: any): Promise<ApiResponse> =>
    api.get(`/tasks/project/${projectId}`, { params }),

  getById: (id: string): Promise<ApiResponse<Task>> => api.get(`/tasks/${id}`),

  create: (data: Partial<Task>): Promise<ApiResponse<Task>> =>
    api.post('/tasks', data),

  createEnhanced: (data: any): Promise<ApiResponse<Task>> =>
    api.post('/tasks/enhance', data),

  update: (id: string, data: Partial<Task>): Promise<ApiResponse<Task>> =>
    api.put(`/tasks/${id}`, data),

  delete: (id: string): Promise<ApiResponse> => api.delete(`/tasks/${id}`),

  addDependency: (id: string, data: any): Promise<ApiResponse<Task>> =>
    api.post(`/tasks/${id}/dependencies`, data),

  removeDependency: (
    id: string,
    dependencyId: string
  ): Promise<ApiResponse<Task>> =>
    api.delete(`/tasks/${id}/dependencies/${dependencyId}`),

  getAnalytics: (projectId: string): Promise<ApiResponse> =>
    api.get(`/tasks/project/${projectId}/analytics`),

  getKanban: (projectId: string): Promise<ApiResponse> =>
    api.get(`/tasks/project/${projectId}/kanban`),
};

export const chatApi = {
  getSessionsByProject: (
    projectId: string,
    params?: any
  ): Promise<ApiResponse<ChatSession[]>> =>
    api.get(`/chat/project/${projectId}/sessions`, { params }),

  getSession: (sessionId: string): Promise<ApiResponse<ChatSession>> =>
    api.get(`/chat/sessions/${sessionId}`),

  createSession: (data: any): Promise<ApiResponse<ChatSession>> =>
    api.post('/chat/sessions', data),

  sendMessage: (sessionId: string, data: any): Promise<ApiResponse> =>
    api.post(`/chat/sessions/${sessionId}/messages`, data),

  updateSession: (
    sessionId: string,
    data: any
  ): Promise<ApiResponse<ChatSession>> =>
    api.put(`/chat/sessions/${sessionId}`, data),

  deleteSession: (sessionId: string): Promise<ApiResponse> =>
    api.delete(`/chat/sessions/${sessionId}`),

  clearSession: (sessionId: string): Promise<ApiResponse<ChatSession>> =>
    api.post(`/chat/sessions/${sessionId}/clear`),

  exportSession: (sessionId: string, format: 'json' | 'txt'): Promise<any> =>
    api.get(`/chat/sessions/${sessionId}/export?format=${format}`),
};

export const roadmapApi = {
  getByProject: (
    projectId: string,
    params?: any
  ): Promise<ApiResponse<Roadmap[]>> =>
    api.get(`/roadmap/project/${projectId}`, { params }),

  getById: (id: string): Promise<ApiResponse<Roadmap>> =>
    api.get(`/roadmap/${id}`),

  generate: (data: any): Promise<ApiResponse<Roadmap>> =>
    api.post('/roadmap/generate', data),

  create: (data: Partial<Roadmap>): Promise<ApiResponse<Roadmap>> =>
    api.post('/roadmap', data),

  update: (id: string, data: Partial<Roadmap>): Promise<ApiResponse<Roadmap>> =>
    api.put(`/roadmap/${id}`, data),

  delete: (id: string): Promise<ApiResponse> => api.delete(`/roadmap/${id}`),

  addItem: (id: string, item: any): Promise<ApiResponse<Roadmap>> =>
    api.post(`/roadmap/${id}/items`, item),

  updateItem: (
    id: string,
    itemId: string,
    data: any
  ): Promise<ApiResponse<Roadmap>> =>
    api.put(`/roadmap/${id}/items/${itemId}`, data),

  deleteItem: (id: string, itemId: string): Promise<ApiResponse<Roadmap>> =>
    api.delete(`/roadmap/${id}/items/${itemId}`),

  convertToTasks: (id: string, itemIds?: string[]): Promise<ApiResponse> =>
    api.post(`/roadmap/${id}/convert-to-tasks`, { itemIds }),

  getTimeline: (id: string): Promise<ApiResponse> =>
    api.get(`/roadmap/${id}/timeline`),

  getAnalytics: (projectId: string): Promise<ApiResponse> =>
    api.get(`/roadmap/project/${projectId}/analytics`),
};

export default api;
