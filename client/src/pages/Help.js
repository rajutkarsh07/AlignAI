import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Rocket,
  FileText,
  MessageSquare,
  Target,
  CheckCircle,
  Users,
  Brain,
  Calendar,
  Upload,
  Settings,
  Lightbulb,
} from 'lucide-react';

const Help = () => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const toggleFaq = (faq) => {
    setExpandedFaq(expandedFaq === faq ? null : faq);
  };

  const features = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: 'Project Management',
      description:
        'Upload or manually input project descriptions and company goals',
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: 'Customer Feedback Processing',
      description: 'Import and manage customer feedback from various sources',
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: 'AI-Powered Analysis',
      description: 'Two specialized AI agents for different tasks',
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: 'Smart Roadmap Generation',
      description:
        'Create balanced roadmaps considering both company goals and customer needs',
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: 'Interactive Chat Interface',
      description: 'Natural language interaction with the AI assistant',
    },
  ];

  const usageSteps = [
    {
      step: 1,
      title: 'Project Setup',
      icon: <Settings className="w-6 h-6" />,
      items: [
        "Click 'Update Project Details' to input your company's goals and plans",
        'Upload documents (PDF, DOCX, DOC) or manually enter project information',
        'Save the project context for AI reference',
      ],
    },
    {
      step: 2,
      title: 'Feedback Management',
      icon: <Users className="w-6 h-6" />,
      items: [
        'Upload customer feedback documents or add text manually',
        'Review and mark feedback as relevant/irrelevant',
        'Organize feedback by priority and category',
      ],
    },
    {
      step: 3,
      title: 'AI Interaction',
      icon: <Brain className="w-6 h-6" />,
      items: [
        'Use the chat interface to ask questions about your roadmap',
        'Ask for balanced plans, customer insights, or task suggestions',
        'Generate visual roadmaps with specific time allocations',
      ],
    },
    {
      step: 4,
      title: 'Task Creation',
      icon: <CheckCircle className="w-6 h-6" />,
      items: [
        'Create tasks with AI-suggested enhancements',
        'Get recommendations based on customer feedback and project goals',
        'Organize tasks into visual roadmap cards',
      ],
    },
  ];

  const faqs = [
    {
      question: 'What file formats are supported for uploads?',
      answer:
        'The Roadmap Assistant supports PDF, DOCX, and DOC files for both project plans and customer feedback documents.',
    },
    {
      question: 'How does the AI balance company goals with customer feedback?',
      answer:
        "The AI uses two specialized agents: one for analyzing customer feedback and another for roadmap generation. It considers both your company's strategic goals and customer needs to create balanced, data-driven roadmaps.",
    },
    {
      question: 'Can I interact with the AI in natural language?',
      answer:
        'Yes! The interactive chat interface allows you to ask questions, request insights, and get recommendations using natural language. The AI remembers your project context across sessions.',
    },
    {
      question: 'How do I mark feedback as relevant or irrelevant?',
      answer:
        'In the Feedback section, you can review each piece of feedback and mark it as relevant or irrelevant. This helps the AI focus on the most important customer insights when generating roadmaps.',
    },
    {
      question: 'What types of questions can I ask the AI assistant?',
      answer:
        'You can ask about roadmap strategies, customer insights, task suggestions, timeline planning, priority recommendations, and general project guidance. The AI provides context-aware responses based on your project details.',
    },
    {
      question: 'How does the visual roadmap generation work?',
      answer:
        'The AI creates visual task cards and timelines based on your project goals and customer feedback. You can specify time allocations and the AI will generate organized roadmap layouts.',
    },
    {
      question: 'Does the AI remember my project context?',
      answer:
        'Yes, the AI has context memory and remembers your project details, feedback, and previous interactions across sessions, providing more personalized and relevant assistance.',
    },
    {
      question: 'Can I get task suggestions from the AI?',
      answer:
        'Absolutely! The AI can suggest task enhancements based on your project context, customer feedback, and company goals. It helps you create more comprehensive and targeted tasks.',
    },
    {
      question: 'How do I organize feedback by priority?',
      answer:
        'In the Feedback Management section, you can categorize and prioritize feedback based on importance, customer impact, and alignment with your goals.',
    },
    {
      question:
        "What's the difference between the Chat Agent and Roadmap Agent?",
      answer:
        'The Chat Agent handles general questions and provides context-aware responses, while the Roadmap Agent specifically focuses on generating visual roadmaps, task cards, and time-based project plans.',
    },
  ];

  const capabilities = [
    'Document Upload: PDF, DOCX, DOC file support',
    'Feedback Management: Relevance marking and priority organization',
    'Task Creation: AI-suggested enhancements based on context',
    'Visual Roadmaps: Generate visual task cards and timelines',
    'Context Memory: AI remembers project context across sessions',
    'Real-time Updates: Live updates and notifications',
    'Natural Language Processing: Chat with AI in plain English',
    'Balanced Decision Making: Considers both goals and customer needs',
  ];

  return (
    <div className="space-y-8">
      {/* Overview */}
      <div className="card">
        <div className="card-body">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Lightbulb className="w-6 h-6 text-yellow-500 mr-2" />
            What is Roadmap Assistant?
          </h2>
          <p className="text-gray-700 mb-4">
            Roadmap Assistant is an AI-powered tool that intelligently balances
            company goals with customer feedback to help product managers make
            informed decisions. It uses advanced AI to analyze your project
            context, process customer feedback, and generate balanced roadmaps
            that align with both strategic objectives and customer needs.
          </p>

          <h3 className="text-lg font-semibold mb-3">Key Features:</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="text-blue-600 mt-0.5">{feature.icon}</div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Guide */}
      <div className="card">
        <div className="card-body">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Target className="w-6 h-6 text-green-600 mr-2" />
            How to Use Roadmap Assistant
          </h2>

          <div className="space-y-6">
            {usageSteps.map((step, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-6">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    {step.icon}
                  </div>
                  <div>
                    <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm font-semibold mr-3">
                      Step {step.step}
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {step.title}
                    </span>
                  </div>
                </div>
                <ul className="space-y-2 ml-12">
                  {step.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Capabilities */}
      {/* <div className="card">
        <div className="card-body">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Brain className="w-6 h-6 text-purple-600 mr-2" />
            Key Capabilities
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {capabilities.map((capability, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{capability}</span>
              </div>
            ))}
          </div>
        </div>
      </div> */}

      {/* FAQ Section */}
      <div className="card">
        <div className="card-body">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <HelpCircle className="w-6 h-6 text-blue-600 mr-2" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">
                    {faq.question}
                  </span>
                  {expandedFaq === index ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Guide */}
      <div className="card">
        <div className="card-body">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Calendar className="w-6 h-6 text-indigo-600 mr-2" />
            Navigation Guide
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 text-gray-900">
                Main Sections:
              </h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  <strong>Dashboard:</strong> Overview and quick access
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  <strong>Projects:</strong> Manage project details and goals
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                  <strong>Feedback:</strong> Customer feedback management
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  <strong>Tasks:</strong> Task creation and management
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-pink-500 rounded-full mr-3"></span>
                  <strong>Chat:</strong> AI assistant interaction
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  <strong>Roadmap:</strong> Visual roadmap generation
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-gray-900">
                Tips for Success:
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Start with project setup for better AI context</li>
                <li>• Upload feedback documents for richer insights</li>
                <li>• Use natural language when chatting with AI</li>
                <li>• Mark feedback relevance for better results</li>
                <li>• Ask specific questions for targeted advice</li>
                <li>• Review generated roadmaps and provide feedback</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
