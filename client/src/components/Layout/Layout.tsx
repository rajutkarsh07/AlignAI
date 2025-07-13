import React, { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import {
  ChartBarIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  MapIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Chat Assistant', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Feedback', href: '/feedback', icon: DocumentTextIcon },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon },
  { name: 'Roadmap', href: '/roadmap', icon: MapIcon },
];

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Get project ID from URL
  const projectMatch = location.pathname.match(/\/projects\/([^\/]+)/);
  const projectId = projectMatch ? projectMatch[1] : null;

  // Project-specific navigation
  const projectNavigation = projectId
    ? [
        { name: 'Overview', href: `/projects/${projectId}`, icon: FolderIcon },
        {
          name: 'Feedback',
          href: `/projects/${projectId}/feedback`,
          icon: DocumentTextIcon,
        },
        {
          name: 'Tasks',
          href: `/projects/${projectId}/tasks`,
          icon: ClipboardDocumentListIcon,
        },
        {
          name: 'Chat Assistant',
          href: `/projects/${projectId}/chat`,
          icon: ChatBubbleLeftRightIcon,
        },
        {
          name: 'Roadmap',
          href: `/projects/${projectId}/roadmap`,
          icon: MapIcon,
        },
      ]
    : [];

  const isActiveRoute = (href: string) => {
    if (href === location.pathname) return true;
    if (href !== '/' && location.pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
      >
        <div
          className="fixed inset-0 bg-secondary-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-6 border-b border-secondary-200">
            <h1 className="text-lg font-semibold text-secondary-900">
              AlignAI
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-secondary-400 hover:text-secondary-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <SidebarContent
            navigation={navigation}
            projectNavigation={projectNavigation}
            isActiveRoute={isActiveRoute}
            projectId={projectId}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-secondary-200">
          <div className="flex h-16 items-center px-6 border-b border-secondary-200">
            <h1 className="text-lg font-semibold text-secondary-900">
              AlignAI
            </h1>
          </div>
          <SidebarContent
            navigation={navigation}
            projectNavigation={projectNavigation}
            isActiveRoute={isActiveRoute}
            projectId={projectId}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 items-center bg-white border-b border-secondary-200 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-secondary-500 hover:text-secondary-900"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex-1 flex justify-between items-center lg:ml-0 ml-4">
            <div>{/* Breadcrumb could go here */}</div>
            <div className="flex items-center space-x-4">
              {projectId && (
                <Link
                  to={`/projects/${projectId}/chat`}
                  className="btn-primary inline-flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Chat
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

interface SidebarContentProps {
  navigation: Array<{ name: string; href: string; icon: any }>;
  projectNavigation: Array<{ name: string; href: string; icon: any }>;
  isActiveRoute: (href: string) => boolean;
  projectId: string | null;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  navigation,
  projectNavigation,
  isActiveRoute,
  projectId,
}) => {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto custom-scrollbar">
      <nav className="flex-1 space-y-6 px-4 py-4">
        {/* Main navigation */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-3">
            Main
          </h3>
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`sidebar-nav-item ${
                  isActiveRoute(item.href) ? 'active' : ''
                }`}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Project navigation */}
        {projectNavigation.length > 0 && (
          <div className="border-t border-secondary-200 pt-6">
            <div className="px-3 mb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                  Current Project
                </h3>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mr-2"></div>
                  <span className="text-xs text-secondary-400 font-medium">
                    Active
                  </span>
                </div>
              </div>
              {projectId && (
                <div className="mt-2 flex items-center text-sm text-secondary-900 font-medium">
                  <FolderIcon className="h-4 w-4 mr-2 text-primary-600" />
                  <span className="truncate">Project {projectId}</span>
                </div>
              )}
            </div>
            <div className="space-y-1">
              {projectNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-nav-item project-nav-item ${
                    isActiveRoute(item.href) ? 'active' : ''
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                  {isActiveRoute(item.href) && (
                    <ChevronRightIcon className="ml-auto h-4 w-4 text-primary-600" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Layout;
