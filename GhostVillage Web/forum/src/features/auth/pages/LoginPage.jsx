import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../app/hooks/useAuth";
import authService from "../services/authService";
import LangmaText from "../../../shared/assets/images/logo.png";
import FogEffect from "../components/FogEffect";
import "./Auth.css";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle OAuth error from query parameters
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (!errorParam) return;

    // Map error codes to user-friendly messages
    const errorMessages = {
      access_denied:
        "You denied Google access. Please try again and grant permission.",
      invalid_scope: "Invalid permissions requested. Please try again.",
      invalid_grant: "Invalid authorization grant. Please try again.",
      no_authorization_code:
        "Failed to get authorization code. Please try again.",
      server_error: errorDescription
        ? `Server error: ${errorDescription}. Please try again later.`
        : "Server error occurred. Please try again later.",
    };

    const message =
      errorMessages[errorParam] || "Google login failed. Please try again.";
    setError(message);
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Frontend Validation
    const email = formData.email.trim();
    const password = formData.password;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setError("Email is required");
      return;
    }
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate password (match Register requirements)
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    // Password must include uppercase, lowercase, and special character
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwdRegex.test(password)) {
      setError(
        "Password must include uppercase, lowercase, and a special character",
      );
      return;
    }

    setLoading(true);
    const result = await login({ email, password }, rememberMe);

    if (result?.success) {
      navigate("/");
    } else {
      const errorMessage = result?.message || "Login failed";

      // Handle unverified account - redirect with email in state
      if (errorMessage === "ACCOUNT_NOT_VERIFIED") {
        navigate("/registration-success", {
          state: { email: formData.email },
        });
        return;
      }

      setError(errorMessage);
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await authService.getGoogleAuthUrl();

      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError(data.message || "Failed to initialize Google login");
        setLoading(false);
      }
    } catch (error) {
      console.error("Google login error:", error);
      setError("Failed to initialize Google login");
      setLoading(false);
    }
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
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="form-divider">
            <span>Or</span>
          </div>

          <button
            type="button"
            className="btn-google"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.582c1.321 0 2.508.454 3.44 1.345l2.582-2.580C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.582 9 3.582z"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="signup-link">
            <p>
              Don't have an account? <Link to="/register">Register now</Link>
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
