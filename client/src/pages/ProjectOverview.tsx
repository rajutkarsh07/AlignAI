import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Project {
    _id: string;
    name: string;
    description: string;
    officialPlan?: string;
    formattedPlan?: string;
    createdAt: string;
    goals?: Array<{
        _id: string;
        title: string;
        description: string;
        priority: string;
        status: string;
    }>;
}

interface ProjectContextType {
    project: Project;
}

const ProjectOverview: React.FC = () => {
    const { project } = useOutletContext<ProjectContextType>();

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-green-100 text-green-800 border-green-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'in-progress':
                return 'bg-primary-100 text-primary-800 border-primary-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Project Description */}
                    <div className="bg-white rounded-2xl shadow-2xl border border-primary-100 p-8">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-primary-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Description
                            </h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            {project.description}
                        </p>
                    </div>

                    {/* Project Plan */}
                    <div className="bg-white rounded-2xl shadow-2xl border border-primary-100 p-8">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Project Plan
                            </h2>
                        </div>
                        <div className="prose prose-sm max-w-none prose-headings:text-left prose-p:text-left prose-ul:text-left prose-ol:text-left prose-li:text-left">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                {project.formattedPlan ? (
                                    <div className="prose prose-sm max-w-none prose-headings:text-left prose-p:text-left prose-ul:text-left prose-ol:text-left prose-li:text-left">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {project.formattedPlan}
                                        </ReactMarkdown>
                                    </div>
                                ) : project.officialPlan ? (
                                    <div className="prose prose-sm max-w-none prose-headings:text-left prose-p:text-left prose-ul:text-left prose-ol:text-left prose-li:text-left">
                                        <ReactMarkdown>{project.officialPlan}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No project plan available</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Project Stats */}
                    <div className="bg-white rounded-2xl shadow-2xl border border-primary-100 p-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Project Overview
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Status</span>
                                <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
                                    Active
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Created</span>
                                <span className="text-gray-900 font-medium">
                                    {new Date(
                                        project.createdAt || Date.now()
                                    ).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Goals</span>
                                <span className="text-gray-900 font-medium">
                                    {project.goals ? project.goals.length : 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Goals Section */}
            {project.goals && project.goals.length > 0 && (
                <div className="bg-white rounded-2xl shadow-2xl border border-primary-100 p-8">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg
                                className="w-5 h-5 text-purple-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Project Goals
                        </h2>
                        <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
                            {project.goals.length} goals
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {project.goals.map((goal) => (
                            <div
                                key={goal._id}
                                className="bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-2xl p-6 hover:shadow-xl transition-shadow duration-200"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                                        {goal.title}
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
                                                goal.priority
                                            )}`}
                                        >
                                            {goal.priority}
                                        </span>
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                                                goal.status
                                            )}`}
                                        >
                                            {goal.status}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                    {goal.description}
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                        <span className="text-xs text-gray-500">
                                            Goal #{goal._id.slice(-4)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectOverview;
