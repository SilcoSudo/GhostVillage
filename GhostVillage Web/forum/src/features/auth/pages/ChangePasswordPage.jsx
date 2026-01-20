import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../app/context/AuthContext';
import { ArrowLeft, Eye, EyeOff, Lock, Shield, Check, X } from 'lucide-react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import api from '../../../shared/services/axios';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const criteria = [
      { met: minLength, text: t('changePassword.validation.minLength') },
      { met: hasUpperCase, text: t('changePassword.validation.uppercase') },
      { met: hasLowerCase, text: t('changePassword.validation.lowercase') },
      { met: hasNumbers, text: t('changePassword.validation.numbers') },
      { met: hasSpecialChar, text: t('changePassword.validation.specialChar') }
    ];

    const score = criteria.filter(c => c.met).length;
    
    return {
      score,
      criteria,
      isStrong: score >= 4
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'newPassword') {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
    }

    // Clear message when user types
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const toggleShowPassword = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      setMessage({ type: 'error', text: t('changePassword.validation.currentRequired') });
      return false;
    }

    if (!formData.newPassword) {
      setMessage({ type: 'error', text: t('changePassword.validation.newRequired') });
      return false;
    }

    if (formData.newPassword.length < 8) {
      setMessage({ type: 'error', text: t('changePassword.validation.minLength') });
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: t('changePassword.validation.passwordsMatch') });
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      setMessage({ type: 'error', text: t('changePassword.validation.differentPassword') });
      return false;
    }

    if (!passwordStrength.isStrong) {
      setMessage({ type: 'error', text: t('changePassword.validation.weakPassword') });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const response = await api.post('/web/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: t('changePassword.messages.success') 
        });

        // Clear form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        // Redirect after success
        setTimeout(() => {
          navigate('/account/settings');
        }, 2000);
      }

    } catch (error) {
      console.error('Change password error:', error);
      const errorMessage = error.response?.data?.message || t('changePassword.messages.failed');
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = (score) => {
    if (score <= 1) return 'danger';
    if (score <= 2) return 'warning';
    if (score <= 3) return 'info';
    return 'success';
  };

  const getPasswordStrengthText = (score) => {
    if (score <= 1) return t('changePassword.strength.weak');
    if (score <= 2) return t('changePassword.strength.fair');
    if (score <= 3) return t('changePassword.strength.good');
    return t('changePassword.strength.strong');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <div className="d-flex align-items-center gap-2">
                <Button 
                  variant="link" 
                  className="text-white p-0"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft size={20} />
                </Button>
                <Shield size={24} />
                <h5 className="mb-0">{t('changePassword.title')}</h5>
              </div>
            </Card.Header>

            <Card.Body className="p-4">
              {message.text && (
                <Alert variant={message.type} className="mb-4">
                  {message.text}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Current Password */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">
                    <Lock size={16} className="me-2" />
                    {t('changePassword.currentPassword')}
                  </Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showPasswords.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      placeholder={t('changePassword.currentPasswordPlaceholder')}
                      required
                    />
                    <Button
                      variant="link"
                      className="position-absolute end-0 top-50 translate-middle-y"
                      onClick={() => toggleShowPassword('current')}
                      style={{ zIndex: 10 }}
                    >
                      {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </Form.Group>

                {/* New Password */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">
                    <Lock size={16} className="me-2" />
                    {t('changePassword.newPassword')}
                  </Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showPasswords.new ? 'text' : 'password'}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder={t('changePassword.newPasswordPlaceholder')}
                      required
                    />
                    <Button
                      variant="link"
                      className="position-absolute end-0 top-50 translate-middle-y"
                      onClick={() => toggleShowPassword('new')}
                      style={{ zIndex: 10 }}
                    >
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.newPassword && (
                    <div className="mt-2">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <small className="fw-bold">
                          {t('changePassword.strength.label')}:
                        </small>
                        <span className={`badge bg-${getPasswordStrengthColor(passwordStrength.score)}`}>
                          {getPasswordStrengthText(passwordStrength.score)}
                        </span>
                      </div>
                      
                      <div className="progress mb-2" style={{ height: '4px' }}>
                        <div 
                          className={`progress-bar bg-${getPasswordStrengthColor(passwordStrength.score)}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>

                      <div className="small">
                        {passwordStrength.criteria?.map((criterion, index) => (
                          <div key={index} className={`d-flex align-items-center gap-1 ${criterion.met ? 'text-success' : 'text-muted'}`}>
                            {criterion.met ? <Check size={12} /> : <X size={12} />}
                            {criterion.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Form.Group>

                {/* Confirm Password */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">
                    <Lock size={16} className="me-2" />
                    {t('changePassword.confirmPassword')}
                  </Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder={t('changePassword.confirmPasswordPlaceholder')}
                      required
                    />
                    <Button
                      variant="link"
                      className="position-absolute end-0 top-50 translate-middle-y"
                      onClick={() => toggleShowPassword('confirm')}
                      style={{ zIndex: 10 }}
                    >
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                  
                  {formData.confirmPassword && formData.newPassword && (
                    <small className={`d-flex align-items-center gap-1 mt-1 ${
                      formData.newPassword === formData.confirmPassword ? 'text-success' : 'text-danger'
                    }`}>
                      {formData.newPassword === formData.confirmPassword ? (
                        <>
                          <Check size={12} />
                          {t('changePassword.validation.passwordsMatchSuccess')}
                        </>
                      ) : (
                        <>
                          <X size={12} />
                          {t('changePassword.validation.passwordsMatch')}
                        </>
                      )}
                    </small>
                  )}
                </Form.Group>

                {/* Security Info */}
                <Alert variant="info" className="mb-4">
                  <Shield size={16} className="me-2" />
                  <small>
                    {t('changePassword.securityInfo')}
                  </small>
                </Alert>

                {/* Submit Button */}
                <div className="d-grid">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg"
                    disabled={loading || !passwordStrength.isStrong || formData.newPassword !== formData.confirmPassword}
                  >
                    {loading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" />
                        {t('changePassword.buttons.changing')}
                      </>
                    ) : (
                      <>
                        <Shield size={16} className="me-2" />
                        {t('changePassword.buttons.change')}
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ChangePasswordPage;