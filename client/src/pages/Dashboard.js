import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderOpen, 
  MessageSquare, 
  CheckSquare, 
  MessageCircle, 
  BarChart3,
  Plus,
  Upload,
  TrendingUp,
  AlertCircle,
  Clock
} from 'lucide-react';
import { projectAPI, feedbackAPI, tasksAPI, aiAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    project: null,
    feedback: null,
    tasks: null,
  });
  const [loading, setLoading] = useState(true);
        const [insights, setInsights] = useState(null);
      const [connectionIssue, setConnectionIssue] = useState(false);
      const [noProject, setNoProject] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [projectStats, feedbackStats, taskStats, aiInsights] = await Promise.all([
        projectAPI.getStats().catch(() => ({ data: {} })),
        feedbackAPI.getStats().catch(() => ({ data: {} })),
        tasksAPI.getStats().catch(() => ({ data: {} })),
        aiAPI.getInsights().catch(() => ({ data: null })),
      ]);

      setStats({
        project: projectStats.data,
        feedback: feedbackStats.data,
        tasks: taskStats.data,
      });

      if (aiInsights.data) {
        setInsights(aiInsights.data);
        setConnectionIssue(aiInsights.data.connectionIssue || false);
        setNoProject(aiInsights.data.noProject || false);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      name: 'Update Project',
      description: 'Add or modify project details and goals',
      href: '/project',
      icon: FolderOpen,
      color: 'bg-blue-500',
    },
    {
      name: 'Add Feedback',
      description: 'Import customer feedback or add manually',
      href: '/feedback',
      icon: MessageSquare,
      color: 'bg-green-500',
    },
    {
      name: 'Create Task',
      description: 'Create new tasks with AI suggestions',
      href: '/tasks',
      icon: CheckSquare,
      color: 'bg-purple-500',
    },
    {
      name: 'Chat with AI',
      description: 'Ask questions and get insights',
      href: '/chat',
      icon: MessageCircle,
      color: 'bg-orange-500',
    },
    {
      name: 'Generate Roadmap',
      description: 'Create balanced product roadmaps',
      href: '/roadmap',
      icon: BarChart3,
      color: 'bg-indigo-500',
    },
  ];

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'bg-gray-500' }) => (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value || 0}</p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="ml-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-6 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to your AI-powered product roadmap assistant
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Project Goals"
          value={stats.project?.totalGoals || 0}
          subtitle="Active goals"
          icon={FolderOpen}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Feedback"
          value={stats.feedback?.overview?.active || 0}
          subtitle="Customer requests"
          icon={MessageSquare}
          color="bg-green-500"
        />
        <StatCard
          title="Active Tasks"
          value={stats.tasks?.overview?.inProgress || 0}
          subtitle="In progress"
          icon={CheckSquare}
          color="bg-purple-500"
        />
        <StatCard
          title="Critical Items"
          value={(stats.feedback?.overview?.critical || 0) + (stats.tasks?.overview?.critical || 0)}
          subtitle="High priority"
          icon={AlertCircle}
          color="bg-red-500"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                to={action.href}
                className="card hover:shadow-medium transition-shadow duration-200 group"
              >
                <div className="card-body">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
                        {action.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* AI Insights */}
      {insights && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Insights</h2>
          <div className={`card ${connectionIssue ? 'border-warning-300 bg-warning-50' : noProject ? 'border-primary-300 bg-primary-50' : ''}`}>
            <div className="card-body">
              {connectionIssue && (
                <div className="mb-4 p-3 bg-warning-100 border border-warning-200 rounded-md">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-warning-600 mr-2" />
                    <span className="text-sm font-medium text-warning-800">
                      Database Connection Issue
                    </span>
                  </div>
                  <p className="text-sm text-warning-700 mt-1">
                    Please check your MongoDB Atlas connection. AI features may be limited until resolved.
                  </p>
                </div>
              )}
              
              {noProject && (
                <div className="mb-4 p-3 bg-primary-100 border border-primary-200 rounded-md">
                  <div className="flex items-center">
                    <FolderOpen className="w-5 h-5 text-primary-600 mr-2" />
                    <span className="text-sm font-medium text-primary-800">
                      No Project Found
                    </span>
                  </div>
                  <p className="text-sm text-primary-700 mt-1">
                    Create your first project to enable full AI-powered insights and recommendations.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Key Insights</h3>
                  <ul className="space-y-2">
                    {insights.insights?.slice(0, 3).map((insight, index) => (
                      <li key={index} className="flex items-start">
                        <TrendingUp className="w-4 h-4 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {insights.recommendations?.slice(0, 3).map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <Clock className="w-4 h-4 text-warning-600 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="card">
          <div className="card-body">
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent activity to display</p>
              <p className="text-sm text-gray-400 mt-1">
                Start by creating a project or adding feedback
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 