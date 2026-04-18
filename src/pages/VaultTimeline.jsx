// src/pages/VaultTimeline.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Flame, Timer, Clock, X, Plus, Mail, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchCapsules, openCapsule, deleteCapsule } from '../firebase';
import CreateCapsuleModal from '../components/CreateCapsuleModal';

// ── Status logic ─────────────────────────────────────────────────
const getCapsuleStatus = (c) => {
  const now = Date.now();
  if (c.destroyed)   return 'destroyed';
  if (c.autoExpireAt && c.autoExpireAt.toMillis() < now) return 'expired';
  if (c.unlockAt && c.unlockAt.toMillis() > now)         return 'locked';
  return 'unlocked';
};

const formatDate = (ts) =>
  ts ? new Date(ts.toMillis()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : null;

const timeUntil = (ts) => {
  if (!ts) return null;
  const diff = ts.toMillis() - Date.now();
  if (diff <= 0) return 'Now';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h remaining`;
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
};

// ── Capsule detail drawer ─────────────────────────────────────────
const CapsuleDrawer = ({ capsule, onClose, onAction, currentUserEmail }) => {
  const status = getCapsuleStatus(capsule);
  const [content, setContent] = useState(null);
  const [opening, setOpening]  = useState(false);

  const isReceived = capsule.recipientEmail === currentUserEmail?.toLowerCase();

  const handleOpen = async () => {
    if (status !== 'unlocked') return;
    setOpening(true);
    await openCapsule(capsule.id, capsule.destroyAfterView);
    setContent(capsule.content);
    onAction?.();
    setOpening(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Permanently delete this capsule?')) {
      await deleteCapsule(capsule.id);
      onAction?.();
      onClose();
    }
  };

  if (!capsule) return null;

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="modal-box"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        style={{ maxWidth: 480 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {status === 'locked' ? <Lock size={16} color="var(--violet)" /> : <Unlock size={16} color="var(--cyan)" />}
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '2px', color: status === 'locked' ? '#9955FF' : 'var(--cyan)' }}>
              {capsule.title}
            </span>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '4px 8px' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Created', val: formatDate(capsule.createdAt) },
            { label: 'Status', val: status.toUpperCase() },
            isReceived && { label: 'Sender', val: capsule.senderEmail || 'Anonymous' },
            capsule.unlockAt && { label: 'Unlocks', val: formatDate(capsule.unlockAt) },
            capsule.autoExpireAt && { label: 'Expires', val: formatDate(capsule.autoExpireAt) },
            capsule.destroyAfterView && { label: 'Self-Destruct', val: 'On First View' },
          ].filter(Boolean).map(({ label, val }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '8px 12px' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{val}</div>
            </div>
          ))}
        </div>

        {status === 'locked' && (
          <div style={{ background: 'rgba(112,0,255,0.08)', border: '1px solid rgba(112,0,255,0.25)', borderRadius: 8, padding: '20px', textAlign: 'center', color: '#9966CC', fontSize: '0.82rem', marginBottom: 16 }}>
            <Lock size={28} color="rgba(112,0,255,0.5)" style={{ marginBottom: 10 }} /><br />
            Sealed until <strong style={{ color: '#c080ff' }}>{formatDate(capsule.unlockAt)}</strong><br />
            <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>{timeUntil(capsule.unlockAt)}</span>
          </div>
        )}

        {status === 'unlocked' && !capsule.viewed && (
          <button className="btn btn-filled-cyan" onClick={handleOpen} disabled={opening} style={{ width: '100%', padding: 14, marginBottom: 12 }}>
            {opening ? 'Opening...' : capsule.destroyAfterView ? '⚡ Open (destroys after)' : '🔓 Open Capsule'}
          </button>
        )}

        {(capsule.viewed || content) && status === 'unlocked' && !capsule.destroyed && (
          <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,245,255,0.15)', borderRadius: 8, padding: '16px', fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: 12, whiteSpace: 'pre-wrap' }}>
            {content ?? capsule.content}
          </div>
        )}

        <div className="divider" />
        <button className="btn btn-danger" onClick={handleDelete} style={{ width: '100%', padding: 10 }}>Delete Capsule</button>
      </motion.div>
    </motion.div>
  );
};

// ── Timeline Item ─────────────────────────────────────────────────
const TimelineItem = ({ capsule, index, onClick, currentUserEmail }) => {
  const status = getCapsuleStatus(capsule);
  const isReceived = capsule.recipientEmail === currentUserEmail?.toLowerCase();
  const isSentToOthers = capsule.recipientEmail && capsule.recipientEmail !== currentUserEmail?.toLowerCase();

  const isLocked = status === 'locked';
  const isUnlocked = status === 'unlocked';
  const isDead = status === 'expired' || status === 'destroyed';

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: isDead ? 0.45 : 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      style={{ position: 'relative', paddingLeft: 44, marginBottom: 20 }}
    >
      <div className={`timeline-dot ${isUnlocked && !isDead ? 'open' : ''}`} style={{ boxShadow: isUnlocked && !isDead ? '0 0 10px var(--cyan)' : isLocked ? '0 0 8px var(--violet)' : 'none' }} />
      <div
        className={isLocked ? 'capsule-locked' : 'glass'}
        style={{ borderRadius: 10, padding: '16px 20px', cursor: isDead ? 'not-allowed' : 'pointer', border: isLocked ? '1px solid rgba(112,0,255,0.3)' : '1px solid rgba(255,255,255,0.1)' }}
        onClick={() => !isDead && onClick(capsule)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', color: isLocked ? '#aa77ee' : 'var(--text-primary)', marginBottom: 6 }}>
              {capsule.title}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`badge badge-${isLocked ? 'locked' : isUnlocked ? 'unlocked' : 'expired'}`}>{status}</span>
              {isReceived && <span className="badge" style={{ background: 'rgba(192,128,255,0.15)', color: '#c080ff' }}><Mail size={10} /> RECVD</span>}
              {isSentToOthers && <span className="badge" style={{ background: 'rgba(0,245,255,0.1)', color: 'var(--cyan)' }}><Send size={10} /> SENT</span>}
            </div>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{formatDate(capsule.createdAt)}</div>
        </div>
      </div>
    </motion.div>
  );
};

// ── VaultTimeline ─────────────────────────────────────────────────
const VaultTimeline = () => {
  const { user }  = useAuth();
  const [capsules, setCapsules]       = useState([]); 
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [filter, setFilter]           = useState('all');

  const load = useCallback(async () => {
    if (!user?.uid || !user?.email) return; 
    setLoading(true);
    const data = await fetchCapsules(user.uid, user.email);
    setCapsules(data || []); // 🟢 Safety fallback
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // 🟢 Safety fallback for the filter logic
  const safeCapsules = capsules || [];
  const filtered = safeCapsules.filter((c) => {
    if (filter === 'all') return true;
    const s = getCapsuleStatus(c);
    if (filter === 'expired') return s === 'expired' || s === 'destroyed';
    return s === filter;
  });

  return (
    <div className="page" style={{ padding: '90px 32px 64px' }}>
      <div style={{ position: 'relative', zIndex: 2, maxWidth: 740, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <p className="section-title">Vault Timeline</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 700 }}>Memory <span className="neon-cyan">Stream</span></h1>
          </div>
          <button className="btn btn-filled-cyan" onClick={() => setShowCreate(true)}>+ Seal New</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {['all', 'locked', 'unlocked', 'expired'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? 'rgba(0,245,255,0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 14px', color: filter === f ? 'var(--cyan)' : 'var(--text-muted)', cursor: 'pointer' }}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="timeline-wrapper">
            <div className="timeline-rail" />
            <AnimatePresence>
              {filtered.length === 0 ? (
                <div className="glass" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No capsules found.</div>
              ) : (
                filtered.map((c, i) => (
                  <TimelineItem key={c.id} capsule={c} index={i} onClick={setSelected} currentUserEmail={user?.email} />
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <CapsuleDrawer capsule={selected} onClose={() => setSelected(null)} onAction={() => { load(); setSelected(null); }} currentUserEmail={user?.email} />
        )}
      </AnimatePresence>

      {showCreate && <CreateCapsuleModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  );
};

export default VaultTimeline;