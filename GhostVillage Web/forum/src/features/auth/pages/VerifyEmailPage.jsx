import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Spinner, Button } from 'react-bootstrap';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Mail } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../api/axios';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [verificationStatus, setVerificationStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email') || localStorage.getItem('pendingVerificationEmail');

  useEffect(() => {
    if (!token) {
      setVerificationStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    try {
      setVerificationStatus('loading');
      
      const response = await api.post('/auth/verify-email', {
        token: verificationToken
      });

      if (response.data.success) {
        setVerificationStatus('success');
        setMessage('Email verified successfully! You can now access all features.');
        
        // Clear pending email from localStorage
        localStorage.removeItem('pendingVerificationEmail');
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage(
        error.response?.data?.message || 
        'Email verification failed. The link may be expired or invalid.'
      );
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setMessage('Email address not found. Please try registering again.');
      return;
    }

    try {
      setResendLoading(true);
      
      const response = await api.post('/auth/resend-verification', {
        email: email
      });

      if (response.data.success) {
        setMessage('New verification email sent! Please check your inbox.');
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

  const renderContent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <div className="text-center">
            <Spinner animation="border" role="status" className="mb-3">
              <span className="visually-hidden">Verifying...</span>
            </Spinner>
            <h3>Verifying your email...</h3>
            <p className="text-muted">Please wait while we verify your email address.</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle size={64} className="text-success mb-3" />
            <h3 className="text-success">Email Verified Successfully!</h3>
            <p className="mb-4">{message}</p>
            <p className="text-muted">Redirecting to login page in 3 seconds...</p>
            <Button as={Link} to="/login" variant="primary" size="lg">
              Continue to Login
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <XCircle size={64} className="text-danger mb-3" />
            <h3 className="text-danger">Verification Failed</h3>
            <Alert variant="danger" className="mb-4">
              {message}
            </Alert>
            
            {email && (
              <div className="mb-4">
                <p>Didn't receive the verification email or link expired?</p>
                <Button
                  variant="outline-primary"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="me-3"
                >
                  {resendLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={16} className="me-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              </div>
            )}
            
            <div className="mt-4">
              <Button as={Link} to="/register" variant="outline-secondary" className="me-2">
                Register Again
              </Button>
              <Button as={Link} to="/login" variant="primary">
                Back to Login
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h1 className="h3">Email Verification</h1>
              </div>
              
              {renderContent()}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default VerifyEmailPage;