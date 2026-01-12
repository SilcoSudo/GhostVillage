import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/hooks/useAuth';
import LangmaText from '../../../shared/assets/images/logo.png';
import FogEffect from '../components/FogEffect';
import './LoginPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    dateOfBirth: null,
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
      setErrors({ ...errors, [e.target.name]: '' });
    }
    if (error) setError('');
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, dateOfBirth: date });
    if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: '' });
    if (error) setError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required.';
    else if (formData.fullName.length < 3) newErrors.fullName = 'Full name must be at least 3 characters.';
    if (!formData.email.trim()) newErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email address.';

    // Password strength: match backend rule (min 8 chars, uppercase, lowercase, special)
    const pwd = formData.password || '';
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwd) newErrors.password = 'Password is required.';
    else if (!pwdRegex.test(pwd)) newErrors.password = 'Password must be at least 8 characters and include uppercase, lowercase, and a special character.';

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password.';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    // date of birth validation: required, valid date, not in future, age >= 13
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required.';
    } else {
      const dob = formData.dateOfBirth instanceof Date ? formData.dateOfBirth : new Date(formData.dateOfBirth);
      const now = new Date();
      if (isNaN(dob.getTime()) || dob > now) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth.';
      } else {
        // calculate age in years reliably
        let age = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
          age--;
        }
        if (age < 13) newErrors.dateOfBirth = 'You must be at least 13 years old.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    // convert dateOfBirth to ISO date string (yyyy-mm-dd) before sending
    const payload = {
      ...formData,
      dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.toISOString().split('T')[0] : ''
    };
    const result = await register(payload);
    if (result?.success) {
      localStorage.setItem('pendingVerificationEmail', formData.email);
      navigate('/registration-success');
    } else {
      setError(result?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <h2>Create Account</h2>
          <p className="form-subtitle">Join GhostVillage today</p>

          {error && <div className="alert-message alert-danger">{error}</div>}
          {message && <div className="alert-message alert-success">{message}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
              {errors.fullName && <div className="text-danger">{errors.fullName}</div>}
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
              {errors.email && <div className="text-danger">{errors.email}</div>}
            </div>

            <div className="form-group date-input-wrapper">
              <label>Date of Birth</label>
              <DatePicker
                selected={formData.dateOfBirth}
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select your date of birth"
                maxDate={new Date()}
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
              />
              {errors.dateOfBirth && <div className="text-danger">{errors.dateOfBirth}</div>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
              />
              {errors.password && <div className="text-danger">{errors.password}</div>}
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <div className="text-danger">{errors.confirmPassword}</div>}
            </div>

            <button type="submit" className="btn-signin" disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <div className="form-divider"><span>Or</span></div>

          <div className="signup-link">
            <p>
              Already have an account?{' '}
              <Link to="/login">Login</Link>
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

export default RegisterPage;
