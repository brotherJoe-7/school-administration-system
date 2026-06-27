import React, { useState, useRef, useEffect } from 'react';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const ROLE_CONFIG = {
  admin: {
    title: 'School AI Assistant',
    subtitle: 'Query administrative data, reports, and analytics using natural language.',
    greeting: (name) => `Hello ${name}! I can help you analyse student performance, attendance trends, payroll, and more. What would you like to know?`,
    contextType: 'school administration',
    badgeLabel: 'ADMIN AI',
  },
  superadmin: {
    title: 'Platform AI Assistant',
    subtitle: 'Query global platform metrics and multi-tenant analytics.',
    greeting: (name) => `Hello ${name}! I have access to platform-wide data across all schools. Ask me about revenue, tenant performance, or system metrics.`,
    contextType: 'global platform',
    badgeLabel: 'PLATFORM AI',
  },
  teacher: {
    title: 'Teacher AI Assistant',
    subtitle: 'Get insights on your classes, student performance, and attendance.',
    greeting: (name) => `Hello ${name}! I can help you analyse your students' performance, flag at-risk students, and summarise class attendance. What do you need?`,
    contextType: 'teacher dashboard',
    badgeLabel: 'TEACHER AI',
  },
  student: {
    title: 'Student AI Assistant',
    subtitle: 'Ask about your grades, attendance, and academic standing.',
    greeting: (name) => `Hello ${name}! I can help you understand your attendance record, check your academic progress, and explain your transcript. What would you like to know?`,
    contextType: 'student portal',
    badgeLabel: 'STUDENT AI',
  },
  parent: {
    title: 'Parent AI Assistant',
    subtitle: "Ask questions about your child's academic progress and school activities.",
    greeting: (name) => `Hello ${name}! I can help you understand your child's attendance, academic performance, and payment status. Just ask me anything.`,
    contextType: 'parent portal',
    badgeLabel: 'PARENT AI',
  },
};

export default function AiAssistantPage() {
  const { user } = useAuth();
  const config = ROLE_CONFIG[user?.role] || ROLE_CONFIG.admin;
  const chatEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [messages, setMessages] = useState([
    { role: 'ai', content: config.greeting(user?.name?.split(' ')[0] || 'there') }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await API.post('/ai/query', {
        query: userMsg,
        contextType: config.contextType,
        contextData: { role: user?.role, name: user?.name }
      });
      if (data.success) {
        setMessages(prev => [...prev, { role: 'ai', content: data.data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: data.message || 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: 'Connection error while reaching the AI service. Please check that the Gemini API key is configured.' }]);
    } finally {
      setLoading(false);
    }
  };

  const MessageBubble = ({ m }) => (
    <div style={{
      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
      maxWidth: isMobile ? '88%' : '85%',
      display: 'flex', flexDirection: 'column',
      alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
    }}>
      <div style={{ fontSize: isMobile ? '10px' : '11px', color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600, padding: '0 4px' }}>
        {m.role === 'user' ? 'You' : 'Gemini AI'}
      </div>
      <div style={{
        background: m.role === 'user' ? 'var(--color-gold)' : 'var(--color-bg-card)',
        color: m.role === 'user' ? '#000' : 'var(--color-text-primary)',
        border: m.role === 'user' ? 'none' : '1px solid var(--color-border)',
        padding: isMobile ? '12px 16px' : '14px 18px', borderRadius: '16px',
        borderBottomRightRadius: m.role === 'user' ? '4px' : '16px',
        borderBottomLeftRadius: m.role === 'user' ? '16px' : '4px',
        lineHeight: 1.65, fontSize: isMobile ? '14px' : '14.5px', whiteSpace: 'pre-wrap',
        boxShadow: m.role === 'user' ? '0 4px 12px rgba(245,158,11,0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        {m.content}
      </div>
    </div>
  );

  const ChatContent = () => (
    <>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px', background: 'var(--color-bg-primary)' }}>
        {messages.map((m, i) => <MessageBubble key={i} m={m} />)}
        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: isMobile ? '12px 16px' : '14px 18px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '16px', borderBottomLeftRadius: '4px', color: 'var(--color-text-muted)', fontSize: isMobile ? '13px' : '14px' }}>
            <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} />
            Gemini is thinking...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: isMobile ? '12px 16px 20px' : '16px 24px', background: 'var(--color-bg-card)', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: isMobile ? '8px' : '12px', position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder={
              user?.role === 'student' ? 'Ask about your grades, attendance...'
              : user?.role === 'parent' ? "Ask about your child's progress..."
              : 'Ask anything about your data...'
            }
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ flex: 1, padding: isMobile ? '12px 16px' : '16px 20px', paddingRight: isMobile ? '90px' : '120px', borderRadius: '30px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', fontSize: isMobile ? '14px' : '15px' }}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !input.trim()}
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', borderRadius: '24px', padding: '0 18px', fontWeight: 700, height: isMobile ? '36px' : '40px' }}
          >
            Send
          </button>
        </form>
        {!isMobile && (
          <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '12px' }}>
            AI responses are generated by Gemini. Verify critical information on your dashboard.
          </div>
        )}
      </div>
    </>
  );

  // Mobile: true full-screen overlay
  if (isMobile) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'var(--color-bg-primary)', display: 'flex', flexDirection: 'column', height: '100dvh' }}>
        {/* Mobile Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{config.title}</h1>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0 }}>{config.subtitle}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'var(--color-gold)', color: '#000', padding: '3px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: 800 }}>
              {config.badgeLabel}
            </div>
            <button
              onClick={() => window.history.back()}
              style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        </div>
        <ChatContent />
      </div>
    );
  }

  // Desktop: normal layout
  return (
    <ProtectedLayout>
      <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>{config.title}</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: '4px 0 0 0' }}>{config.subtitle}</p>
          </div>
          <div style={{ background: 'var(--color-gold)', color: '#000', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
            {config.badgeLabel}
          </div>
        </div>

        {/* Chat container */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <ChatContent />
        </div>
      </div>
    </ProtectedLayout>
  );
}
