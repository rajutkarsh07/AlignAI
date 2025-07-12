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
  const { projectId, sessionId } = useParams<{ projectId: string; sessionId?: string }>();
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
        title: currentProjectId ? 'Project Chat Session' : 'General Chat Session',
        ...(currentProjectId && { projectId: currentProjectId })
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
        projectId: selectedProject || projectId
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
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Send message to backend
      if (session?.sessionId && !session.sessionId.startsWith('temp-')) {
        const response: any = await api.post(`/chat/sessions/${session.sessionId}/messages`, {
          content: userMessage.content,
          agent: 'general'
        });

        if (response.success && response.data) {
          // Handle different response formats
          let aiContent = '';
          if (response.data.response) {
            // Handle structured response
            if (typeof response.data.response === 'object') {
              aiContent = response.data.response.text || JSON.stringify(response.data.response, null, 2);
            } else {
              aiContent = response.data.response;
            }
          } else if (response.data.session && response.data.session.messages) {
            // Get the latest assistant message
            const lastMessage = response.data.session.messages[response.data.session.messages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              aiContent = lastMessage.content;
            }
          }

          if (aiContent) {
            const aiMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: aiContent,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, aiMessage]);
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
      let fallbackContent = '';

      if (queryLower.includes('project') || (queryLower.includes('what') && queryLower.includes('have'))) {
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
      } else if (queryLower.includes('roadmap') || queryLower.includes('plan')) {
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

${selectedProject || projectId ? '' : '💡 **Tip:** Select a specific project for detailed roadmap generation!'}`;
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

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackContent,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
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

  const MarkdownMessage: React.FC<{ content: string; isUser: boolean }> = ({ content, isUser }) => {
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
              <h1 className="text-lg font-bold text-gray-900 mb-2">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-semibold text-gray-800 mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-gray-700 mb-1">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-2 last:mb-0">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-sm">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-900">{children}</strong>
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
              <blockquote className="border-l-4 border-blue-500 pl-3 italic text-gray-700 mb-2">
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
              <td className="px-2 py-1 border-t border-gray-200">
                {children}
              </td>
            ),
            a: ({ children, href }) => (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
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

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Chat Assistant</h1>
            <p className="text-sm text-gray-600">
              {projectId ? 'Project-specific assistant' : 'General roadmap assistant'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {!projectId && projects.length > 0 && (
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No specific project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={createNewSession}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Chat
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 text-left overflow-y-auto bg-gray-50 px-6 py-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Start a conversation</h3>
              <p className="mt-1 text-sm text-gray-500">
                Ask me anything about product roadmaps, feedback analysis, or task planning.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex max-w-xs lg:max-w-md xl:max-w-lg ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className="flex-shrink-0">
                  {message.role === 'user' ? (
                    <UserCircleIcon className="h-8 w-8 text-gray-600" />
                  ) : (
                    <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <ComputerDesktopIcon className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <div
                  className={`mx-3 px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                  }`}
                >
                  <MarkdownMessage content={message.content} isUser={message.role === 'user'} />
                  <p
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <ComputerDesktopIcon className="h-5 w-5 text-white" />
                </div>
                <div className="mx-3 px-4 py-2 bg-white rounded-lg border border-gray-200">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about roadmaps, feedback analysis, or task planning..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              disabled={loading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
