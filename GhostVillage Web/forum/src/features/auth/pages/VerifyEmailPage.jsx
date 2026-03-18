import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/hooks/useAuth';
import { authService } from '../services/authService';
import LangmaText from '../../../shared/assets/images/logo.png';
import FogEffect from '../components/FogEffect';
import './Auth.css';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const verifyOnceRef = useRef(false);
  
  const [verificationStatus, setVerificationStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const token = searchParams.get('token');
  const email = searchParams.get('email') || localStorage.getItem('pendingVerificationEmail');

  useEffect(() => {
    if (!token) {
      setVerificationStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    // Guard against double effect execution (React StrictMode) causing duplicate API calls
    if (verifyOnceRef.current) return;
    verifyOnceRef.current = true;
    verifyEmail(token);
  }, [token]);

  // Countdown and auto-redirect on success
  useEffect(() => {
    if (verificationStatus === 'success') {
      // Auto-redirect to home after 2 seconds
      const timer = setTimeout(() => {
        navigate('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [verificationStatus, navigate]);

  const verifyEmail = async (verificationToken) => {
    try {
      setVerificationStatus('loading');

      const result = await authService.verify(verificationToken);

      if (result.success) {
        const { token: accessToken, user } = result;
        if (accessToken && user) {
          const sessionSet = setSession(accessToken, user);
          if (!sessionSet) {
            setVerificationStatus('error');
            setMessage('Session setup failed. Please try again.');
            return;
          }
        }

        setVerificationStatus('success');
        setMessage('Email verified successfully! You are now logged in.');

        localStorage.removeItem('pendingVerificationEmail');
      } else {
        setVerificationStatus('error');
        setMessage(result.message || 'Email verification failed. The link may be expired or invalid.');
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage('Email verification failed. The link may be expired or invalid.');
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <div className="verify-content">
            <div className="spinner-wrapper">
              <div className="spinner"></div>
            </div>
            <h3>Verifying your email...</h3>
            <p className="text-muted">Please wait while we verify your email address.</p>
          </div>
        );

      case 'success':
        return (
          <div className="verify-content success">
            <div className="success-icon">✓</div>
            <h3>Email Verified Successfully!</h3>
            <p className="success-message">{message}</p>
            
            <div className="redirect-loading">
              <div className="spinner"></div>
              <p>Redirecting to home page...</p>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="verify-content error">
            <div className="error-icon">✕</div>
            <h3>Verification Failed</h3>
            <div className="alert-message alert-danger">{message}</div>
            
            <div className="action-links">
              <Link to="/register" className="btn-signin">Register Again</Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="login-page">
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <h2>Email Verification</h2>
          <p className="form-subtitle">Verify your email address</p>
          
          {renderContent()}
        </div>
      </div>

      <div className="login-image-section">
        <FogEffect />
        <img src={LangmaText} alt="Langma" className="langma-image" />
      </div>
    </div>
  );
};

export default VerifyEmailPage;