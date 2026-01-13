import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../app/hooks/useAuth';
import FogEffect from '../components/FogEffect';
import api from '../../../shared/services/axios';
import './Auth.css';

const RegistrationSuccessPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState('');
  const email = localStorage.getItem('pendingVerificationEmail');

  // Auto-redirect if email is already verified (no pending email in localStorage)
  useEffect(() => {
    if (!email) {
      // No pending email = already verified, redirect to home
      navigate('/');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendVerification = async () => {
    if (!email) {
      setMessage('Email address not found. Please try registering again.');
      return;
    }

    try {
      setResendLoading(true);
      setMessage('');

      const response = await api.post('/auth/resend-verification', {
        email: email
      });

      if (response.data.success) {
        setMessage('New verification link sent! Please check your inbox.');
        setCountdown(60);
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Failed to resend verification email. Please try again later.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-form-section">
        <div className="login-form-wrapper" style={{ textAlign: 'center' }}>
          <h2>Registration Successful!</h2>
          <p className="form-subtitle" style={{ marginBottom: '20px' }}>
            We have sent a verification link to your email.
          </p>
          <p>Please check your inbox (and spam folder) to activate your account.</p>

          {message && (
            <div
              className={`alert-message ${message.includes('thành công') ? 'alert-success' : 'alert-danger'}`}
              style={{ marginTop: '15px' }}
            >
              {message}
            </div>
          )}

          {countdown === 0 ? (
            <button
              className="btn-signin"
              onClick={handleResendVerification}
              disabled={resendLoading}
              style={{ marginTop: '20px' }}
            >
              {resendLoading ? 'Sending...' : 'Request New Verification Link'}
            </button>
          ) : (
            <p style={{ marginTop: '15px', color: '#666' }}>
              Request new link in {countdown} seconds
            </p>
          )}
        </div>
      </div>
      <div className="login-image-section">
        <FogEffect />
      </div>
    </div>
  );
};

export default RegistrationSuccessPage;
