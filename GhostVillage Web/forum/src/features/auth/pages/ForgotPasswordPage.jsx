import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/context/AuthContext';
import LangmaText from '../../../shared/assets/images/logo.png';
import FogEffect from '../components/FogEffect';
import './Auth.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { forgotPassword } = useAuth();

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await forgotPassword(email);
    
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.message || 'Failed to send reset link');
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="login-page">
        <div className="login-form-section">
          <div className="login-form-wrapper">
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <i className="bi bi-check-circle-fill" style={{ fontSize: '60px', color: '#4CAF50' }}></i>
            </div>
            <h2 style={{ textAlign: 'center', marginBottom: '12px' }}>Check Your Email</h2>
            <p className="form-subtitle" style={{ textAlign: 'center' }}>
              If an account with that email exists, we've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="form-subtitle" style={{ textAlign: 'center', marginBottom: '24px' }}>
              The link will expire in 15 minutes for security reasons.
            </p>
            <Link to="/login" className="btn-signin" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', width: '100%' }}>
              Back to Login
            </Link>
          </div>
        </div>
        <div className="login-image-section">
          <FogEffect />
          <img src={LangmaText} alt="Langma" className="langma-image" />
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <h2>Reset Password</h2>
          <p className="form-subtitle">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          {error && <div className="alert-message alert-danger">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={handleChange}
                required
                placeholder="Enter your email address"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-signin"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="signup-link">
            <p>
              Remember your password?{' '}
              <Link to="/login">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="login-image-section">
        <FogEffect />
        <img src={LangmaText} alt="Langma" className="langma-image" />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
