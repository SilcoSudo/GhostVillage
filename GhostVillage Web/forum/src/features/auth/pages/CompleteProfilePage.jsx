import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../../../app/context/AuthContext";
import authService from "../services/authService";
import { Spinner } from "react-bootstrap";
import LangmaText from "../../../shared/assets/images/logo.png";
import FogEffect from "../components/FogEffect";
import "./Auth.css";

const CompleteProfilePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession, user: currentUser } = useAuth();

  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [fetchingUser, setFetchingUser] = useState(true);

  useEffect(() => {
    const initializeProfile = async () => {
      const token = searchParams.get("token");

      // Check token exists
      if (!token) {
        navigate("/login?error=no_token");
        return;
      }

      try {
        // Validate token by fetching user info
        const data = await authService.getCurrentUser(token);

        if (!data.success) {
          // Token invalid or expired
          console.error("Token validation failed:", data.message);
          navigate("/login?error=invalid_token");
          return;
        }

        // Save session
        setSession(token, data.user);

        // User needs to complete profile - proceed
      } catch (error) {
        console.error("Initialize profile error:", error);
        navigate("/login?error=server_error");
      } finally {
        setFetchingUser(false);
      }
    };

    initializeProfile();
  }, [searchParams, navigate, setSession]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrors({});

    const newErrors = {};

    // Date of birth validation
    if (!dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const dob =
        dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
      const now = new Date();
      if (isNaN(dob.getTime()) || dob > now) {
        newErrors.dateOfBirth = "Please enter a valid date of birth";
      } else {
        // Calculate age in years reliably
        let age = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
          age--;
        }
        if (age < 13)
          newErrors.dateOfBirth = "You must be at least 13 years old";
      }
    }

    // Password validation (match register)
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!password) {
      newErrors.password = "Password is required";
    } else if (!pwdRegex.test(password)) {
      newErrors.password =
        "Password must be at least 8 characters and include uppercase, lowercase, and a special character";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString().split("T")[0] : "",
        password,
      };

      const data = await authService.completeProfile(
        payload.dateOfBirth,
        payload.password,
      );

      if (data.success && data.user) {
        // Update user in context (token already set)
        setSession(localStorage.getItem("token"), data.user);
        navigate("/");
      } else {
        setError(data.message || "Failed to complete profile");
      }
    } catch (error) {
      console.error("Complete profile error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingUser) {
    return (
      <div className="login-page">
        <div className="login-form-section">
          <div className="text-center py-5">
            <Spinner
              animation="border"
              variant="light"
              style={{ width: "3rem", height: "3rem" }}
            />
            <p className="mt-3 text-light">Loading...</p>
          </div>
        </div>
        <div className="login-image-section">
          <FogEffect />
          <img src={LangmaText} alt="Langma" className="langma-image" />
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <h2>Complete Your Profile</h2>
          <p className="form-subtitle">
            We need a bit more information to get you started
          </p>

          {error && <div className="alert-message alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group date-input-wrapper">
              <label>Date of Birth</label>
              <DatePicker
                selected={dateOfBirth}
                onChange={(date) => setDateOfBirth(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select your date of birth"
                maxDate={new Date()}
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
              />
              {errors.dateOfBirth && (
                <div className="text-danger">{errors.dateOfBirth}</div>
              )}
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && (
                <div className="text-danger">{errors.password}</div>
              )}
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && (
                <div className="text-danger">{errors.confirmPassword}</div>
              )}
            </div>

            <button type="submit" className="btn-signin" disabled={loading}>
              {loading ? "Saving..." : "Complete Profile"}
            </button>
          </form>
        </div>
      </div>

      <div className="login-image-section">
        <FogEffect />
        <img src={LangmaText} alt="Langma" className="langma-image" />
      </div>
    </div>
  );
};

export default CompleteProfilePage;
