import React, { useState } from 'react';
import { X, Eye, EyeOff, Lock, Check, AlertCircle } from 'lucide-react';
import authService from '../../../features/auth/services/authService';
import './ChangePasswordModal.css';

const ChangePasswordModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const criteria = [
      { met: minLength, text: 'At least 8 characters' },
      { met: hasUpperCase, text: 'One uppercase letter' },
      { met: hasLowerCase, text: 'One lowercase letter' },
      { met: hasSpecialChar, text: 'One special character' },
    ];

    const score = criteria.filter((c) => c.met).length;
    return { score, criteria };
  };

  const passwordStrength = checkPasswordStrength(formData.newPassword);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const toggleShowPassword = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.currentPassword) {
      setError('Current password is required');
      setLoading(false);
      return;
    }

    if (!formData.newPassword) {
      setError('New password is required');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      setLoading(false);
      return;
    }

    if (passwordStrength.score < 4) {
      setError('Password does not meet strength requirements');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.changePassword(
        formData.currentPassword,
        formData.newPassword
      );

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setError(response.message || 'Password change failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content change-password-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <Lock size={24} />
            <h2>Change Password</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <Check size={20} />
              <span>Password changed successfully!</span>
            </div>
          )}

          {/* Current Password */}
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password *</label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter your current password"
                required
                className="form-input"
                disabled={loading || success}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => toggleShowPassword('current')}
                tabIndex={-1}
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="form-group">
            <label htmlFor="newPassword">New Password *</label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter your new password"
                required
                className="form-input"
                disabled={loading || success}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => toggleShowPassword('new')}
                tabIndex={-1}
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {formData.newPassword && (
            <div className="password-strength">
              <div className="strength-bar">
                <div
                  className={`strength-fill strength-${passwordStrength.score}`}
                  style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                />
              </div>
              <div className="strength-criteria">
                {passwordStrength.criteria.map((criterion, index) => (
                  <div
                    key={index}
                    className={`criterion ${criterion.met ? 'met' : ''}`}
                  >
                    {criterion.met ? (
                      <Check size={14} />
                    ) : (
                      <X size={14} />
                    )}
                    <span>{criterion.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password *</label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
                required
                className="form-input"
                disabled={loading || success}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => toggleShowPassword('confirm')}
                tabIndex={-1}
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={loading || success}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading || success}
            >
              {loading ? 'Changing...' : success ? 'Success!' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
