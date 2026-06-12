import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

/* ─── Shared animated background ─── */
function AnimatedBg() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = canvas.parentElement.offsetWidth; canvas.height = canvas.parentElement.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const count = 50;
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5, dx: (Math.random() - 0.5) * 0.35, dy: (Math.random() - 0.5) * 0.35,
      a: Math.random() * 0.45 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(72,129,248,${p.a})`; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 110) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.strokeStyle = `rgba(72,129,248,${0.07 * (1 - d / 110)})`; ctx.lineWidth = 0.5; ctx.stroke(); }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(null);

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (login && (localStorage.getItem('token') && localStorage.getItem('user'))) {
      navigate('/dashboard', { replace: true });
      return;
    }
    setTimeout(() => setVisible(true), 60);
  }, [navigate, login]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const result = await login({ email: formData.email, password: formData.password, rememberMe });
      if (result.success) {
        showSuccess('Welcome back!');
        const isAdmin = result.user?.isAdmin === true;
        setTimeout(() => navigate(isAdmin ? '/admin' : '/dashboard'), 100);
      } else {
        showError(result.error || 'Login failed');
      }
    } catch (error) {
      showError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%', padding: '0.85rem 0.85rem 0.85rem 2.8rem',
    background: focused === field ? 'rgba(72,129,248,0.06)' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${errors[field] ? 'rgba(248,113,113,0.7)' : focused === field ? 'rgba(72,129,248,0.6)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none',
    transition: 'all 0.2s ease', boxSizing: 'border-box',
    boxShadow: focused === field ? '0 0 0 3px rgba(72,129,248,0.15)' : 'none',
  });

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: 'linear-gradient(135deg,#06091a 0%,#0d1433 50%,#0f172a 100%)', fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        ::placeholder { color: rgba(255,255,255,0.3); }
        .auth-card { opacity:0; transform:translateY(24px); transition: opacity 0.65s ease, transform 0.65s cubic-bezier(.22,1,.36,1); }
        .auth-card.visible { opacity:1; transform:translateY(0); }
        .left-panel { opacity:0; transform:translateX(-24px); transition: opacity 0.65s 0.1s ease, transform 0.65s 0.1s cubic-bezier(.22,1,.36,1); }
        .left-panel.visible { opacity:1; transform:translateX(0); }
        .signin-btn { background: linear-gradient(135deg,#4881F8,#6366f1); border:none; border-radius:12px; color:#fff; font-size:1rem; font-weight:600; padding:0.9rem; cursor:pointer; width:100%; transition: opacity 0.2s, transform 0.18s; letter-spacing:0.01em; }
        .signin-btn:hover:not(:disabled) { opacity:0.9; transform:translateY(-1px); }
        .signin-btn:active { transform:scale(0.98); }
        .signin-btn:disabled { opacity:0.55; cursor:not-allowed; }
      `}</style>

      {/* Left branding panel — desktop only */}
      <div className={`left-panel ${visible ? 'visible' : ''} hidden lg:flex lg:flex-1 relative flex-col items-center justify-center p-8 xl:p-12 overflow-hidden`}>
        <AnimatedBg />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '380px' }}>
          <h1 className="fade-in" style={{ color: '#fff', fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
            Next-Gen{' '}
            <span style={{ background: 'linear-gradient(90deg,#4881F8,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Manufacturing
            </span>
            <br />Procurement
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', lineHeight: 1.7 }}>
            AI-powered B2B platform connecting buyers with world-class manufacturers for precision parts and components.
          </p>

          {/* Decorative orbs */}
          <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(72,129,248,0.12) 0%, transparent 70%)', top: '-80px', left: '-100px', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)', bottom: '-60px', right: '-60px', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-screen lg:min-h-0">
        <div className={`auth-card ${visible ? 'visible' : ''}`} style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: 'clamp(1.5rem, 4vw, 2.75rem) clamp(1.25rem, 3vw, 2.5rem)' }}>
            <div className="mb-8" style={{ textAlign: 'center' }}>
              <img src="/enigma-logo.svg" alt="Enigma" style={{ height: '52px', width: 'auto', filter: 'brightness(1.1)', margin: '0 auto' }} />
            </div>
            <h2 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.4rem', letterSpacing: '-0.015em' }}>Welcome back</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: '2rem', fontSize: '0.9rem' }}>Sign in to your Enigma account</p>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: focused === 'email' ? '#4881F8' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }} />
                  <input
                    id="login-email"
                    type="email" name="email" value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                    placeholder="you@example.com"
                    style={inputStyle('email')}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p style={{ color: 'rgba(248,113,113,0.9)', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.email}</p>}
              </div>

              {/* Password */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: focused === 'password' ? '#4881F8' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }} />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                    placeholder="Enter your password"
                    style={{ ...inputStyle('password'), paddingRight: '2.8rem' }}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && <p style={{ color: 'rgba(248,113,113,0.9)', fontSize: '0.8rem', marginTop: '0.35rem' }}>{errors.password}</p>}
              </div>

              {/* Remember + Forgot */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: '#4881F8', width: '15px', height: '15px' }} />
                  Remember me
                </label>
                <Link to="/forgot-password" style={{ color: '#4881F8', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none' }}>Forgot password?</Link>
              </div>

              <button type="submit" className="signin-btn" id="login-submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.35)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Signing in...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    Sign In <ArrowRight size={18} />
                  </span>
                )}
              </button>

              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </form>

            <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.9rem', color: 'rgba(255,255,255,0.45)' }}>
              Don't have an account?{' '}
              <Link to="/role-selection" style={{ color: '#4881F8', fontWeight: 600, textDecoration: 'none' }}>Create account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
