import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import {
  PlusIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowUpIcon,
  SparklesIcon,
  EyeIcon,
  TrashIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import CustomSelect from '../components/CustomSelect';

interface FeedbackItem {
  _id: string;
  content: string;
  source: string;
  category: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  priority: 'critical' | 'high' | 'medium' | 'low';
  isIgnored: boolean;
  createdAt: string;
  feedbackDocId?: string;
  feedbackDocName?: string;
  extractedKeywords?: string[];
  aiAnalysis?: {
    summary: string;
    actionableItems: string[];
    relatedFeatures: string[];
    urgencyScore: number;
  };
  projectId?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'enhancing' | 'completed' | 'error';
  progress: number;
  extractedText?: string;
  feedbackItems?: FeedbackItem[];
  error?: string;
}

const FeedbackManagement: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(
    projectId || ''
  );
  const [newFeedback, setNewFeedback] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [showAiAnalysis, setShowAiAnalysis] = useState<boolean>(true);

  useEffect(() => {
    loadProjects();
    if (selectedProject) {
      loadFeedback();
    } else {
      loadAllFeedback();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const response: any = await api.get('/projects');
      if (response.success) {
        setProjects(response.data);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadFeedback = async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      const response: any = await api.get(
        `/feedback/project/${selectedProject}`
      );
      if (response.success) {
        setFeedback(response.data);
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllFeedback = async () => {
    try {
      setLoading(true);
      const response: any = await api.get('/feedback');
      if (response.success) {
        setFeedback(response.data);
      }
    } catch (error) {
      console.error('Error loading all feedback:', error);
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    if (!selectedProject) {
      alert('Please select a project first before uploading files.');
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        alert(
          `Invalid file type: ${file.name}. Please upload only PDF, DOC, or DOCX files.`
        );
        return;
      }

      if (file.size > maxSize) {
        alert(
          `File too large: ${file.name}. Please upload files smaller than 10MB.`
        );
        return;
      }

      const fileId =
        Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0,
      };

      setUploadedFiles((prev) => [...prev, newFile]);
      uploadFile(file, fileId);
    });
  };

  const uploadFile = async (file: File, fileId: string) => {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('projectId', selectedProject);

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status: 'processing', progress: 50 } : f
        )
      );

      const response: any = await api.post('/feedback/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, progress } : f))
          );
        },
      });

      if (response.success) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: 'completed',
                  progress: 100,
                  feedbackItems: response.data.feedbackItems,
                  extractedText: response.data.extractedText,
                }
              : f
          )
        );
        await loadFeedback();
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed',
              }
            : f
        )
      );
    }
  };

  const enhanceFeedback = async (fileId: string) => {
    try {
      const file = uploadedFiles.find((f) => f.id === fileId);
      if (!file) return;

      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: 'enhancing' } : f))
      );

      const response: any = await api.post('/feedback/enhance', {
        projectId: selectedProject,
        rawText: file.extractedText || '',
        fileName: file.name,
      });

      if (response.success) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: 'completed',
                  feedbackItems: response.data.feedbackItems,
                }
              : f
          )
        );
        await loadFeedback();
      }
    } catch (error) {
      console.error('Error enhancing feedback:', error);
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: 'error',
                error:
                  error instanceof Error ? error.message : 'Enhancement failed',
              }
            : f
        )
      );
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const addFeedback = async () => {
    if (!newFeedback.trim()) return;

    try {
      const response: any = await api.post('/feedback', {
        projectId: selectedProject,
        content: newFeedback.trim(),
        source: 'manual',
      });

      if (response.success) {
        await loadFeedback();
        setNewFeedback('');
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding feedback:', error);
      // Fallback to local state update if API fails
      const newItem: FeedbackItem = {
        _id: Date.now().toString(),
        content: newFeedback.trim(),
        source: 'manual',
        category: 'other',
        sentiment: 'neutral',
        priority: 'medium',
        isIgnored: false,
        createdAt: new Date().toISOString(),
      };
      setFeedback((prev) => [newItem, ...prev]);
      setNewFeedback('');
      setShowAddForm(false);
    }
  };

  const toggleIgnore = async (id: string) => {
    try {
      const response: any = await api.put(`/feedback/${id}/ignore`, {
        isIgnored: !feedback.find((item) => item._id === id)?.isIgnored,
      });

      if (response.success) {
        setFeedback((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, isIgnored: !item.isIgnored } : item
          )
        );
      }
    } catch (error) {
      console.error('Error toggling ignore status:', error);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'negative':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
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
      case 'uploading':
        return 'text-blue-600';
      case 'processing':
        return 'text-yellow-600';
      case 'enhancing':
        return 'text-purple-600';
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredFeedback = feedback.filter((item) => {
    if (filterSentiment !== 'all' && item.sentiment !== filterSentiment)
      return false;
    if (filterPriority !== 'all' && item.priority !== filterPriority)
      return false;
    if (filterSource !== 'all' && item.source !== filterSource) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg rounded-b-2xl">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-3xl font-extrabold leading-8 text-gray-900 sm:text-4xl sm:tracking-tight">
                Feedback Management
              </h2>
              <p className="mt-2 text-base text-gray-500">
                Collect and analyze customer feedback with AI-powered insights
              </p>
            </div>
            <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
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
                className="w-64"
                label=""
              />
              <button
                onClick={() => setShowUploadForm(true)}
                className="inline-flex items-center px-5 py-2 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition"
              >
                <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                Upload
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-5 py-2 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Feedback
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow-lg rounded-xl hover:scale-105 transition-transform duration-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
                  <DocumentTextIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Feedback
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {feedback.length}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl hover:scale-105 transition-transform duration-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Positive
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {feedback.filter((f) => f.sentiment === 'positive').length}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl hover:scale-105 transition-transform duration-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Negative
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {feedback.filter((f) => f.sentiment === 'negative').length}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-lg rounded-xl hover:scale-105 transition-transform duration-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-orange-100 rounded-md p-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    High Priority
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {
                      feedback.filter(
                        (f) =>
                          f.priority === 'critical' || f.priority === 'high'
                      ).length
                    }
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/90 shadow-lg rounded-xl p-6 mb-8 sticky top-4 z-10 border border-blue-100">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sentiment
              </label>
              <CustomSelect
                value={filterSentiment}
                onChange={(e) => setFilterSentiment(e.target.value)}
                options={[
                  { value: 'all', label: 'All Sentiments' },
                  { value: 'positive', label: 'Positive' },
                  { value: 'negative', label: 'Negative' },
                  { value: 'neutral', label: 'Neutral' },
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <CustomSelect
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                options={[
                  { value: 'all', label: 'All Sources' },
                  ...Array.from(
                    new Set(feedback.map((item) => item.source))
                  ).map((source) => ({
                    value: source,
                    label: source,
                  })),
                ]}
              />
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white/90 shadow-xl overflow-hidden sm:rounded-2xl border border-blue-100">
          <div className="px-6 py-6 sm:px-8 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-xl leading-7 font-semibold text-gray-900">
                Recent Feedback
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Showing {filteredFeedback.length} of {feedback.length} items
              </p>
            </div>
            <button
              onClick={() => setShowAiAnalysis(!showAiAnalysis)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              {showAiAnalysis ? 'Hide AI Analysis' : 'Show AI Analysis'}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <ArrowPathIcon className="mx-auto h-10 w-10 text-blue-400 animate-spin" />
              <p className="mt-4 text-base text-gray-500">
                Loading feedback...
              </p>
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="text-center py-16">
              <ChatBubbleLeftRightIcon className="mx-auto h-14 w-14 text-blue-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No feedback matches your filters
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Try adjusting your filters or add new feedback.
              </p>
              <div className="mt-8">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-5 py-2 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Feedback
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredFeedback.map((item) => {
                const showProject = !selectedProject;
                const project =
                  showProject && item.projectId
                    ? projects.find((p) => p._id === item.projectId)
                    : null;
                return (
                  <li
                    key={item._id}
                    className={`hover:bg-blue-50/60 transition-colors duration-200 group ${
                      item.isIgnored ? 'opacity-70' : ''
                    }`}
                  >
                    <div className="px-6 py-5 sm:px-8 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getSentimentIcon(item.sentiment)}
                          <p className="text-base font-medium text-blue-700 truncate">
                            {item.content}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${getPriorityColor(
                              item.priority
                            )}`}
                          >
                            {item.priority}
                          </span>
                          <button
                            onClick={() => toggleIgnore(item._id)}
                            className={`text-xs ${
                              item.isIgnored
                                ? 'text-green-600 hover:text-green-500'
                                : 'text-gray-600 hover:text-gray-500'
                            }`}
                          >
                            {item.isIgnored ? 'Unignore' : 'Ignore'}
                          </button>
                        </div>
                      </div>

                      <div className="mt-1 sm:flex sm:justify-between">
                        <div className="sm:flex space-y-2 sm:space-y-0 sm:space-x-4">
                          <div className="flex items-center text-sm text-gray-500">
                            <span>Source: {item.source}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <span>Category: {item.category}</span>
                          </div>
                          {showProject && project && (
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                                {project.name}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-400 sm:mt-0">
                          <span>
                            Created{' '}
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* AI Analysis */}
                      {item.aiAnalysis && showAiAnalysis && (
                        <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <SparklesIcon className="h-4 w-4 text-blue-600" />
                            <h4 className="text-sm font-medium text-blue-900">
                              AI Analysis
                            </h4>
                          </div>
                          <p className="text-sm text-blue-800 mb-2">
                            {item.aiAnalysis.summary}
                          </p>
                          {item.aiAnalysis.actionableItems.length > 0 && (
                            <div className="mb-2">
                              <h5 className="text-xs font-medium text-blue-900 mb-1">
                                Actionable Items:
                              </h5>
                              <ul className="text-xs text-blue-800 space-y-1">
                                {item.aiAnalysis.actionableItems.map(
                                  (action, index) => (
                                    <li
                                      key={index}
                                      className="flex items-start"
                                    >
                                      <span className="mr-1">•</span>
                                      <span>{action}</span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                          {item.extractedKeywords &&
                            item.extractedKeywords.length > 0 && (
                              <div>
                                <h5 className="text-xs font-medium text-blue-900 mb-1">
                                  Keywords:
                                </h5>
                                <div className="flex flex-wrap gap-1">
                                  {item.extractedKeywords.map(
                                    (keyword, index) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                                      >
                                        {keyword}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      {/* Upload Document Modal */}
      {showUploadForm && (
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
                  onClick={() => setShowUploadForm(false)}
                  className="bg-white rounded-full text-gray-400 hover:text-blue-500 focus:outline-none shadow p-1 transition"
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Upload Feedback Document
                  </h3>
                  {!selectedProject ? (
                    <div className="mt-4 text-center">
                      <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Project Required
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 mb-4">
                        Please select a project before uploading feedback
                        documents.
                      </p>
                      <CustomSelect
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        options={projects.map((project) => ({
                          value: project._id,
                          label: project.name,
                        }))}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div className="mt-6 space-y-6">
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 text-center ${
                          dragActive
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-300'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer"
                          >
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Drop files here or click to upload
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              PDF, DOC, DOCX files up to 10MB
                            </span>
                          </label>
                          <input
                            id="file-upload"
                            ref={fileInputRef}
                            type="file"
                            className="sr-only"
                            multiple
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileSelect}
                          />
                        </div>
                      </div>

                      {uploadedFiles.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-900">
                            Uploaded Files
                          </h4>
                          {uploadedFiles.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {file.status === 'uploading' && (
                                  <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                    <span className="text-xs text-blue-600">
                                      Uploading...
                                    </span>
                                  </div>
                                )}
                                {file.status === 'processing' && (
                                  <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-yellow-200 border-t-yellow-600 rounded-full animate-spin"></div>
                                    <span className="text-xs text-yellow-600">
                                      Processing...
                                    </span>
                                  </div>
                                )}
                                {file.status === 'enhancing' && (
                                  <div className="flex items-center space-x-2">
                                    <SparklesIcon className="h-4 w-4 text-purple-600 animate-pulse" />
                                    <span className="text-xs text-purple-600">
                                      Enhancing...
                                    </span>
                                  </div>
                                )}
                                {file.status === 'completed' && (
                                  <div className="flex items-center space-x-2">
                                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                    <span className="text-xs text-green-600">
                                      Completed
                                    </span>
                                  </div>
                                )}
                                {file.status === 'error' && (
                                  <div className="flex items-center space-x-2">
                                    <XCircleIcon className="h-4 w-4 text-red-600" />
                                    <span className="text-xs text-red-600">
                                      Error
                                    </span>
                                  </div>
                                )}
                                {file.status === 'completed' &&
                                  file.feedbackItems && (
                                    <button
                                      onClick={() => enhanceFeedback(file.id)}
                                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-600 hover:text-purple-700"
                                    >
                                      <SparklesIcon className="h-3 w-3 mr-1" />
                                      Enhance
                                    </button>
                                  )}
                                <button
                                  onClick={() => removeFile(file.id)}
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Feedback Modal */}
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
            <div className="inline-block align-bottom bg-white rounded-2xl px-6 pt-7 pb-6 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-8 border border-blue-100">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="bg-white rounded-full text-gray-400 hover:text-blue-500 focus:outline-none shadow p-1 transition"
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Add New Feedback
                  </h3>
                  <div className="mt-6 space-y-6">
                    {!selectedProject && (
                      <div>
                        <label
                          htmlFor="project"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Project
                        </label>
                        <CustomSelect
                          id="project"
                          value={selectedProject}
                          onChange={(e) => setSelectedProject(e.target.value)}
                          options={projects.map((project) => ({
                            value: project._id,
                            label: project.name,
                          }))}
                        />
                      </div>
                    )}
                    <div>
                      <label
                        htmlFor="feedback"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Feedback Content
                      </label>
                      <textarea
                        id="feedback"
                        rows={4}
                        value={newFeedback}
                        onChange={(e) => setNewFeedback(e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                        placeholder="Enter the customer feedback..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  onClick={addFeedback}
                  disabled={!newFeedback.trim()}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                >
                  Add Feedback
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
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

export default FeedbackManagement;
