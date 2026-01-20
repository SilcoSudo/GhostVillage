import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../app/context/AuthContext';

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await forgotPassword(email);
    
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card>
              <Card.Body className="text-center">
                <div className="mb-4">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                </div>
                <h3 className="mb-3">Check Your Email</h3>
                <p className="text-muted mb-4">
                  If an account with that email exists, we've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-muted mb-4">
                  The link will expire in 10 minutes for security reasons.
                </p>
                <Link to="/login" className="btn btn-primary">
                  Back to Login
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card>
            <Card.Body>
              <h2 className="text-center mb-4">Reset Password</h2>
              <p className="text-center text-muted mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email address"
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </div>
              </Form>

              <div className="text-center mt-4">
                <p>
                  Remember your password? <Link to="/login">Login</Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPasswordPage;
