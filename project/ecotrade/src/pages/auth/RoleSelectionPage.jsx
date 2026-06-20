import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthShell from '../../components/auth/AuthShell';

const roles = [
  {
    id: 'BUYER',
    title: 'Buyer',
    subtitle: 'Procurement professional',
    description: 'Publish RFQs, discover manufacturers, and manage procurement with AI matching.',
    accent: '#4881F8',
  },
  {
    id: 'MANUFACTURER',
    title: 'Manufacturer',
    subtitle: 'Production expert',
    description: 'Browse the RFQ pool, send bids on paid plans, and grow your order book.',
    accent: '#6366f1',
  },
  {
    id: 'HYBRID',
    title: 'Hybrid',
    subtitle: 'Buy and manufacture',
    description: 'Create RFQs as a buyer and respond to opportunities as a manufacturer.',
    accent: '#01364a',
  },
];

const RoleSelectionPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (isAuthenticated || (token && user)) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSelect = (roleId) => {
    setSelected(roleId);
    setTimeout(() => navigate(`/register?role=${roleId}`), 280);
  };

  return (
    <AuthShell maxWidth={960} className="!max-w-[960px]">
      <div className="text-center mb-10">
        <img src="/enigma-logo.svg" alt="Enigma" className="h-12 mx-auto mb-8" />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#01364a] tracking-tight mb-3">
          Join Enigma
        </h1>
        <p className="auth-muted max-w-lg mx-auto">
          Select how you will use the platform. You can upgrade manufacturer plans anytime after signup.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => handleSelect(role.id)}
            className={`auth-card text-left p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
              selected === role.id ? 'ring-2 ring-[#4881F8] scale-[0.98]' : ''
            }`}
          >
            <div className="h-1 w-12 rounded-full mb-5" style={{ background: role.accent }} />
            <p className="text-xs font-bold uppercase tracking-widest text-[#4881F8] mb-1">{role.subtitle}</p>
            <h3 className="text-xl font-extrabold text-[#01364a] mb-2">{role.title}</h3>
            <p className="text-sm text-[#01364a]/65 leading-relaxed mb-6">{role.description}</p>
            <span className="text-sm font-bold text-[#4881F8]">Continue →</span>
          </button>
        ))}
      </div>

      <p className="text-center auth-muted">
        Already have an account?{' '}
        <button type="button" onClick={() => navigate('/login')} className="auth-link bg-transparent border-none cursor-pointer text-base">
          Sign in
        </button>
      </p>
    </AuthShell>
  );
};

export default RoleSelectionPage;
