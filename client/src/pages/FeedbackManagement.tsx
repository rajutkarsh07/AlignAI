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
} from '@heroicons/react/24/outline';

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

  useEffect(() => {
    loadProjects();
    if (selectedProject) {
      loadFeedback();
    } else {
      loadSampleFeedback();
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
      loadSampleFeedback();
    } finally {
      setLoading(false);
    }
  };

  const loadSampleFeedback = () => {
    setLoading(true);
    const sampleFeedback: FeedbackItem[] = [
      {
        _id: '1',
        content:
          'The app is great but the checkout process is too slow. It takes forever to complete a purchase.',
        source: 'App Store Review',
        category: 'bug-report',
        sentiment: 'negative',
        priority: 'high',
        isIgnored: false,
        createdAt: new Date().toISOString(),
        extractedKeywords: ['checkout', 'slow', 'purchase'],
        aiAnalysis: {
          summary:
            'User experiencing slow checkout process affecting purchase completion',
          actionableItems: ['Optimize checkout flow', 'Reduce loading times'],
          relatedFeatures: ['Checkout System', 'Payment Processing'],
          urgencyScore: 7,
        },
      },
      {
        _id: '2',
        content:
          'Love the new UI design! Much more intuitive than before. Keep up the great work!',
        source: 'User Survey',
        category: 'praise',
        sentiment: 'positive',
        priority: 'medium',
        isIgnored: false,
        createdAt: new Date().toISOString(),
        extractedKeywords: ['UI', 'design', 'intuitive'],
        aiAnalysis: {
          summary:
            'Positive feedback about UI redesign and improved user experience',
          actionableItems: [
            'Continue UI improvements',
            'Document successful design patterns',
          ],
          relatedFeatures: ['User Interface', 'Design System'],
          urgencyScore: 3,
        },
      },
    ];
    setFeedback(sampleFeedback);
    setLoading(false);
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

    // Validate file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const invalidFiles = Array.from(files).filter(
      (file) => !allowedTypes.includes(file.type)
    );

    if (invalidFiles.length > 0) {
      alert(
        `Invalid file type(s): ${invalidFiles
          .map((f) => f.name)
          .join(', ')}\n\nPlease upload only PDF, DOC, or DOCX files.`
      );
      return;
    }

    // Validate file sizes (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = Array.from(files).filter(
      (file) => file.size > maxSize
    );

    if (oversizedFiles.length > 0) {
      alert(
        `File(s) too large: ${oversizedFiles
          .map((f) => f.name)
          .join(', ')}\n\nPlease upload files smaller than 10MB.`
      );
      return;
    }

    Array.from(files).forEach((file) => {
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
      formData.append('name', `Feedback from ${file.name}`);
      formData.append('description', `Uploaded document: ${file.name}`);

      // Update status to processing
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
        // Update status to completed
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: 'completed',
                  progress: 100,
                  feedbackItems: response.data.feedbackItems,
                  extractedText: response.data.extractedText, // Store extracted text for enhancement
                }
              : f
          )
        );

        // Reload feedback to show new items
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

      // Update status to enhancing
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

        // Reload feedback to show enhanced items
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
      if (selectedProject) {
        const response: any = await api.post('/feedback', {
          projectId: selectedProject,
          name: `Feedback - ${new Date().toLocaleDateString()}`,
          description: 'Manual feedback entry',
          feedbackItems: [
            {
              content: newFeedback.trim(),
              source: 'manual',
              customerInfo: {},
              tags: [],
            },
          ],
        });

        if (response.success) {
          await loadFeedback();
        }
      } else {
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
      }

      setNewFeedback('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding feedback:', error);
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
      const feedbackItem = feedback.find((item) => item._id === id);
      if (!feedbackItem) return;

      if (selectedProject && feedbackItem.feedbackDocId) {
        const response: any = await api.put(
          `/feedback/${feedbackItem.feedbackDocId}/items/${id}/ignore`,
          { isIgnored: !feedbackItem.isIgnored }
        );

        if (response.success) {
          setFeedback((prev) =>
            prev.map((item) =>
              item._id === id ? { ...item, isIgnored: !item.isIgnored } : item
            )
          );
        }
      } else {
        setFeedback((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, isIgnored: !item.isIgnored } : item
          )
        );
      }
    } catch (error) {
      console.error('Error toggling feedback ignore status:', error);
      setFeedback((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isIgnored: !item.isIgnored } : item
        )
      );
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Feedback Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and analyze customer feedback with AI-powered insights
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
            onClick={() => setShowUploadForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
            Upload Document
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Feedback
          </button>
        </div>
      </div>

      {/* File Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Upload Feedback Document
              </h3>
              <button
                onClick={() => setShowUploadForm(false)}
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

            {!selectedProject ? (
              <div className="text-center py-8">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Project Required
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Please select a project before uploading feedback documents.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
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
                    <label htmlFor="file-upload" className="cursor-pointer">
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

                {/* Uploaded Files List */}
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
                            <p className="text-sm font-medium text-gray-900">
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

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowUploadForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Feedback Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Add New Feedback
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
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
            <div className="space-y-4">
              <textarea
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
                placeholder="Enter customer feedback..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addFeedback}
                className="px-4 py-2 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Feedback
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {feedback.length}
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
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Positive
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {feedback.filter((f) => f.sentiment === 'positive').length}
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
                <XCircleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Negative
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {feedback.filter((f) => f.sentiment === 'negative').length}
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
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    High Priority
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {
                      feedback.filter(
                        (f) =>
                          f.priority === 'critical' || f.priority === 'high'
                      ).length
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Feedback
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Customer feedback and feature requests with AI analysis
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading feedback...</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No feedback
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading a document or adding feedback manually.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {feedback.map((item) => (
              <li
                key={item._id}
                className={`px-4 py-4 ${item.isIgnored ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getSentimentIcon(item.sentiment)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.source}
                        </span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">
                          {item.category}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleIgnore(item._id)}
                        className={`text-sm ${
                          item.isIgnored
                            ? 'text-green-600 hover:text-green-500'
                            : 'text-gray-600 hover:text-gray-500'
                        }`}
                      >
                        {item.isIgnored ? 'Unignore' : 'Ignore'}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-900">{item.content}</p>

                    {/* AI Analysis Display */}
                    {item.aiAnalysis && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <SparklesIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-900">
                            AI Analysis
                          </span>
                        </div>
                        <p className="text-xs text-blue-800 mb-2">
                          {item.aiAnalysis.summary}
                        </p>
                        {item.aiAnalysis.actionableItems.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-blue-900">
                              Actionable Items:
                            </span>
                            <ul className="text-xs text-blue-800 mt-1">
                              {item.aiAnalysis.actionableItems.map(
                                (action, index) => (
                                  <li key={index} className="ml-4 list-disc">
                                    {action}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                        {item.extractedKeywords &&
                          item.extractedKeywords.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.extractedKeywords.map((keyword, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                      </div>
                    )}

                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FeedbackManagement;
