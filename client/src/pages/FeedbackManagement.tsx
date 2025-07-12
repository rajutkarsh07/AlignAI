import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import {
  PlusIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
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
}

const FeedbackManagement: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(projectId || '');
  const [newFeedback, setNewFeedback] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadProjects();
    if (selectedProject) {
      loadFeedback();
    } else {
      // Load sample feedback data
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
      const response: any = await api.get(`/feedback/project/${selectedProject}`);
      if (response.success) {
        setFeedback(response.data);
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
      // Load sample data on error
      loadSampleFeedback();
    } finally {
      setLoading(false);
    }
  };

  const loadSampleFeedback = () => {
    setLoading(true);
    // Sample feedback data
    const sampleFeedback: FeedbackItem[] = [
      {
        _id: '1',
        content: 'The app is great but the checkout process is too slow. It takes forever to complete a purchase.',
        source: 'App Store Review',
        category: 'Performance',
        sentiment: 'negative',
        priority: 'high',
        isIgnored: false,
        createdAt: new Date().toISOString()
      },
      {
        _id: '2',
        content: 'Love the new UI design! Much more intuitive than before. Keep up the great work!',
        source: 'User Survey',
        category: 'UI/UX',
        sentiment: 'positive',
        priority: 'medium',
        isIgnored: false,
        createdAt: new Date().toISOString()
      },
      {
        _id: '3',
        content: 'Would love to see dark mode support. It would make using the app at night much better.',
        source: 'Customer Email',
        category: 'Feature Request',
        sentiment: 'neutral',
        priority: 'medium',
        isIgnored: false,
        createdAt: new Date().toISOString()
      },
      {
        _id: '4',
        content: 'App crashes frequently on Android devices. Please fix this urgent issue.',
        source: 'Bug Report',
        category: 'Bug',
        sentiment: 'negative',
        priority: 'critical',
        isIgnored: false,
        createdAt: new Date().toISOString()
      }
    ];
    setFeedback(sampleFeedback);
    setLoading(false);
  };

  const addFeedback = async () => {
    if (!newFeedback.trim()) return;

    try {
      if (selectedProject) {
        // Save to backend if project is selected
        const response: any = await api.post('/feedback', {
          projectId: selectedProject,
          name: `Feedback - ${new Date().toLocaleDateString()}`,
          description: 'Manual feedback entry',
          feedbackItems: [{
            content: newFeedback.trim(),
            source: 'Manual Entry',
            customerInfo: {},
            tags: []
          }]
        });

        if (response.success) {
          // Reload feedback to get the updated data with AI analysis
          await loadFeedback();
        }
      } else {
        // Add to local state if no project selected
        const newItem: FeedbackItem = {
          _id: Date.now().toString(),
          content: newFeedback.trim(),
          source: 'Manual Entry',
          category: 'General',
          sentiment: 'neutral',
          priority: 'medium',
          isIgnored: false,
          createdAt: new Date().toISOString()
        };
        setFeedback(prev => [newItem, ...prev]);
      }

      setNewFeedback('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding feedback:', error);
      // Fallback to local state
      const newItem: FeedbackItem = {
        _id: Date.now().toString(),
        content: newFeedback.trim(),
        source: 'Manual Entry',
        category: 'General',
        sentiment: 'neutral',
        priority: 'medium',
        isIgnored: false,
        createdAt: new Date().toISOString()
      };
      setFeedback(prev => [newItem, ...prev]);
      setNewFeedback('');
      setShowAddForm(false);
    }
  };

  const toggleIgnore = async (id: string) => {
    try {
      // Find the feedback item
      const feedbackItem = feedback.find(item => item._id === id);
      if (!feedbackItem) return;

      if (selectedProject && feedbackItem.feedbackDocId) {
        // Update in backend if we have the necessary IDs
        const response: any = await api.put(
          `/feedback/${feedbackItem.feedbackDocId}/items/${id}/ignore`,
          { isIgnored: !feedbackItem.isIgnored }
        );

        if (response.success) {
          // Update local state
          setFeedback(prev => prev.map(item => 
            item._id === id ? { ...item, isIgnored: !item.isIgnored } : item
          ));
        }
      } else {
        // Update local state only
        setFeedback(prev => prev.map(item => 
          item._id === id ? { ...item, isIgnored: !item.isIgnored } : item
        ));
      }
    } catch (error) {
      console.error('Error toggling feedback ignore status:', error);
      // Fallback to local update
      setFeedback(prev => prev.map(item => 
        item._id === id ? { ...item, isIgnored: !item.isIgnored } : item
      ));
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Feedback Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and analyze customer feedback
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
          {projects.length > 0 && !projectId && (
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Feedback
          </button>
        </div>
      </div>

      {/* Add Feedback Form */}
      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Feedback</h3>
          <div className="space-y-4">
            <textarea
              value={newFeedback}
              onChange={(e) => setNewFeedback(e.target.value)}
              placeholder="Enter customer feedback..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
            <div className="flex justify-end space-x-3">
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Feedback</dt>
                  <dd className="text-lg font-medium text-gray-900">{feedback.length}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Positive</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {feedback.filter(f => f.sentiment === 'positive').length}
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Negative</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {feedback.filter(f => f.sentiment === 'negative').length}
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
                  <dt className="text-sm font-medium text-gray-500 truncate">High Priority</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {feedback.filter(f => f.priority === 'critical' || f.priority === 'high').length}
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
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Feedback</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Customer feedback and feature requests
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding some customer feedback.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {feedback.map((item) => (
              <li key={item._id} className={`px-4 py-4 ${item.isIgnored ? 'opacity-50' : ''}`}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getSentimentIcon(item.sentiment)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <span className="text-sm text-gray-500">{item.source}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{item.category}</span>
                      </div>
                      <button
                        onClick={() => toggleIgnore(item._id)}
                        className={`text-sm ${item.isIgnored ? 'text-green-600 hover:text-green-500' : 'text-gray-600 hover:text-gray-500'}`}
                      >
                        {item.isIgnored ? 'Unignore' : 'Ignore'}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-900">{item.content}</p>
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
