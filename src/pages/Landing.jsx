// src/pages/Landing.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Key, Globe, RefreshCcw } from 'lucide-react'; // Added RefreshCcw icon
import { useAuth } from '../context/AuthContext';
import { resetPassword } from '../firebase'; // Import the new helper
import ThreeBackground from '../components/ThreeBackground';

const TAGLINES = [
  'Seal your memories across time.',
  'Encrypt the past. Unlock the future.',
  'What if a letter could open itself?',
  'Some thoughts are worth preserving.',
];

const Landing = () => {
  const { user, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tagline, setTagline] = useState(0);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  useEffect(() => {
    const id = setInterval(() => setTagline((t) => (t + 1) % TAGLINES.length), 4000);
    return () => clearInterval(id);
  }, []);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Recovery Logic ────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Input neural address (email) first for recovery.");
      return;
    }
    try {
      await resetPassword(email);
      alert("📡 RECOVERY_SIGNAL_SENT: Check your uplink (inbox) for the reset link.");
    } catch (err) {
      setError("RECOVERY_FAILED: " + err.message.replace('Firebase: ', '').trim());
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <ThreeBackground />
      <div className="grain" />
      <div className="scanline" />

      {/* Radial bloom effects */}
      <div style={{ position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: '60vw', height: '60vh', background: 'radial-gradient(ellipse, rgba(0,245,255,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(24px, 6vw, 80px)', gap: 40 }}>
        
        {/* Left: Hero */}
        <div style={{ flex: 1, maxWidth: 560 }}>
          <div className="hero-eyebrow fade-up">◈ Personal Memory Vault</div>
          <h1 className="hero-title fade-up delay-1">
            <span className="neon-cyan flicker">MNEMO</span><br />
            <span style={{ color: 'rgba(208,250,255,0.85)' }}>CRYPT</span>
          </h1>
          <p className="hero-sub fade-up delay-2" style={{ marginTop: 24, marginBottom: 32, minHeight: 56 }}>
            {TAGLINES[tagline]}<span className="cursor" />
          </p>
        </div>

        {/* Right: Auth panel */}
        <div style={{ width: '100%', maxWidth: 400, flexShrink: 0 }}>
          <div className="glass cyber-panel fade-up delay-4" style={{ padding: '36px 32px', position: 'relative' }}>
            
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Lock size={18} color="var(--cyan)" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '3px', color: 'var(--cyan)' }}>
                {mode === 'login' ? 'ACCESS_GRANTED' : 'INITIALIZE_IDENTITY'}
              </h2>
            </div>

            <button className="btn btn-ghost" onClick={handleGoogle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
              <Globe size={14} /> Continue with Google
            </button>

            <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <Mail size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,245,255,0.4)' }} />
                <input className="input-neon" type="email" placeholder="neural@address.void" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ paddingLeft: 34 }} />
              </div>

              <div style={{ position: 'relative' }}>
                <Key size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,245,255,0.4)' }} />
                <input className="input-neon" type="password" placeholder="encryption key..." value={password} onChange={(e) => setPassword(e.target.value)} required={mode === 'login'} style={{ paddingLeft: 34 }} />
              </div>

              {/* Forgot Password Link */}
              {mode === 'login' && (
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  style={{ background: 'none', border: 'none', color: 'rgba(0,245,255,0.5)', fontSize: '0.65rem', textAlign: 'right', cursor: 'pointer', fontFamily: 'var(--font-mono)', marginTop: -6 }}
                >
                  [RECOVER_ACCESS]
                </button>
              )}

              {error && (
                <div style={{ background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: 6, padding: '8px 12px', fontSize: '0.78rem', color: '#ff3366' }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-filled-cyan" disabled={loading} style={{ width: '100%', textTransform: 'uppercase', letterSpacing: '2px' }}>
                {loading ? 'AUTHENTICATING...' : (mode === 'login' ? 'Enter Vault' : 'Secure Identity')}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 18 }}>
              {mode === 'login' ? "No vault yet? " : 'Already encrypted? '}
              <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--cyan)', cursor: 'pointer', textDecoration: 'underline' }}>
                {mode === 'login' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;