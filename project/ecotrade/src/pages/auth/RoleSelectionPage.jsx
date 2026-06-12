import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Factory, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/* ─── Animated particle background ─── */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const count = 60;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.15,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(72, 129, 248, ${p.alpha})`;
        ctx.fill();
      });
      // draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(72, 129, 248, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

const roles = [
  {
    id: 'BUYER',
    title: 'Buyer',
    subtitle: 'Procurement Professional',
    icon: ShoppingCart,
    description: 'AI-powered access to precision-manufactured parts. Global reach, locally optimized pricing.',
    gradient: 'from-blue-500 to-cyan-400',
    glow: 'rgba(72,129,248,0.35)',
  },
  {
    id: 'MANUFACTURER',
    title: 'Manufacturer',
    subtitle: 'Production Expert',
    icon: Factory,
    description: 'Direct AI-matched access to new projects. Connect with buyers who need your technology.',
    gradient: 'from-violet-500 to-purple-400',
    glow: 'rgba(139,92,246,0.35)',
  },
  {
    id: 'HYBRID',
    title: 'Hybrid',
    subtitle: 'Buy & Manufacture',
    icon: Star,
    description: 'AI-based dual matching. Enjoy the full benefits of both buying and manufacturing.',
    gradient: 'from-emerald-500 to-teal-400',
    glow: 'rgba(16,185,129,0.35)',
  },
];

const RoleSelectionPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [hoveredRole, setHoveredRole] = useState(null);
  const [selected, setSelected] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (isAuthenticated || (token && user)) {
      navigate('/dashboard', { replace: true });
      return;
    }
    setTimeout(() => setVisible(true), 60);
  }, [isAuthenticated, navigate]);

  const handleSelect = (roleId) => {
    setSelected(roleId);
    setTimeout(() => navigate(`/register?role=${roleId}`), 320);
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 sm:py-12" style={{ background: 'linear-gradient(135deg, #06091a 0%, #0d1433 45%, #0f172a 100%)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        .role-card {
          position: relative; cursor: pointer; border-radius: 20px; padding: 2.5rem 2rem;
          background: rgba(255,255,255,0.04); backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.08);
          transition: transform 0.35s cubic-bezier(.34,1.56,.64,1), box-shadow 0.35s ease, border-color 0.35s ease;
        }
        .role-card:hover { transform: translateY(-8px) scale(1.02); }
        .role-card.selected { transform: scale(0.96); }
        .icon-orb {
          width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.25rem; position: relative;
        }
        .icon-orb::after {
          content: ''; position: absolute; inset: -8px; border-radius: 50%;
          background: inherit; opacity: 0.2; filter: blur(12px);
          transition: opacity 0.3s;
        }
        .role-card:hover .icon-orb::after { opacity: 0.45; }
        .fade-up { opacity: 0; transform: translateY(28px); transition: opacity 0.6s ease, transform 0.6s cubic-bezier(.22,1,.36,1); }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
      `}</style>

      <ParticleCanvas />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1100px' }}>
        {/* Header */}
        <div className={`fade-up ${visible ? 'visible' : ''}`} style={{ textAlign: 'center', marginBottom: '3.5rem', transitionDelay: '0s' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <img src="/enigma-logo.svg" alt="Enigma" style={{ height: '48px', width: 'auto', filter: 'brightness(1.1)' }} />
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#fff', margin: '0 0 1rem', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Join the Future of<br />
            <span style={{ background: 'linear-gradient(90deg, #4881F8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Manufacturing Procurement
            </span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto' }}>
            Select your role to get started
          </p>
        </div>

        {/* Role Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {roles.map((role, i) => {
            const Icon = role.icon;
            const isHovered = hoveredRole === role.id;
            const isSelected = selected === role.id;
            return (
              <div
                key={role.id}
                className={`role-card fade-up ${visible ? 'visible' : ''} ${isSelected ? 'selected' : ''}`}
                style={{
                  transitionDelay: `${0.1 + i * 0.1}s`,
                  borderColor: isHovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                  boxShadow: isHovered ? `0 24px 60px ${role.glow}, 0 0 0 1px rgba(255,255,255,0.12)` : '0 4px 20px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={() => setHoveredRole(role.id)}
                onMouseLeave={() => setHoveredRole(null)}
                onClick={() => handleSelect(role.id)}
              >
                <div className="icon-orb" style={{ background: `linear-gradient(135deg, var(--from,#4881F8), var(--to,#60a5fa))` }}>
                  <div style={{ background: `linear-gradient(135deg, ${role.gradient.includes('blue') ? '#4881F8,#06b6d4' : role.gradient.includes('violet') ? '#8b5cf6,#a78bfa' : '#10b981,#14b8a6'})`, width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={30} color="#fff" />
                  </div>
                </div>

                <h3 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.25rem' }}>
                  {role.title}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 500, textAlign: 'center', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {role.subtitle}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', textAlign: 'center', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  {role.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#4881F8', fontSize: '0.9rem', fontWeight: 600, opacity: isHovered ? 1 : 0.5, transition: 'opacity 0.3s' }}>
                  <span>Get Started</span>
                  <ArrowRight size={16} style={{ transform: isHovered ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 0.3s' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Login link */}
        <div className={`fade-up ${visible ? 'visible' : ''}`} style={{ textAlign: 'center', transitionDelay: '0.45s' }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem' }}>
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              style={{ color: '#4881F8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
