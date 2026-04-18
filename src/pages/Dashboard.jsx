// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Lock, Unlock, Timer, Zap, Sparkles, Send, Mail, Flame, Ghost } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchCapsules, openCapsule, deleteCapsule } from '../firebase';
import CreateCapsuleModal from '../components/CreateCapsuleModal';

// ── Status Resolver (CRITICAL FIX) ────────────────────────────────
const getCapsuleStatus = (c) => {
  const now = Date.now();
  if (c.destroyed) return 'destroyed';
  // Check if current time is past the auto-expiry time
  if (c.autoExpireAt && c.autoExpireAt.toMillis() < now) return 'expired';
  // Check if current time is before the unlock time
  if (c.unlockAt && c.unlockAt.toMillis() > now) return 'locked';
  return 'unlocked';
};

// ── AI Memory Prompt Widget ──────────────────
const AIWidget = ({ capsuleCount }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [thinking, setThinking] = useState(false);

  const ask = async () => {
    if (!prompt.trim() || thinking) return;
    setThinking(true);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            { role: 'system', content: 'Poetic memory guide for MNEMOCRYPT. Brief, mysterious, under 50 words.' },
            { role: 'user', content: prompt }
          ],
        }),
      });
      const data = await res.json();
      setResponse(data.choices?.[0]?.message?.content ?? 'Connection failed.');
    } catch (e) {
      setResponse('Neural connection lost.');
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="ai-widget glass-v" style={{ padding: '16px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Sparkles size={14} color="var(--violet)" />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '3px', color: '#c080ff' }}>ORACLE</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="input-neon" placeholder="Ask..." value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{ flex: 1 }} />
        <button className="btn btn-filled-violet" onClick={ask} disabled={thinking}><Zap size={13} /></button>
      </div>
      {response && <div style={{ marginTop: 12, fontSize: '0.8rem', fontStyle: 'italic' }}>{response}</div>}
    </div>
  );
};

// ── Capsule Card ──────────────────────────────────────────────────
const CapsuleCard = ({ capsule, onRefresh, currentUserEmail }) => {
  const status = getCapsuleStatus(capsule);
  const [content, setContent] = useState(null);

  const isReceived = capsule.recipientEmail === currentUserEmail?.toLowerCase();
  
  const handleOpen = async () => {
    if (status !== 'unlocked' || capsule.destroyed) return;
    await openCapsule(capsule.id, capsule.destroyAfterView);
    setContent(capsule.content);
    onRefresh?.();
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Delete this neural packet?')) {
      await deleteCapsule(capsule.id);
      onRefresh?.();
    }
  };

  const statusColors = {
    locked: '#9955FF',
    unlocked: 'var(--cyan)',
    expired: '#ff4444',
    destroyed: '#ff8800'
  };

  return (
    <div 
      className={`glass ${status === 'locked' ? 'capsule-locked' : ''}`} 
      style={{ 
        padding: '16px', 
        opacity: (status === 'expired' || status === 'destroyed') ? 0.6 : 1,
        borderLeft: `4px solid ${statusColors[status]}`
      }}
      onClick={handleOpen}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: statusColors[status] }}>
              {capsule.title}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className={`badge badge-${status}`}>{status.toUpperCase()}</span>
            {isReceived && <span className="badge" style={{ color: '#c080ff' }}>RECEIVED</span>}
            {capsule.isGhost && <span className="badge" style={{ color: 'var(--cyan)' }}>GHOST-SYNCED</span>}
          </div>
          {content && <div style={{ marginTop: 10, padding: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 4 }}>{content}</div>}
        </div>
        <button onClick={handleDelete} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>×</button>
      </div>
    </div>
  );
};

// ── Dashboard ──────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    if (!user?.uid || !user?.email) return;
    setLoading(true);
    const data = await fetchCapsules(user.uid, user.email);
    setCapsules(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Categorization Logic for Boards
  const active = capsules.filter(c => getCapsuleStatus(c) === 'locked' || getCapsuleStatus(c) === 'unlocked');
  const expired = capsules.filter(c => getCapsuleStatus(c) === 'expired');
  const destroyed = capsules.filter(c => getCapsuleStatus(c) === 'destroyed');

  return (
    <div className="page" style={{ padding: '90px 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>
            Welcome, <span className="neon-cyan">{user?.email?.split('@')[0]}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Neural vault synced. {capsules.length} packets online.</p>
        </div>

        {/* Stats Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          <div className="stat-card glass"><Lock size={14}/> <div>{active.filter(c => getCapsuleStatus(c)==='locked').length}</div> <p>Locked</p></div>
          <div className="stat-card glass"><Unlock size={14}/> <div>{active.filter(c => getCapsuleStatus(c)==='unlocked').length}</div> <p>Ready</p></div>
          <div className="stat-card glass"><Timer size={14}/> <div>{expired.length}</div> <p>Expired</p></div>
          <div className="stat-card glass"><Flame size={14}/> <div>{destroyed.length}</div> <p>Destroyed</p></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 30 }}>
          
          {/* Main Content Areas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            
            {/* Active Board */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <p className="section-title" style={{ margin: 0 }}>Active Timeline</p>
                <button className="btn btn-filled-cyan" onClick={() => setShowCreate(true)}>+ Seal Memory</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {active.length === 0 && <div className="glass" style={{ padding: '20px', textAlign: 'center' }}>No active packets.</div>}
                {active.map(c => <CapsuleCard key={c.id} capsule={c} onRefresh={load} currentUserEmail={user?.email} />)}
              </div>
            </section>

            {/* Expired/Destroyed Archive Board */}
            {(expired.length > 0 || destroyed.length > 0) && (
              <section style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 30 }}>
                <p className="section-title">Data Graveyard (Expired & Destroyed)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                   {expired.map(c => <CapsuleCard key={c.id} capsule={c} onRefresh={load} currentUserEmail={user?.email} />)}
                   {destroyed.map(c => <CapsuleCard key={c.id} capsule={c} onRefresh={load} currentUserEmail={user?.email} />)}
                </div>
              </section>
            )}
          </div>

          <aside>
            <AIWidget />
          </aside>
        </div>
      </div>

      {showCreate && <CreateCapsuleModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  );
};

export default Dashboard;