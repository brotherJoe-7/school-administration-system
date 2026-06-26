import React, { useState, useRef, useEffect } from 'react';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function AiAssistantPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const chatEndRef = useRef(null);

  const [messages, setMessages] = useState([
    { 
      role: 'ai', 
      content: `Hello ${user?.name?.split(' ')[0]}! I am your AI Assistant powered by Gemini. How can I help you analyze your ${isSuperAdmin ? 'global platform' : 'school'} data today?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        contextType: isSuperAdmin ? 'global platform' : 'school',
        contextData: isSuperAdmin 
          ? { mrr: 12450, schools: 1, status: 'Active' } 
          : { payroll: '$48,200', attendance: '92%' }
      });
      if (data.success) {
        setMessages(prev => [...prev, { role: 'ai', content: data.data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: data.message || 'Sorry, I encountered an error. Please try again.' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: 'Connection error while reaching the AI service.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedLayout>
      <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
              {isSuperAdmin ? 'Platform AI Assistant' : 'School AI Assistant'}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: '4px 0 0 0' }}>
              Query your {isSuperAdmin ? 'global platform metrics' : 'administrative data'} using natural language.
            </p>
          </div>
          <div style={{ background: 'var(--color-gold)', color: '#000', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
            GEMINI POWERED
          </div>
        </div>

        {/* Chat Area */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--color-bg-primary)' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ 
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{ 
                  fontSize: '11px', 
                  color: 'var(--color-text-muted)', 
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  padding: '0 4px'
                }}>
                  {m.role === 'user' ? 'You' : 'Gemini AI'}
                </div>
                <div style={{ 
                  background: m.role === 'user' ? 'var(--color-gold)' : 'var(--color-bg-card)',
                  color: m.role === 'user' ? '#000' : 'var(--color-text-primary)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--color-border)',
                  padding: '14px 18px',
                  borderRadius: '16px',
                  borderBottomRightRadius: m.role === 'user' ? '4px' : '16px',
                  borderBottomLeftRadius: m.role === 'user' ? '16px' : '4px',
                  lineHeight: 1.6,
                  fontSize: '14.5px',
                  boxShadow: m.role === 'user' ? '0 4px 12px rgba(245, 158, 11, 0.2)' : '0 4px 12px rgba(0,0,0,0.05)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            
            {loading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 18px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '16px', borderBottomLeftRadius: '4px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                Gemini is thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '16px 24px', background: 'var(--color-bg-card)', borderTop: '1px solid var(--color-border)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ask anything about your data..." 
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ flex: 1, padding: '16px 20px', paddingRight: '120px', borderRadius: '30px', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', fontSize: '15px' }}
                disabled={loading}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || !input.trim()}
                style={{ position: 'absolute', right: '8px', top: '8px', bottom: '8px', borderRadius: '24px', padding: '0 24px', fontWeight: 700 }}
              >
                Send
              </button>
            </form>
            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '12px' }}>
              AI can make mistakes. Verify important administrative data on your dashboard.
            </div>
          </div>

        </div>
      </div>
    </ProtectedLayout>
  );
}
