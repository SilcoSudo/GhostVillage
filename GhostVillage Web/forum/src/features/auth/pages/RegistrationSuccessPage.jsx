import { Link } from 'react-router-dom';
import FogEffect from '../components/FogEffect';

const RegistrationSuccessPage = () => {
  return (
    <div className="login-page">
      <div className="login-form-section">
        <div className="login-form-wrapper" style={{ textAlign: 'center' }}>
          <h2>Registration Successful!</h2>
          <p className="form-subtitle" style={{ marginBottom: '20px' }}>
            We have sent a verification link to your email.
          </p>
          <p>Please check your inbox (and spam folder) to activate your account.</p>
          <Link to="/login" className="btn-signin" style={{ marginTop: '20px', textDecoration: 'none' }}>
            Back to Login Page
          </Link>
        </div>
      </div>
      <div className="login-image-section">
        <FogEffect />
      </div>
    </div>
  );
};

export default RegistrationSuccessPage;
