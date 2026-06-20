import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import AuthShell, { AuthInput, AuthButton } from '../../components/auth/AuthShell';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (localStorage.getItem('token') && localStorage.getItem('user')) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Enter a valid email';
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
        showSuccess('Welcome back');
        navigate(result.user?.isAdmin ? '/admin' : '/dashboard');
      } else {
        showError(result.error || 'Login failed');
      }
    } catch {
      showError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell maxWidth={480}>
      <div className="auth-card p-6 sm:p-8">
        <div className="text-center mb-8">
          <img src="/enigma-logo.svg" alt="Enigma" className="h-11 mx-auto mb-6" />
          <h1 className="text-2xl font-extrabold text-[#01364a] mb-1">Welcome back</h1>
          <p className="auth-muted">Sign in to your Enigma account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthInput
            id="login-email"
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@company.com"
            autoComplete="email"
            error={errors.email}
          />

          <div>
            <AuthInput
              id="login-password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Your password"
              autoComplete="current-password"
              error={errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="mt-2 text-xs font-semibold text-[#4881F8] bg-transparent border-none cursor-pointer"
            >
              {showPassword ? 'Hide password' : 'Show password'}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <label className="flex items-center gap-2 cursor-pointer auth-muted">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="accent-[#4881F8]" />
              Remember me
            </label>
            <Link to="/forgot-password" className="auth-link text-sm">Forgot password?</Link>
          </div>

          <AuthButton type="submit" loading={isLoading} loadingText="Signing in...">
            Sign in
          </AuthButton>
        </form>

        <p className="text-center auth-muted mt-6">
          New to Enigma?{' '}
          <Link to="/role-selection" className="auth-link">Create account</Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default LoginPage;
