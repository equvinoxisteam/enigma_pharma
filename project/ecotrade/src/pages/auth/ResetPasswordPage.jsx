import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword, clearError, clearSuccessMessage } from '../../store/slices/authSlice';
import AuthShell, { AuthInput, AuthButton } from '../../components/auth/AuthShell';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const { isLoading, error, successMessage } = useSelector((state) => state.auth);
  const token = new URLSearchParams(location.search).get('token');

  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ new: false, confirm: false });
  const [resetComplete, setResetComplete] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearSuccessMessage());
  }, [dispatch]);

  useEffect(() => { if (successMessage) { showSuccess(successMessage); dispatch(clearSuccessMessage()); } }, [successMessage, showSuccess, dispatch]);
  useEffect(() => { if (error) { showError(error); dispatch(clearError()); } }, [error, showError, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) setValidationErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.newPassword) errs.newPassword = 'Password is required';
    else if (formData.newPassword.length < 6) errs.newPassword = 'At least 6 characters';
    if (!formData.confirmPassword) errs.confirmPassword = 'Confirm your password';
    else if (formData.newPassword !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || !token) return;
    dispatch(clearError());
    dispatch(clearSuccessMessage());
    const result = await dispatch(resetPassword({ token, newPassword: formData.newPassword, confirmPassword: formData.confirmPassword }));
    if (resetPassword.fulfilled.match(result)) {
      setResetComplete(true);
      setTimeout(() => navigate('/login'), 2500);
    }
  };

  if (!token) {
    return (
      <AuthShell maxWidth={460}>
        <div className="auth-card p-8 text-center">
          <h1 className="text-2xl font-extrabold text-[#01364a] mb-3">Invalid reset link</h1>
          <p className="auth-muted mb-6">This link is invalid or has expired. Request a new one.</p>
          <Link to="/forgot-password" className="auth-link font-bold">Request new link</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell maxWidth={460}>
      <div className="auth-card p-6 sm:p-8">
        <div className="text-center mb-8">
          <img src="/enigma-logo.svg" alt="Enigma" className="h-11 mx-auto mb-6" />
          <h1 className="text-2xl font-extrabold text-[#01364a] mb-1">
            {resetComplete ? 'Password updated' : 'Choose a new password'}
          </h1>
          <p className="auth-muted">
            {resetComplete ? 'Redirecting you to sign in...' : 'Use at least 6 characters with letters and numbers.'}
          </p>
        </div>

        {resetComplete ? (
          <Link to="/login" className="auth-btn inline-block text-center no-underline">Go to sign in</Link>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <AuthInput
                id="new-password"
                label="New password"
                type={show.new ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="New password"
                error={validationErrors.newPassword}
              />
              <button type="button" onClick={() => setShow((s) => ({ ...s, new: !s.new }))} className="mt-2 text-xs font-semibold text-[#4881F8] bg-transparent border-none cursor-pointer">
                {show.new ? 'Hide' : 'Show'}
              </button>
            </div>

            <div>
              <AuthInput
                id="confirm-password"
                label="Confirm password"
                type={show.confirm ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                error={validationErrors.confirmPassword}
              />
              <button type="button" onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))} className="mt-2 text-xs font-semibold text-[#4881F8] bg-transparent border-none cursor-pointer">
                {show.confirm ? 'Hide' : 'Show'}
              </button>
            </div>

            <AuthButton type="submit" loading={isLoading} loadingText="Updating...">
              Update password
            </AuthButton>
          </form>
        )}

        {!resetComplete && (
          <p className="text-center mt-6">
            <Link to="/login" className="auth-link text-sm">Back to sign in</Link>
          </p>
        )}
      </div>
    </AuthShell>
  );
};

export default ResetPasswordPage;
