import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/hooks/useAuth';
import LangmaText from '../../../shared/assets/images/logo.png';
import FogEffect from '../components/FogEffect';
import './LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

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

    const result = await login(formData);
    
    if (result?.success) {
      navigate('/');
    } else {
      setError(result?.message || 'Login failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-page">
      {/* Left side - Form */}
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <h2>Sign In</h2>
          <p className="form-subtitle">Login into your account</p>
          
          {error && <div className="alert-message alert-danger">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email or Username</label>
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                required
                placeholder="Enter your email or username"
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

            <div className="forgot-password">
              <Link to="/forgot-password">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="btn-signin" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="form-divider">
            <span>Or</span>
          </div>

          <div className="signup-link">
            <p>
              Don't have an account?{' '}
              <Link to="/register">
                Sign up now
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
