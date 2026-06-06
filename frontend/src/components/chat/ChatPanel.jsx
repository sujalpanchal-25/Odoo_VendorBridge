import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MessageSquare, X, Send, Trash2, ShieldAlert } from 'lucide-react';
import Button from '../common/Button.jsx';
import api from '../../services/api.js';

export default function ChatPanel() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your VendorBridge assistant. Ask me anything about vendors, RFQs, purchase orders, or analytics.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isAuthenticated) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({ message: userMsg, sessionId: user.id })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to stream response');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let streamedResponse = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        
        // SSE responses can contain multiple data rows: `data: {"text":"..."}`
        const lines = chunkValue.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                streamedResponse += parsed.text;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: streamedResponse };
                  return updated;
                });
              }
            } catch (err) {
              // Ignore partial JSON parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error(error.message);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error while processing your request.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.delete(`/chat/${user.id}`);
      setMessages([
        { role: 'assistant', content: 'Conversation history cleared. How can I help you today?' }
      ]);
    } catch (err) {
      console.error('Failed to clear chat history:', err.message);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: 'var(--accent-color)',
          color: 'var(--accent-text)',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 500,
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Slide-in Drawer */}
      <div
        style={{
          position: 'fixed',
          bottom: '96px',
          right: '24px',
          width: '380px',
          height: '500px',
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid var(--border-color)',
          display: isOpen ? 'flex' : 'none',
          flexDirection: 'column',
          zIndex: 500,
          overflow: 'hidden',
          animation: 'slide-up 0.25s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--primary-bg)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} color="var(--accent-color)" />
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Procurement AI</span>
          </div>
          <button
            onClick={handleClearHistory}
            title="Clear Chat History"
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px'
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--danger-color)'}
            onMouseLeave={(e) => e.target.style.color = '#94A3B8'}
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Message Viewport */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                backgroundColor: msg.role === 'user' ? 'var(--accent-color)' : '#F1F5F9',
                color: msg.role === 'user' ? 'var(--accent-text)' : 'var(--text-primary)',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                fontSize: '13px',
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap'
              }}
            >
              {msg.content}
            </div>
          ))}
          {isTyping && (
            <div style={{ alignSelf: 'flex-start', backgroundColor: '#F1F5F9', padding: '10px 14px', borderRadius: '12px 12px 12px 0', display: 'flex', gap: '4px' }}>
              <span className="typing-dot" style={{ animationDelay: '0.1s' }}></span>
              <span className="typing-dot" style={{ animationDelay: '0.2s' }}></span>
              <span className="typing-dot" style={{ animationDelay: '0.3s' }}></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Form Input */}
        <form
          onSubmit={handleSend}
          style={{
            padding: '12px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '8px'
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            style={{
              flexGrow: 1,
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              outline: 'none'
            }}
          />
          <Button
            type="submit"
            variant="primary"
            style={{ padding: '8px 12px', minWidth: '40px', borderRadius: '6px' }}
            disabled={isTyping}
          >
            <Send size={16} />
          </Button>
        </form>
      </div>
      
      {/* Styles for typing animation */}
      <style>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          background-color: var(--text-secondary);
          border-radius: 50%;
          display: inline-block;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
