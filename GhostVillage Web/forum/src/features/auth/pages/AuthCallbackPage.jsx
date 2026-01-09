import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../../app/context/AuthContext';
import { toast } from 'react-hot-toast';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      setStatus('success');
      setMessage('Successfully signed in with Google!');
      toast.success('Welcome! You have been signed in.');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } else if (error) {
      setStatus('error');
      
      switch (error) {
        case 'oauth_failed':
          setMessage('Failed to authenticate with Google. Please try again.');
          break;
        case 'access_denied':
          setMessage('Access was denied. Please grant permission to continue.');
          break;
        default:
          setMessage('An error occurred during authentication.');
      }
      
      toast.error('Authentication failed');
      
      // Redirect to login after delay
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } else {
      // No specific status, redirect based on auth state
      setTimeout(() => {
        if (user) {
          navigate('/', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      }, 1000);
    }
  }, [searchParams, navigate, user]);

  const renderIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle size={48} className="text-success mb-3" />;
      case 'error':
        return <XCircle size={48} className="text-danger mb-3" />;
      default:
        return <Spinner animation="border" size="lg" className="text-primary mb-3" />;
    }
  };

  const renderMessage = () => {
    switch (status) {
      case 'success':
        return (
          <Alert variant="success" className="text-center">
            <Alert.Heading>Success!</Alert.Heading>
            <p>{message}</p>
            <small className="text-muted">Redirecting to homepage...</small>
          </Alert>
        );
      case 'error':
        return (
          <Alert variant="danger" className="text-center">
            <Alert.Heading>Authentication Failed</Alert.Heading>
            <p>{message}</p>
            <small className="text-muted">Redirecting to login page...</small>
          </Alert>
        );
      default:
        return (
          <div className="text-center">
            <h5>Processing authentication...</h5>
            <p className="text-muted">Please wait while we complete your sign-in.</p>
          </div>
        );
    }
  };

  return (
    <Container className="min-vh-100 d-flex align-items-center justify-content-center">
      <Row className="w-100">
        <Col md={6} lg={4} className="mx-auto">
          <Card className="shadow-lg border-0">
            <Card.Body className="p-5 text-center">
              {renderIcon()}
              {renderMessage()}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AuthCallbackPage;