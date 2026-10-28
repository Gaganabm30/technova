import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ExternalLink,
  FolderGit2,
  CheckSquare,
  Lightbulb,
  Trash2,
  Loader2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  references?: { type: 'task' | 'project'; id: string; name: string }[];
  timestamp: Date;
  loading?: boolean;
}

const SUGGESTED_PROMPTS = [
  'What tasks are overdue this week?',
  'Which projects are at risk of missing their deadline?',
  'Who has the heaviest workload on the team?',
  'Summarize what the Engineering team is working on.',
  'What are my highest priority tasks right now?',
  'Show me all blocked tasks and suggest how to unblock them.',
];

export const AIChatPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your AI Workflow Assistant. I have full context of your organization's tasks, projects, and team — ask me anything about your work.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const query = (text || input).trim();
    if (!query || loading) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    const loadingMessage: ChatMessage = {
      id: `a-loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.askAssistant(query);

      setMessages(prev =>
        prev.map(m =>
          m.loading
            ? {
                ...m,
                id: `a-${Date.now()}`,
                content: res.answer,
                references: res.references,
                loading: false,
              }
            : m
        )
      );
    } catch (err: any) {
      setMessages(prev =>
        prev.map(m =>
          m.loading
            ? {
                ...m,
                id: `a-err-${Date.now()}`,
                content: `Sorry, I couldn't process your request. ${err.message || 'Please try again.'}`,
                loading: false,
              }
            : m
        )
      );
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-new',
        role: 'assistant',
        content: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 Chat cleared. Ask me anything about your workflow, tasks, or team.`,
        timestamp: new Date(),
      },
    ]);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const referenceIcon = (type: 'task' | 'project') =>
    type === 'task' ? (
      <CheckSquare className="w-3 h-3 text-indigo-500 shrink-0" />
    ) : (
      <FolderGit2 className="w-3 h-3 text-violet-500 shrink-0" />
    );

  const handleReferenceClick = (ref: { type: 'task' | 'project'; id: string }) => {
    if (ref.type === 'task') navigate('/tasks');
    else navigate(`/projects/${ref.id}`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
              AI Assistant
            </span>
            <span className="text-xs text-slate-400">· Workflow Intelligence Chat</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Ask Anything About Your Work
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            I have full context of your tasks, projects, and team. Ask in plain English.
          </p>
        </div>
        <button
          onClick={clearChat}
          title="Clear chat"
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            <div
              className={`flex flex-col gap-1.5 max-w-[80%] ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-xs rounded-tl-sm'
                }`}
              >
                {msg.loading ? (
                  <span className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing your workspace...
                  </span>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>

              {msg.references && msg.references.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {msg.references.map((ref, i) => (
                    <button
                      key={i}
                      onClick={() => handleReferenceClick(ref)}
                      className="flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      {referenceIcon(ref.type)}
                      <span className="max-w-[140px] truncate">{ref.name}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}

              <span className="text-[10px] text-slate-400 px-1">{formatTime(msg.timestamp)}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 2 && (
        <div className="py-3">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Lightbulb className="w-3 h-3" /> Suggested questions
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map(prompt => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="px-3 py-1.5 text-[11px] bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-xl transition-colors cursor-pointer font-medium"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="mt-3 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-end gap-2 p-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 mb-0.5">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about tasks, projects, team workload... (Enter to send)"
            rows={1}
            className="flex-1 resize-none text-xs text-slate-800 placeholder-slate-400 bg-transparent outline-none py-1 leading-relaxed max-h-32"
            style={{ minHeight: '28px' }}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-xl transition-colors cursor-pointer shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="px-4 pb-2 text-[10px] text-slate-400">
          AI has read-only access to your organization's data. Powered by Gemini.
        </div>
      </div>
    </div>
  );
};
