import { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/hooks/useAuth';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const { confirmPassword, ...registrationData } = formData;
    const result = await register(registrationData);
    
    if (result.success) {
      localStorage.setItem('pendingVerificationEmail', formData.email);
      setMessage('Registration successful! Please check your email to verify your account.');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      background: 'var(--bg-primary)',
      minHeight: '100vh',
      display: 'flex'
    }}>
      {/* Left side - Form (20%) */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: 'var(--card-bg)',
        minWidth: 0
      }}>
        <div style={{ width: '100%', maxWidth: '350px' }}>
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>
              Create Account
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Join GhostVillage today
            </p>
          </div>
          
          {error && (
            <Alert variant="danger" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}
          
          {message && (
            <Alert variant="success" onClose={() => setMessage('')} dismissible>
              {message}
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                isInvalid={!!errors.username}
                placeholder="Choose a username"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: `1px solid var(--card-border)`,
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  padding: '12px'
                }}
              />
              {errors.username && <Form.Text className="text-danger">{errors.username}</Form.Text>}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Email Address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
                placeholder="Enter your email"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: `1px solid var(--card-border)`,
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  padding: '12px'
                }}
              />
              {errors.email && <Form.Text className="text-danger">{errors.email}</Form.Text>}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                isInvalid={!!errors.password}
                placeholder="Create a password"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: `1px solid var(--card-border)`,
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  padding: '12px'
                }}
              />
              {errors.password && <Form.Text className="text-danger">{errors.password}</Form.Text>}
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                isInvalid={!!errors.confirmPassword}
                placeholder="Confirm your password"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: `1px solid var(--card-border)`,
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  padding: '12px'
                }}
              />
              {errors.confirmPassword && <Form.Text className="text-danger">{errors.confirmPassword}</Form.Text>}
            </Form.Group>

            <Button 
              type="submit" 
              disabled={loading}
              style={{
                background: 'var(--primary-color)',
                border: 'none',
                color: 'var(--text-primary)',
                fontWeight: '600',
                padding: '12px 20px',
                borderRadius: '6px',
                width: '100%',
                marginBottom: '15px'
              }}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: 0 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--secondary-color)', fontWeight: '600' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Illustration (80%) */}
      <div style={{
        flex: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'url(/src/shared/assets/images/langma.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        minWidth: 0,
        position: 'relative'
      }}>
        {/* Dark overlay for better text readability */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)'
        }} />
        
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            fontSize: '100px',
            marginBottom: '20px'
          }}>
            👥
          </div>
          <h3 style={{ color: '#fff', marginBottom: '10px', fontSize: '24px', fontWeight: '600' }}>
            Join Us
          </h3>
          <p style={{ color: '#ddd', lineHeight: '1.6' }}>
            Create your account and become part of our vibrant community
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
