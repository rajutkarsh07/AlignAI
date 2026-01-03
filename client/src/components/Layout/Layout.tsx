import React, { useState, useEffect } from 'react';
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

import AlignAI from "../../assets/alignai.png"
import { api } from '../../services/api';
import { PageHeaderProvider, usePageHeader } from '../../context/PageHeaderContext';

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
  const [projectName, setProjectName] = useState<string | null>(null);
  const location = useLocation();

  // Get project ID from URL
  const projectMatch = location.pathname.match(/\/projects\/([^/]+)/);
  const projectId = projectMatch ? projectMatch[1] : null;

  // Fetch project name when projectId changes
  useEffect(() => {
    const fetchProjectName = async () => {
      if (projectId && projectId !== 'new') {
        try {
          const response: any = await api.get(`/projects/${projectId}`);
          if (response.success && response.data) {
            setProjectName(response.data.name);
          }
        } catch (error) {
          console.error('Error fetching project name:', error);
          setProjectName(null);
        }
      } else {
        setProjectName(null);
      }
    };

    fetchProjectName();
  }, [projectId]);

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
    <PageHeaderProvider>
      <LayoutInner
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        navigation={navigation}
        projectNavigation={projectNavigation}
        isActiveRoute={isActiveRoute}
        projectId={projectId}
        projectName={projectName}
      />
    </PageHeaderProvider>
  );
};

interface LayoutInnerProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  navigation: Array<{ name: string; href: string; icon: any }>;
  projectNavigation: Array<{ name: string; href: string; icon: any }>;
  isActiveRoute: (href: string) => boolean;
  projectId: string | null;
  projectName: string | null;
}

const LayoutInner: React.FC<LayoutInnerProps> = ({
  sidebarOpen,
  setSidebarOpen,
  navigation,
  projectNavigation,
  isActiveRoute,
  projectId,
  projectName,
}) => {
  const { header } = usePageHeader();

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'
          }`}
      >
        <div
          className="fixed inset-0 bg-secondary-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-6 border-b border-secondary-200">
            <img src={AlignAI} alt="AlignAI logo" />
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
            projectName={projectName}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-secondary-200">
          <div className="flex h-16 items-center px-6 border-b border-secondary-200">
            <img src={AlignAI} alt="AlignAI logo" />
          </div>
          <SidebarContent
            navigation={navigation}
            projectNavigation={projectNavigation}
            isActiveRoute={isActiveRoute}
            projectId={projectId}
            projectName={projectName}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar with page header */}
        <div className="sticky top-0 z-10 bg-white border-b border-secondary-200 shadow-sm">
          <div className="flex items-center px-4 sm:px-6 lg:px-8 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-secondary-500 hover:text-secondary-900"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="flex-1 flex justify-between items-center lg:ml-0 ml-4">
              {/* Page Title and Subtitle */}
              <div className="min-w-0 flex-1 flex items-center gap-3">
                {/* Back Button */}
                {header.backButton && (
                  <div className="flex-shrink-0">
                    {header.backButton}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  {header.title && (
                    <>
                      <h1 className="text-xl font-bold text-gray-900 truncate sm:text-2xl">
                        {header.title}
                      </h1>
                      {header.subtitle && (
                        <p className="mt-0.5 text-sm text-gray-500 truncate hidden sm:block">
                          {header.subtitle}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Page Actions - Hidden below 700px */}
              <div className="hidden min-[700px]:flex items-center space-x-3 ml-4">
                {header.actions}
                {!header.actions && projectId && (
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
  projectName: string | null;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  navigation,
  projectNavigation,
  isActiveRoute,
  projectId,
  projectName,
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
                className={`sidebar-nav-item ${isActiveRoute(item.href) ? 'active' : ''
                  }`}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
