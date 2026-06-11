import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Brain, Loader2, User } from 'lucide-react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import PageTransition from '../components/layouts/PageTransition';
import { chatApi } from '../api/client';
import { ErrorAlert } from '../components/UiComponents';

export default function ChatPage() {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    chatApi.startChat()
      .then((res) => setSessionId(res.data.session_id))
      .catch(() => setError('Failed to start chat session'));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || loading) return;
    const text = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true); setError('');
    try {
      const res = await chatApi.sendMessage(sessionId, text);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.response || res.data.message }]);
    } catch (err) {
      setError('Failed to get response');
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <PageTransition>
        <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3"><MessageSquare className="w-7 h-7 text-primary" /> AI Health Chat</h1>
            <p className="text-text-secondary mt-1">Discuss symptoms and health questions with our AI</p>
          </div>

          {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scroll-area bg-white/30 rounded-2xl border border-border p-4 mb-4 space-y-4">
            {messages.length === 0 && !loading && (
              <div className="text-center py-20 text-text-tertiary">
                <Brain className="w-12 h-12 mx-auto mb-3 text-primary/40" />
                <p className="text-sm">Start a conversation — ask about symptoms, conditions, or health questions.</p>
              </div>
            )}
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                      <Brain className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user' ? 'bg-primary text-text-primary' : 'bg-white border border-border text-text-secondary'
                  }`}>
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-secondary" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center"><Brain className="w-4 h-4 text-primary animate-pulse" /></div>
                <div className="bg-white border border-border rounded-2xl px-4 py-3"><span className="flex gap-1"><span className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{animationDelay:'0ms'}} /><span className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{animationDelay:'150ms'}} /><span className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" style={{animationDelay:'300ms'}} /></span></div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="flex gap-3">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..."
              className="input flex-1" disabled={!sessionId || loading} />
            <button type="submit" disabled={!input.trim() || !sessionId || loading} className="btn-primary px-5 disabled:opacity-50">
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
}
