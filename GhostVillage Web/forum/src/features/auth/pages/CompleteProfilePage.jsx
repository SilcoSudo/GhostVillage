import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../../../app/context/AuthContext";
import authService from "../services/authService";
import { Spinner } from "react-bootstrap";
import LangmaText from "../../../shared/assets/images/logo.png";
import FogEffect from "../components/FogEffect";
import "./Auth.css";

const CompleteProfilePage = () => {
  const { t } = useTranslation();
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
      newErrors.dateOfBirth = t(
        "auth.completeProfilePage.validation.dobRequired",
      );
    } else {
      const dob =
        dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
      const now = new Date();
      if (isNaN(dob.getTime()) || dob > now) {
        newErrors.dateOfBirth = t(
          "auth.completeProfilePage.validation.dobInvalid",
        );
      } else {
        // Calculate age in years reliably
        let age = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
          age--;
        }
        if (age < 13)
          newErrors.dateOfBirth = t(
            "auth.completeProfilePage.validation.dobAge",
          );
      }
    }

    // Password validation (match register)
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!password) {
      newErrors.password = t(
        "auth.completeProfilePage.validation.passwordRequired",
      );
    } else if (!pwdRegex.test(password)) {
      newErrors.password = t(
        "auth.completeProfilePage.validation.passwordWeak",
      );
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t(
        "auth.completeProfilePage.validation.confirmPasswordRequired",
      );
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t(
        "auth.completeProfilePage.validation.passwordsMatch",
      );
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
        setError(data.message || t("auth.completeProfilePage.errors.failed"));
      }
    } catch (error) {
      console.error("Complete profile error:", error);
      setError(t("auth.completeProfilePage.errors.generic"));
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
            <p className="mt-3 text-light">{t("common.loading")}</p>
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
          <h2>{t("auth.completeProfilePage.title")}</h2>
          <p className="form-subtitle">
            {t("auth.completeProfilePage.subtitle")}
          </p>

          {error && <div className="alert-message alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group date-input-wrapper">
              <label>{t("auth.completeProfilePage.dateOfBirthLabel")}</label>
              <DatePicker
                selected={dateOfBirth}
                onChange={(date) => setDateOfBirth(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText={t(
                  "auth.completeProfilePage.dateOfBirthPlaceholder",
                )}
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
              <label>{t("auth.completeProfilePage.passwordLabel")}</label>
              <input
                type="password"
                name="password"
                placeholder={t("auth.completeProfilePage.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && (
                <div className="text-danger">{errors.password}</div>
              )}
            </div>

            <div className="form-group">
              <label>
                {t("auth.completeProfilePage.confirmPasswordLabel")}
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder={t(
                  "auth.completeProfilePage.confirmPasswordPlaceholder",
                )}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && (
                <div className="text-danger">{errors.confirmPassword}</div>
              )}
            </div>

            <button type="submit" className="btn-signin" disabled={loading}>
              {loading
                ? t("auth.completeProfilePage.loadingButton")
                : t("auth.completeProfilePage.submitButton")}
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
