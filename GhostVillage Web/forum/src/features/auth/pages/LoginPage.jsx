import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/hooks/useAuth';
import LangmaText from '../../../shared/assets/images/logo.png';
import FogEffect from '../components/FogEffect';
import './Auth.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // Load saved credentials on mount
  useEffect(() => {
    const rememberMeExpiry = localStorage.getItem('rememberMeExpiry');
    if (rememberMeExpiry) {
      const expiryDate = new Date(rememberMeExpiry);
      const now = new Date();
      
      if (now < expiryDate) {
        // Still within 30 days, user should be auto-logged in by AuthContext
        setRememberMe(true);
      } else {
        // Expired, clear it
        localStorage.removeItem('rememberMeExpiry');
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData, rememberMe);
    
    if (result?.success) {
      navigate('/');
    } else {
      let errorMessage = result?.message || 'Login failed';
      
      // Handle unverified account specifically
      if (errorMessage === 'ACCOUNT_NOT_VERIFIED') {
        localStorage.setItem('pendingVerificationEmail', formData.email);
        errorMessage = (
          <span>
            Your account is not verified. 
            <Link to="/registration-success" style={{ color: '#fff', marginLeft: '5px', textDecoration: 'underline' }}>
              Resend verification email?
            </Link>
          </span>
        );
      }
      
      setError(errorMessage);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-page">
      {/* Left side - Form */}
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <h2>Login</h2>
          <p className="form-subtitle">Login into your account</p>
          
          {error && <div className="alert-message alert-danger">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
            </div>

            <div className="remember-forgot">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="btn-signin" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="form-divider">
            <span>Or</span>
          </div>

          <div className="signup-link">
            <p>
              Don't have an account?{' '}
              <Link to="/register">
                Register now
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Fog Physics */}
      <div className="login-image-section">
        <FogEffect />
        
        <img src={LangmaText} alt="Langma" className="langma-image" />
      </div>
    </div>
  );
};

export default LoginPage;
