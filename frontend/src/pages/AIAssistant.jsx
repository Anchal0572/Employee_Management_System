import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  HelpCircle,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/aiService';

const SUGGESTED_PROMPTS = [
  'What is our sick leave policy and documentation requirement?',
  'What are the core working hours and clock-in grace period?',
  'How many earned leave days can I carry forward to next year?',
  'When is monthly payroll disbursed and where can I find my payslip?',
  'What is the daily per-diem allowance for business travel?',
  'What is Alice\'s salary?' // Demonstration of RBAC & privacy guardrail protection
];

export const AIAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user?.name?.split(' ')[0] || 'there'}! I am the EMS AI HR Policy Assistant. I can help answer questions regarding company policies, working hours, leave rules, payroll schedules, and workplace guidelines using our official knowledge base. How can I help you today?`,
      citations: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch available knowledge documents
    const fetchDocs = async () => {
      try {
        const docs = await aiService.getKnowledgeDocuments();
        setDocuments(docs || []);
      } catch (err) {
        console.warn('Could not load knowledge docs:', err.message);
      }
    };
    fetchDocs();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend || !textToSend.trim() || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await aiService.chatWithAssistant(userMsg.content, historyPayload);

      const aiMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.answer || res.message || 'I am unable to process that inquiry right now.',
        citations: res.citations || [],
        isRefusal: res.isRefusal || false,
        reason: res.reason,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message || 'Could not communicate with the AI service layer.'}`,
        citations: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Chat history reset. What policy question can I help you with?`,
        citations: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-purple-600/15 via-fuchsia-600/10 to-indigo-600/15 rounded-2xl border border-purple-200/90 shadow-sm relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-gradient-to-br from-purple-300/30 to-fuchsia-300/20 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0 ring-2 ring-purple-300/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI HR Policy Intelligence</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300 shadow-2xs">
                RAG Engine Active
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Grounded policy assistant adhering strictly to indexed company documents and Role-Based Access Controls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Button variant="secondary" size="sm" onClick={handleResetChat} icon={RotateCcw} className="rounded-xl bg-white/95 border-slate-200 hover:bg-slate-50 font-bold">
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Main Grid: Chat Workspace & Policy Documentation Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Chat Area (3 columns) */}
        <Card className="lg:col-span-3 flex flex-col h-[650px] p-0 overflow-hidden shadow-sm border-purple-200/80 bg-white/95">
          {/* Header Subtitle & Security Notice */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-purple-50/60 via-slate-50 to-indigo-50/40 border-b border-purple-100 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-slate-700">RBAC & Privacy Guardrails Active</span>
            </div>
            <span className="text-[11px] text-slate-500">
              User: <span className="font-bold text-purple-900">{user?.name}</span> ({user?.role})
            </span>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                    <div
                      className={`p-4 rounded-2xl ${
                        isUser
                          ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-purple-500/15'
                          : msg.isRefusal
                          ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-bl-none'
                          : 'bg-slate-100/90 text-slate-800 rounded-bl-none border border-slate-200/80'
                      }`}
                    >
                      {msg.isRefusal && (
                        <div className="flex items-center gap-1.5 font-bold text-rose-700 text-xs mb-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Guardrail Restriction</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Citations block for AI responses */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1 text-[11px]">
                        <div className="font-semibold text-indigo-900 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-indigo-600" />
                          <span>Retrieved Policy Sources:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {msg.citations.map((cite, cIdx) => (
                            <span
                              key={cIdx}
                              className="px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-800 text-[10px] font-medium"
                            >
                              {cite.document} &bull; {cite.section}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={`text-[10px] text-slate-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 text-xs justify-start">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="p-4 bg-slate-100 rounded-2xl rounded-bl-none border border-slate-200/60 flex items-center gap-2 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-xs ml-1 font-medium text-slate-600">Searching policy documentation...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Prompts Toolbar */}
          <div className="px-4 py-2 bg-slate-50/70 border-t border-slate-200 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Suggested:
              </span>
              {SUGGESTED_PROMPTS.map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-[11px] transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Ask about company leave, working hours, payroll dates, or travel policies..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <Button
              variant="primary"
              size="md"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              icon={Send}
            >
              Ask
            </Button>
          </div>
        </Card>

        {/* Knowledge Base Sidebar (1 column) */}
        <div className="space-y-4">
          <Card title="Indexed Knowledge Base" subtitle="Official policies indexed for RAG retrieval">
            <div className="space-y-3">
              {documents.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Loading policy documents...
                </div>
              ) : (
                documents.map((doc, dIdx) => (
                  <div
                    key={dIdx}
                    className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 rounded-xl transition-colors flex items-start gap-2.5 text-xs"
                  >
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{doc.title}</div>
                      <div className="text-[10px] text-slate-400 truncate">{doc.filename}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title="Security & Compliance" subtitle="Privacy guarantees">
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <span className="font-semibold text-slate-800">RBAC Enforcement:</span> Private personal records and peer salaries are never exposed.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  <span className="font-semibold text-slate-800">Grounded in Policies:</span> Answers are extracted from formal company guidelines.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p>
                  <span className="font-semibold text-slate-800">Advisory Only:</span> The AI does not make binding contractual or termination decisions.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
