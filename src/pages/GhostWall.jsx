// src/pages/GhostWall.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Ghost, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { postGhostMessage, fetchGhostMessages } from '../firebase';

// ── Opacity decay based on message age ─────────────────────────
// Messages fade from 1.0 → 0.12 over 7 days
const calcOpacity = (createdAt) => {
  if (!createdAt) return 0.6;
  const ageMs = Date.now() - createdAt.toMillis();
  const ageHours = ageMs / 3600000;
  const maxAgeHours = 168; // 7 days
  const decay = Math.max(0, 1 - ageHours / maxAgeHours);
  return 0.12 + decay * 0.88; // clamp between 0.12 and 1.0
};

// ── Relative time ───────────────────────────────────────────────
const relativeTime = (ts) => {
  if (!ts) return 'just now';
  const diff = Date.now() - ts.toMillis();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};

// ── Ghost Line Component ────────────────────────────────────────
const GhostLine = ({ msg, index }) => {
  const opacity = calcOpacity(msg.createdAt);
  const isRecent = opacity > 0.85;
  const isFading = opacity < 0.4;

  return (
    <motion.div
      className="ghost-line"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity }}
      transition={{ duration: 0.6, delay: index * 0.04 }}
      style={{
        filter: isFading ? 'blur(0.4px)' : 'none',
        borderBottom: '1px solid rgba(255,255,255,0.02)',
        paddingBottom: 6,
        marginBottom: 2,
      }}
    >
      {/* Handle */}
      <span
        className="ghost-handle"
        style={{
          opacity: Math.min(1, opacity + 0.2),
          textShadow: isRecent ? '0 0 8px var(--cyan)' : 'none',
        }}
      >
        {msg.handle || 'ghost'}
      </span>

      {/* Message */}
      <span style={{ color: `rgba(208,250,255,${opacity})` }}>
        {msg.message}
      </span>

      {/* Timestamp */}
      <span className="ghost-time" style={{ opacity: opacity * 0.6 }}>
        {relativeTime(msg.createdAt)}
      </span>

      {/* Fading indicator */}
      {isFading && (
        <span
          style={{
            marginLeft: 8,
            fontSize: '0.65rem',
            color: 'rgba(112,0,255,0.5)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '1px',
          }}
        >
          [fading]
        </span>
      )}
    </motion.div>
  );
};

// ── GhostWall ───────────────────────────────────────────────────
const GhostWall = () => {
  const { user }   = useAuth();
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [handle, setHandle]         = useState('');
  const [sending, setSending]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [liveCount, setLiveCount]   = useState(0);
  const bodyRef  = useRef(null);
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchGhostMessages();
    setMessages(data);
    setLiveCount(data.filter((m) => calcOpacity(m.createdAt) > 0.15).length);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(id);
  }, [load]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  // Pre-fill handle from user display name
  useEffect(() => {
    if (user && !handle) {
      setHandle(user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'ghost');
    }
  }, [user]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    if (msg.length > 280) {
      setError('Max 280 characters.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await postGhostMessage(user.uid, handle || 'ghost', msg);
      setInput('');
      await load();
      inputRef.current?.focus();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Typing prompt suggestions
  const PROMPTS = [
    'leave a message for a stranger',
    'what do you want your future self to remember?',
    "a thought you'd never say out loud",
    'something true, something secret',
  ];
  const [promptIdx, setPromptIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPromptIdx((i) => (i + 1) % PROMPTS.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="page" style={{ padding: '90px 32px 64px' }}>
      {/* Background violet bloom */}
      <div
        style={{
          position: 'fixed',
          bottom: '20%', left: '10%',
          width: '50vw', height: '50vh',
          background: 'radial-gradient(ellipse, rgba(112,0,255,0.04) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p className="section-title">Ghost Wall</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                  fontWeight: 700,
                }}
              >
                The <span className="neon-violet">Ghost</span> Wall
              </h1>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.6 }}>
                Anonymous messages drift through time.
                Older messages fade and eventually vanish.
                <br />
                <span style={{ color: 'rgba(0,245,255,0.5)' }}>
                  {liveCount} active ghost{liveCount !== 1 ? 's' : ''}
                </span>
              </p>
            </div>
            <button
              className="btn btn-ghost"
              onClick={load}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              title="Refresh"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {/* Terminal board */}
        <div className="terminal" style={{ marginBottom: 20 }}>
          {/* Terminal header bar */}
          <div className="terminal-header">
            <div className="terminal-dot" style={{ background: '#FF5F57' }} />
            <div className="terminal-dot" style={{ background: '#FEBC2E' }} />
            <div className="terminal-dot" style={{ background: '#28C840' }} />
            <span
              style={{
                marginLeft: 10,
                fontFamily: 'var(--font-display)',
                fontSize: '0.6rem',
                letterSpacing: '2px',
                color: 'var(--text-muted)',
              }}
            >
              GHOST_WALL — ENCRYPTED BROADCAST
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.65rem',
                color: 'rgba(0,245,255,0.4)',
              }}
            >
              {messages.length} transmissions
            </span>
          </div>

          {/* Messages */}
          <div className="terminal-body" ref={bodyRef} style={{ minHeight: 300, maxHeight: '55vh' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: '0.82rem', padding: 20 }}>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 1.5 }} />
                Scanning ghost frequencies...
              </div>
            ) : messages.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '20px 0' }}>
                <Ghost size={24} color="rgba(112,0,255,0.3)" style={{ marginBottom: 10, display: 'block' }} />
                The wall is empty. Be the first ghost.
                <span className="cursor" />
              </div>
            ) : (
              <AnimatePresence>
                {[...messages].reverse().map((msg, i) => (
                  <GhostLine key={msg.id} msg={msg} index={i} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Input section */}
        <div className="glass" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            {/* Handle input */}
            <div style={{ width: 140, flexShrink: 0 }}>
              <input
                className="input-neon"
                placeholder="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value.slice(0, 20))}
                style={{ fontSize: '0.82rem' }}
              />
            </div>

            {/* Message input */}
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                ref={inputRef}
                className="input-neon"
                placeholder={`> ${PROMPTS[promptIdx]}`}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 280))}
                onKeyDown={handleKeyDown}
                style={{ fontSize: '0.85rem', paddingRight: 80 }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.65rem',
                  color: input.length > 250 ? 'var(--red-err)' : 'var(--text-muted)',
                }}
              >
                {input.length}/280
              </span>
            </div>

            {/* Send button */}
            <button
              className="btn btn-filled-violet"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              style={{ padding: '10px 18px', flexShrink: 0 }}
            >
              {sending
                ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />
                : <Send size={14} />
              }
            </button>
          </div>

          {error && (
            <p style={{ fontSize: '0.75rem', color: 'var(--red-err)' }}>{error}</p>
          )}

          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <Ghost size={10} style={{ display: 'inline', marginRight: 5 }} />
            Messages fade over 7 days. Fresh transmissions glow bright.
            Press <kbd style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3, fontSize: '0.65rem' }}>Enter</kbd> to send.
          </p>
        </div>

        {/* Opacity legend */}
        <div
          style={{
            marginTop: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>Opacity legend:</span>
          {[
            { label: 'Fresh', op: 1.0, color: 'var(--cyan)' },
            { label: '1 day', op: 0.75, color: 'var(--text-primary)' },
            { label: '3 days', op: 0.45, color: 'var(--text-muted)' },
            { label: '7 days', op: 0.12, color: 'var(--text-muted)' },
          ].map(({ label, op, color }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: color,
                  opacity: op,
                }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GhostWall;