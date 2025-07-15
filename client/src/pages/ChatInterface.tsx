import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import {
  PaperAirplaneIcon,
  UserCircleIcon,
  ComputerDesktopIcon,
  PlusIcon,
  SparklesIcon,
  StopIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import 'highlight.js/styles/github-dark.css';
import CustomSelect from '../components/CustomSelect';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  _id: string;
  sessionId: string;
  title: string;
  messages: Message[];
  projectId?: string;
}

const ChatInterface: React.FC = () => {
  const { projectId, sessionId } = useParams<{
    projectId: string;
    sessionId?: string;
  }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProjects();
    if (sessionId) {
      loadSession(sessionId);
    } else if (projectId) {
      setSelectedProject(projectId);
      createNewSession();
    } else {
      // Global chat - create a general session
      createNewSession();
    }
  }, [sessionId, projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const loadSession = async (id: string) => {
    try {
      const response: any = await api.get(`/chat/sessions/${id}`);
      if (response.success) {
        setSession(response.data);
        setMessages(response.data.messages || []);
        if (response.data.projectId) {
          setSelectedProject(response.data.projectId);
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const createNewSession = async () => {
    try {
      const currentProjectId = selectedProject || projectId;
      const sessionData = {
        title: currentProjectId
          ? 'Project Chat Session'
          : 'General Chat Session',
        ...(currentProjectId && { projectId: currentProjectId }),
      };

      const response: any = await api.post('/chat/sessions', sessionData);
      if (response.success) {
        setSession(response.data);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      // Create a temporary local session if API fails
      const tempSession: ChatSession = {
        _id: 'temp-' + Date.now(),
        sessionId: 'temp-' + Date.now(),
        title: 'Chat Session',
        messages: [],
        projectId: selectedProject || projectId,
      };
      setSession(tempSession);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Send message to backend
      if (session?.sessionId && !session.sessionId.startsWith('temp-')) {
        const currentProjectId = selectedProject || projectId;
        const currentProject = projects.find((p) => p._id === currentProjectId);

        const messagePayload: any = {
          content: userMessage.content,
          agent: 'general',
          ...(currentProjectId && { projectId: currentProjectId }),
          ...(currentProject && {
            projectContext: {
              name: currentProject.name,
              description: currentProject.description || '',
              goals: currentProject.goals || [],
            },
          }),
        };

        const response: any = await api.post(
          `/chat/sessions/${session.sessionId}/messages`,
          messagePayload
        );

        if (response.success && response.data) {
          // Handle different response formats
          let aiContent = '';
          if (response.data.response) {
            // Handle structured response
            if (typeof response.data.response === 'object') {
              aiContent =
                response.data.response.text ||
                JSON.stringify(response.data.response, null, 2);
            } else {
              aiContent = response.data.response;
            }
          } else if (response.data.session && response.data.session.messages) {
            // Get the latest assistant message
            const lastMessage =
              response.data.session.messages[
                response.data.session.messages.length - 1
              ];
            if (lastMessage && lastMessage.role === 'assistant') {
              aiContent = lastMessage.content;
            }
          }

          if (aiContent) {
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: aiContent,
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, aiMessage]);
          } else {
            throw new Error('No AI response content found');
          }
        } else {
          throw new Error('Invalid response structure');
        }
      } else {
        throw new Error('No valid session');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Provide intelligent fallback responses
      const queryLower = userMessage.content.toLowerCase();
      const currentProjectId = selectedProject || projectId;
      const currentProject = projects.find((p) => p._id === currentProjectId);
      let fallbackContent = '';

      if (
        queryLower.includes('project') ||
        (queryLower.includes('what') && queryLower.includes('have'))
      ) {
        if (currentProject) {
          fallbackContent = `I can help you with information about **${
            currentProject.name
          }**. Here's what I know about this project:

${
  currentProject.description
    ? `**📝 Description:** ${currentProject.description}`
    : ''
}
${
  currentProject.goals && currentProject.goals.length > 0
    ? `**🎯 Goals:** ${currentProject.goals.join(', ')}`
    : ''
}

**📋 What I can help you with for ${currentProject.name}:**
- Analyze project-specific feedback and trends
- Create roadmaps tailored to this project's goals
- Suggest task prioritization based on project objectives
- Review project progress and milestones
- Help with strategic decisions for this project

**🗣️ Try asking:**
- "What feedback trends are we seeing for ${currentProject.name}?"
- "Create a roadmap for ${currentProject.name}"
- "What are the main challenges for this project?"
- "How can we improve ${currentProject.name} based on user feedback?"`;
        } else {
          fallbackContent = `I can help you with information about your projects. Currently you have several projects available. You can:

**📋 Project Management:**
- View project details and goals
- Create new projects
- Update project descriptions and plans

**🗣️ Common Questions I Can Help With:**
- "Show me all projects"
- "What are the current project goals?"
- "Help me create a new project"

**📊 Analytics & Insights:**
- Review project progress
- Analyze feedback trends
- Track task completion

Would you like me to help you with any of these areas?`;
        }
      } else if (
        queryLower.includes('roadmap') ||
        queryLower.includes('plan')
      ) {
        if (currentProject) {
          fallbackContent = `I'd be happy to help you create a roadmap for **${currentProject.name}**! Here's what I can assist with:

**🗺️ Roadmap Generation for ${currentProject.name}:**
- Balanced roadmaps (strategic + customer feedback)
- Timeline planning (quarterly, yearly)
- Priority-based task organization aligned with project goals
- Resource allocation strategies

**📊 Roadmap Types:**
- **Strategic Focus:** Company goals first
- **Customer-Driven:** Feedback-based priorities  
- **Balanced Approach:** Mix of both
- **Custom Allocation:** Your specific percentages

**💡 Example Requests for ${currentProject.name}:**
- "Create a Q1 roadmap for ${currentProject.name} focusing on customer feedback"
- "Generate a balanced 6-month plan for this project"
- "Show me strategic priorities for ${currentProject.name} this year"
- "What should be our roadmap priorities for ${currentProject.name}?"`;
        } else {
          fallbackContent = `I'd be happy to help you create a roadmap! Here's what I can assist with:

**🗺️ Roadmap Generation:**
- Balanced roadmaps (strategic + customer feedback)
- Timeline planning (quarterly, yearly)
- Priority-based task organization
- Resource allocation strategies

**📊 Roadmap Types:**
- **Strategic Focus:** Company goals first
- **Customer-Driven:** Feedback-based priorities  
- **Balanced Approach:** Mix of both
- **Custom Allocation:** Your specific percentages

**💡 Example Requests:**
- "Create a Q1 roadmap focusing on customer feedback"
- "Generate a balanced 6-month plan"
- "Show me strategic priorities for this year"

💡 **Tip:** Select a specific project for detailed roadmap generation!`;
        }
      } else {
        if (currentProject) {
          fallbackContent = `I'm your AI product management assistant for **${currentProject.name}**! Here's how I can help:

**🎯 Project Strategy for ${currentProject.name}:**
- Analyze project-specific feedback patterns
- Balance project goals with user needs
- Provide prioritization frameworks for this project
- Strategic decision support for ${currentProject.name}

**📋 Project Management:**
- Roadmap planning and optimization for ${currentProject.name}
- Task breakdown and enhancement
- Timeline and resource estimation
- Risk assessment and mitigation

**📊 Analysis & Insights:**
- Customer feedback analysis for ${currentProject.name}
- Market trend evaluation  
- Competitive positioning
- Performance metrics guidance

**🚀 Quick Actions for ${currentProject.name}:**
- Ask about specific project challenges
- Request roadmap recommendations
- Get help prioritizing features
- Analyze customer feedback themes

What would you like to work on for ${currentProject.name} today?`;
        } else {
          fallbackContent = `I'm your AI product management assistant! Here's how I can help:

**🎯 Product Strategy:**
- Analyze customer feedback patterns
- Balance business goals with user needs
- Provide prioritization frameworks
- Strategic decision support

**📋 Project Management:**
- Roadmap planning and optimization
- Task breakdown and enhancement
- Timeline and resource estimation
- Risk assessment and mitigation

**📊 Analysis & Insights:**
- Customer feedback analysis
- Market trend evaluation  
- Competitive positioning
- Performance metrics guidance

**🚀 Quick Actions:**
- Ask about specific product challenges
- Request roadmap recommendations
- Get help prioritizing features
- Analyze customer feedback themes

What would you like to work on today?`;
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackContent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const MarkdownMessage: React.FC<{ content: string; isUser: boolean }> = ({
    content,
    isUser,
  }) => {
    if (isUser) {
      // For user messages, keep simple formatting
      return <div className="text-sm whitespace-pre-wrap">{content}</div>;
    }

    // For AI messages, use rich markdown formatting
    return (
      <div className="text-sm prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            // Custom styling for markdown elements
            h1: ({ children }) => (
              <h1 className="text-lg font-bold text-gray-900 mb-2">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-semibold text-gray-800 mb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                {children}
              </h3>
            ),
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-2 space-y-1">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-2 space-y-1">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="text-sm">{children}</li>,
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-900">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-700">{children}</em>
            ),
            code: ({ children, className }) => {
              const isInline = !className;
              return isInline ? (
                <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              ) : (
                <code className={`${className} text-xs`}>{children}</code>
              );
            },
            pre: ({ children }) => (
              <pre className="bg-gray-100 rounded-md p-3 text-xs overflow-x-auto mb-2">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-orange-500 pl-3 italic text-gray-700 mb-2">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto mb-2">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="px-2 py-1 bg-gray-50 text-left font-medium text-gray-700">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-2 py-1 border-t border-gray-200">{children}</td>
            ),
            a: ({ children, href }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-800 underline"
              >
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  const currentProjectId = selectedProject || projectId;
  const currentProject = projects.find((p) => p._id === currentProjectId);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <ComputerDesktopIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  AI Assistant
                  {currentProject && (
                    <span className="text-orange-600 ml-2">
                      • {currentProject.name}
                    </span>
                  )}
                </h1>
                <p className="text-sm text-gray-500">
                  {currentProject
                    ? `Project-specific insights and guidance`
                    : 'General product management assistant'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!projectId && projects.length > 0 && (
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
                />
              )}
              <button
                onClick={createNewSession}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-sm transition-all duration-200"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mb-4">
                    <ComputerDesktopIcon className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Start a conversation
                    {currentProject && ` about ${currentProject.name}`}
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-6">
                    {currentProject
                      ? `Ask me anything about ${currentProject.name} roadmaps, feedback analysis, or task planning.`
                      : 'Ask me anything about product roadmaps, feedback analysis, or task planning.'}
                  </p>
                  {currentProject && (
                    <div className="max-w-lg mx-auto p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center">
                            <SparklesIcon className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-orange-900 mb-1">
                            Project Context Active
                          </p>
                          <p className="text-xs text-orange-700">
                            I'll use information about {currentProject.name} to
                            provide more relevant responses.
                            {currentProject.description && (
                              <span className="block mt-1 text-gray-600">
                                {currentProject.description}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Start Suggestions */}
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    <button
                      onClick={() =>
                        setInputMessage('Create a roadmap for this project')
                      }
                      className="p-3 text-left bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        🗺️ Create Roadmap
                      </div>
                      <div className="text-xs text-gray-500">
                        Generate a strategic roadmap
                      </div>
                    </button>
                    <button
                      onClick={() =>
                        setInputMessage('Analyze recent feedback trends')
                      }
                      className="p-3 text-left bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        📊 Analyze Feedback
                      </div>
                      <div className="text-xs text-gray-500">
                        Review customer insights
                      </div>
                    </button>
                    <button
                      onClick={() =>
                        setInputMessage('Prioritize tasks for this project')
                      }
                      className="p-3 text-left bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        ⚡ Task Priority
                      </div>
                      <div className="text-xs text-gray-500">
                        Help prioritize work items
                      </div>
                    </button>
                    <button
                      onClick={() =>
                        setInputMessage('What are the main challenges?')
                      }
                      className="p-3 text-left bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200"
                    >
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        🎯 Challenges
                      </div>
                      <div className="text-xs text-gray-500">
                        Identify key obstacles
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex max-w-2xl ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {message.role === 'user' ? (
                        <div className="h-10 w-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-sm">
                          <UserCircleIcon className="h-6 w-6 text-white" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center shadow-sm">
                          <ComputerDesktopIcon className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div
                      className={`mx-3 px-4 py-3 rounded-2xl shadow-sm ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <MarkdownMessage
                        content={message.content}
                        isUser={message.role === 'user'}
                      />
                      <p
                        className={`text-xs mt-2 ${
                          message.role === 'user'
                            ? 'text-orange-100'
                            : 'text-gray-400'
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex">
                    <div className="h-10 w-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center shadow-sm">
                      <ComputerDesktopIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="mx-3 px-4 py-3 bg-white rounded-2xl border border-gray-200 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-orange-600 rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-orange-600 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      currentProject
                        ? `Ask me about ${currentProject.name} roadmaps, feedback analysis, or task planning...`
                        : 'Ask me about roadmaps, feedback analysis, or task planning...'
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm transition-all duration-200"
                    rows={2}
                    disabled={loading}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || loading}
                  className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200"
                >
                  {loading ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <span>{inputMessage.length} characters</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
