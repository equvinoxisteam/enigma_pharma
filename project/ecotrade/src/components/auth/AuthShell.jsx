import React, { useEffect, useState } from 'react';

const BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  .auth-page { min-height: 100vh; font-family: 'Inter', sans-serif; background: #f4f7fb; color: #01364a; position: relative; overflow: hidden; }
  .auth-page::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 80% 50% at 10% -10%, rgba(72,129,248,0.18), transparent 55%),
      radial-gradient(ellipse 60% 40% at 90% 110%, rgba(1,54,74,0.12), transparent 50%);
  }
  .auth-inner { position: relative; z-index: 1; }
  .auth-card {
    background: #fff; border: 1px solid rgba(1,54,74,0.08); border-radius: 20px;
    box-shadow: 0 24px 64px rgba(1,54,74,0.08);
  }
  .auth-input {
    width: 100%; padding: 0.875rem 1rem; box-sizing: border-box;
    border: 1px solid rgba(1,54,74,0.14); border-radius: 12px;
    font-size: 0.95rem; color: #01364a; background: #fafbfd; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .auth-input:focus { border-color: #4881F8; box-shadow: 0 0 0 3px rgba(72,129,248,0.15); background: #fff; }
  .auth-input::placeholder { color: rgba(1,54,74,0.35); }
  .auth-input.error { border-color: #f87171; }
  .auth-label { display: block; font-size: 0.875rem; font-weight: 600; color: #01364a; margin-bottom: 0.45rem; }
  .auth-btn {
    width: 100%; padding: 0.9rem 1rem; border: none; border-radius: 12px;
    background: linear-gradient(135deg, #4881F8, #01364a); color: #fff;
    font-size: 0.95rem; font-weight: 700; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
  }
  .auth-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
  .auth-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .auth-link { color: #4881F8; font-weight: 600; text-decoration: none; }
  .auth-link:hover { text-decoration: underline; }
  .auth-muted { color: rgba(1,54,74,0.55); font-size: 0.9rem; }
  .auth-error { color: #dc2626; font-size: 0.8rem; margin-top: 0.35rem; }
  .fade-in { opacity: 0; transform: translateY(16px); transition: opacity 0.5s ease, transform 0.5s cubic-bezier(.22,1,.36,1); }
  .fade-in.show { opacity: 1; transform: translateY(0); }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export const AuthInput = ({ label, error, id, className = '', ...props }) => (
  <div className={className}>
    {label && <label htmlFor={id} className="auth-label">{label}</label>}
    <input id={id} className={`auth-input ${error ? 'error' : ''}`} {...props} />
    {error && <p className="auth-error">{error}</p>}
  </div>
);

export const AuthButton = ({ children, loading, loadingText = 'Please wait...', type = 'button', ...props }) => (
  <button type={type} className="auth-btn" disabled={loading || props.disabled} {...props}>
    {loading ? (
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        {loadingText}
      </span>
    ) : children}
  </button>
);

const AuthShell = ({ children, maxWidth = 440, className = '' }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="auth-page flex items-center justify-center px-4 py-10 sm:py-14">
      <style>{BASE_STYLES}</style>
      <div className={`auth-inner fade-in ${visible ? 'show' : ''} w-full ${className}`} style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
};

export default AuthShell;
