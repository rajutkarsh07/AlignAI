import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add loading indicator for requests
    if (config.showLoading !== false) {
      // You can add a global loading state here
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
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    
    // Show error toast
    if (error.response?.status !== 401) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// Project API
export const projectAPI = {
  getCurrent: () => api.get('/projects'),
  createOrUpdate: (data) => api.post('/projects', data),
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post('/projects/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getContext: () => api.get('/projects/context'),
  updateGoals: (goals) => api.put('/projects/goals', { goals }),
  updateTimeline: (timeline) => api.put('/projects/timeline', { timeline }),
  getStats: () => api.get('/projects/stats'),
  delete: () => api.delete('/projects'),
};

// Feedback API
export const feedbackAPI = {
  getAll: (params) => api.get('/feedback', { params }),
  getActive: () => api.get('/feedback/active'),
  add: (data) => api.post('/feedback', data),
  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('document', file);
    return api.post('/feedback/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getContext: () => api.get('/feedback/context'),
  getStats: () => api.get('/feedback/stats'),
  updateStatus: (id, status) => api.put(`/feedback/${id}/status`, { status }),
  update: (id, data) => api.put(`/feedback/${id}`, data),
  delete: (id) => api.delete(`/feedback/${id}`),
  bulkUpdateStatus: (feedbackIds, status) => 
    api.put('/feedback/bulk-status', { feedbackIds, status }),
};

// Tasks API
export const tasksAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getByStatus: (status) => api.get(`/tasks/status/${status}`),
  getOverdue: () => api.get('/tasks/overdue'),
  getStats: () => api.get('/tasks/stats'),
  create: (data) => api.post('/tasks', data),
  createWithAI: (data) => api.post('/tasks/with-ai', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => api.put(`/tasks/${id}/status`, { status }),
  addComment: (id, author, content) => 
    api.post(`/tasks/${id}/comments`, { author, content }),
  delete: (id) => api.delete(`/tasks/${id}`),
  bulkUpdateStatus: (taskIds, status) => 
    api.put('/tasks/bulk-status', { taskIds, status }),
};

// AI API
export const aiAPI = {
  chat: (messages) => api.post('/ai/chat', { messages }),
  generateRoadmap: (request) => api.post('/ai/roadmap', { request }),
  suggestTaskEnhancements: (taskDescription) => 
    api.post('/ai/suggest-task', { taskDescription }),
  analyzeFeedback: (feedbackContent) => 
    api.post('/ai/analyze-feedback', { feedbackContent }),
  getInsights: () => api.get('/ai/insights'),
  generateTaskFromFeedback: (feedbackId) => 
    api.get(`/ai/feedback/${feedbackId}/task`),
};

// Upload API
export const uploadAPI = {
  uploadSingle: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultiple: (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (filename) => api.delete(`/upload/${filename}`),
  getList: () => api.get('/upload/list'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

// Utility functions
export const handleAPIError = (error, customMessage = null) => {
  const message = customMessage || 
    error.response?.data?.message || 
    error.message || 
    'An error occurred';
  
  toast.error(message);
  console.error('API Error:', error);
  
  return {
    success: false,
    message,
    error: error.response?.data || error,
  };
};

export const handleAPISuccess = (response, customMessage = null) => {
  const message = customMessage || response.data?.message || 'Operation successful';
  
  if (customMessage !== false) {
    toast.success(message);
  }
  
  return {
    success: true,
    data: response.data,
    message,
  };
};

// File upload helpers
export const uploadFile = async (file, type = 'general') => {
  try {
    let response;
    
    switch (type) {
      case 'project':
        response = await projectAPI.uploadDocument(file);
        break;
      case 'feedback':
        response = await feedbackAPI.uploadDocument(file);
        break;
      default:
        response = await uploadAPI.uploadSingle(file);
    }
    
    return handleAPISuccess(response, 'File uploaded successfully');
  } catch (error) {
    return handleAPIError(error, 'Failed to upload file');
  }
};

// Data fetching helpers
export const fetchWithLoading = async (apiCall, setLoading, setData, setError) => {
  try {
    setLoading(true);
    setError(null);
    const response = await apiCall();
    setData(response.data);
    return response.data;
  } catch (error) {
    const errorData = handleAPIError(error);
    setError(errorData);
    return null;
  } finally {
    setLoading(false);
  }
};

export default api; 