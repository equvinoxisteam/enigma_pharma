import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from '../../contexts/ToastContext';
import { forgotPassword, clearError, clearSuccessMessage } from '../../store/slices/authSlice';
import AuthShell, { AuthInput, AuthButton } from '../../components/auth/AuthShell';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error, successMessage } = useSelector((state) => state.auth);
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearSuccessMessage());
  }, [dispatch]);

  useEffect(() => {
    if (error) { showError(error); dispatch(clearError()); }
    if (successMessage) { showSuccess(successMessage); dispatch(clearSuccessMessage()); }
  }, [error, successMessage, showError, showSuccess, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { showError('Enter your email address'); return; }
    dispatch(clearError());
    dispatch(clearSuccessMessage());
    const result = await dispatch(forgotPassword(email));
    if (forgotPassword.fulfilled.match(result)) setEmailSent(true);
  };

  const handleResend = async () => {
    dispatch(clearError());
    dispatch(clearSuccessMessage());
    await dispatch(forgotPassword(email));
  };

  return (
    <AuthShell maxWidth={460}>
      <div className="auth-card p-6 sm:p-8">
        <div className="text-center mb-8">
          <img src="/enigma-logo.svg" alt="Enigma" className="h-11 mx-auto mb-6" />
          <h1 className="text-2xl font-extrabold text-[#01364a] mb-1">
            {emailSent ? 'Check your email' : 'Reset password'}
          </h1>
          <p className="auth-muted">
            {emailSent
              ? `We sent a reset link to ${email}`
              : 'Enter your email and we will send a secure reset link.'}
          </p>
        </div>

        {!emailSent ? (
          <form onSubmit={handleSubmit}>
            <AuthInput
              id="forgot-email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="mb-6"
            />
            <AuthButton type="submit" loading={isLoading} loadingText="Sending...">
              Send reset link
            </AuthButton>
          </form>
        ) : (
          <div className="space-y-3">
            <AuthButton type="button" onClick={handleResend} loading={isLoading} loadingText="Resending...">
              Resend email
            </AuthButton>
            <button
              type="button"
              onClick={() => { setEmailSent(false); setEmail(''); }}
              className="w-full py-3 rounded-xl border border-[#01364a]/15 text-sm font-semibold text-[#01364a]/70 bg-transparent cursor-pointer"
            >
              Use a different email
            </button>
          </div>
        )}

        <p className="text-center mt-6">
          <button type="button" onClick={() => navigate('/login')} className="auth-link bg-transparent border-none cursor-pointer text-sm">
            Back to sign in
          </button>
        </p>
      </div>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
