import React, { useState, useEffect } from 'react';
import { useParams, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useSetPageHeader } from '../context/PageHeaderContext';
import {
    PencilIcon,
    ShareIcon,
    ChartBarIcon,
    ClipboardDocumentListIcon,
    MapIcon,
    RectangleStackIcon
} from '@heroicons/react/24/outline';

interface Project {
    _id: string;
    name: string;
    description: string;
    createdAt: string;
    goals?: any[];
}

const ProjectView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProject = async () => {
            if (!id) return;

            setIsLoading(true);
            setError(null);

            try {
                const response: any = await api.get(`/projects/${id}`);
                if (response.success) {
                    setProject(response.data);
                }
            } catch (err: any) {
                setError(err.message || 'Error loading project');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProject();
    }, [id]);

    // Set page header
    useSetPageHeader(
        project?.name || 'Project',
        'Manage your project',
        <>
            <button
                onClick={() => navigate(`/projects/${id}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition"
            >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition">
                <ShareIcon className="h-4 w-4 mr-2" />
                Share
            </button>
        </>,
        [project, id]
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-accent-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <p className="mt-4 text-lg font-medium text-gray-700">
                        Loading project...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                        className="w-10 h-10 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Oops! Something went wrong
                </h2>
                <p className="text-gray-600 mb-6">{error || 'Project not found'}</p>
            </div>
        );
    }

    const navItems = [
        {
            name: 'Overview',
            path: `/projects/${id}`,
            icon: RectangleStackIcon,
            end: true,
        },
        {
            name: 'Feedback',
            path: `/projects/${id}/feedback`,
            icon: ClipboardDocumentListIcon,
        },
        {
            name: 'Tasks',
            path: `/projects/${id}/tasks`,
            icon: ChartBarIcon,
        },
        {
            name: 'Roadmap',
            path: `/projects/${id}/roadmaps`,
            icon: MapIcon,
        },
        {
            name: 'Analytics',
            path: `/projects/${id}/analytics`,
            icon: ChartBarIcon,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Navigation Tabs */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <nav className="flex space-x-1 p-2" aria-label="Tabs">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                end={item.end}
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${isActive
                                        ? 'bg-accent-500 text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`
                                }
                            >
                                <Icon className="h-5 w-5 mr-2" />
                                {item.name}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            {/* Nested Route Content */}
            <div>
                <Outlet context={{ project }} />
            </div>
        </div>
    );
};

export default ProjectView;
