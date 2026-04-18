// src/components/CreateCapsuleModal.jsx
import React, { useState } from 'react';
import { X, Clock, Flame, Timer, Ghost, Mail } from 'lucide-react';
import { createCapsule } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Timestamp } from 'firebase/firestore';

const TYPES = [
  {
    id: 'timed',
    icon: <Clock size={14} />,
    label: 'Timed Unlock',
    desc: 'Sealed until a future date',
  },
  {
    id: 'destroy',
    icon: <Flame size={14} />,
    label: 'Destroy on View',
    desc: 'Self-destructs after first open',
  },
  {
    id: 'expire',
    icon: <Timer size={14} />,
    label: 'Auto-Expire',
    desc: 'Permanently erased at deadline',
  },
];

const CreateCapsuleModal = ({ onClose, onCreated }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [capsuleType, setCapsuleType] = useState('timed');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockAt, setUnlockAt] = useState('');
  const [autoExpireAt, setAutoExpireAt] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isGhost, setIsGhost] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }
    
    // Validation for specific types
    if (capsuleType === 'timed' && !unlockAt) {
      setError('Please set an unlock date.');
      return;
    }
    if (capsuleType === 'expire' && !autoExpireAt) {
      setError('Please set an expiry date.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // 🟢 DATE CONVERSION
      const unlockDate = unlockAt ? Timestamp.fromDate(new Date(unlockAt)) : null;
      const expireDate = autoExpireAt ? Timestamp.fromDate(new Date(autoExpireAt)) : null;

      const capsuleData = {
        title: title.trim(),
        content: content.trim(),
        unlockAt: unlockDate,
        autoExpireAt: expireDate,
        destroyAfterView: capsuleType === 'destroy',
        recipientEmail: recipientEmail.toLowerCase().trim() || null,
        senderEmail: user.email.toLowerCase(),
        isGhost: isGhost,
        // 🛠️ ADDED EXPLICIT FLAGS FOR DASHBOARD CATEGORIZATION
        viewed: false,
        destroyed: false, 
      };

      console.log("🚀 Sealing Capsule:", capsuleData);

      await createCapsule(user.uid, capsuleData);
      
      onCreated?.(); // Refresh Dashboard
      onClose();     // Close Modal
    } catch (e) {
      console.error("❌ Sealing Error:", e);
      setError(`Sealing failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box fade-up" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--cyan)' }}>
            NEW_NEURAL_PACKET_INIT
          </span>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '4px 8px' }}>
            <X size={15} />
          </button>
        </div>

        {/* Step 1 — Type Selection */}
        {step === 1 && (
          <div>
            <p className="section-title" style={{ marginBottom: 16 }}>Select Protocol</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setCapsuleType(t.id)}
                  style={{
                    background: capsuleType === t.id ? 'rgba(0,245,255,0.07)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${capsuleType === t.id ? 'var(--cyan)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 8, padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', transition: 'all 0.2s',
                  }}
                >
                  <span style={{ color: capsuleType === t.id ? 'var(--cyan)' : 'var(--text-muted)' }}>{t.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '1px', color: capsuleType === t.id ? 'var(--cyan)' : 'var(--text-primary)' }}>
                      {t.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="divider" style={{ margin: '20px 0' }} />
            <button className="btn btn-filled-cyan" style={{ width: '100%' }} onClick={() => setStep(2)}>
              Proceed to Encoding →
            </button>
          </div>
        )}

        {/* Step 2 — Content Input */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p className="section-title">Input Neural Data</p>
            <input 
              className="input-neon" 
              placeholder="Packet Title..." 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
            <textarea 
              className="input-neon" 
              placeholder="Type your message here..." 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              rows={5} 
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <input type="checkbox" checked={isGhost} onChange={(e) => setIsGhost(e.target.checked)} />
              <Ghost size={12} /> Sync with Ghost Wall
            </label>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-filled-cyan" style={{ flex: 2 }} onClick={() => setStep(3)}>Finalize →</button>
            </div>
          </div>
        )}

        {/* Step 3 — Logic & Recipient */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p className="section-title">Execution Parameters</p>

            {capsuleType === 'timed' && (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>UNLOCK_TIMESTAMP</label>
                <input 
                  type="datetime-local" 
                  className="input-neon" 
                  value={unlockAt} 
                  onChange={(e) => setUnlockAt(e.target.value)} 
                  min={new Date().toISOString().slice(0, 16)} 
                />
              </div>
            )}

            {capsuleType === 'expire' && (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>EXPIRY_TIMESTAMP</label>
                <input 
                  type="datetime-local" 
                  className="input-neon" 
                  value={autoExpireAt} 
                  onChange={(e) => setAutoExpireAt(e.target.value)} 
                  min={new Date().toISOString().slice(0, 16)} 
                />
              </div>
            )}

            <div style={{ background: 'rgba(0,245,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,245,255,0.1)' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--cyan)', fontWeight: 'bold' }}>RECIPIENT_UPLINK (OPTIONAL)</label>
              <input 
                type="email" 
                className="input-neon" 
                placeholder="user@network.com" 
                value={recipientEmail} 
                onChange={(e) => setRecipientEmail(e.target.value)} 
                style={{ marginTop: 8 }}
              />
            </div>

            {error && <p style={{ color: '#ff4444', fontSize: '0.75rem', textAlign: 'center' }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(2)}>Back</button>
              <button className="btn btn-filled-violet" style={{ flex: 2 }} onClick={handleSave} disabled={saving}>
                {saving ? 'ENCRYPTING...' : 'SEAL_PACKET'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateCapsuleModal;