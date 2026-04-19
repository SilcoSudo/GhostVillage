import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/context/AuthContext";
import LangmaText from "../../../shared/assets/images/logo.png";
import FogEffect from "../components/FogEffect";
import "./Auth.css";

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [token, setToken] = useState("");

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (!tokenFromUrl) {
      navigate("/forgot-password");
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Password validation - must match backend regex
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!formData.password) {
      newErrors.password = t(
        "auth.resetPasswordPage.validation.passwordRequired",
      );
    } else if (!pwdRegex.test(formData.password)) {
      newErrors.password = t("auth.resetPasswordPage.validation.passwordWeak");
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t(
        "auth.resetPasswordPage.validation.confirmPasswordRequired",
      );
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t(
        "auth.resetPasswordPage.validation.passwordsMatch",
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const result = await resetPassword(token, formData.password);

    if (result.success) {
      navigate("/login");
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <h2>{t("auth.resetPasswordPage.title")}</h2>
          <p className="form-subtitle">
            {t("auth.resetPasswordPage.subtitle")}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t("auth.resetPasswordPage.newPasswordLabel")}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t("auth.resetPasswordPage.newPasswordPlaceholder")}
                className={errors.password ? "error" : ""}
              />
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
              <span className="form-hint">
                {t("auth.resetPasswordPage.passwordHint")}
              </span>
            </div>

            <div className="form-group">
              <label>{t("auth.resetPasswordPage.confirmPasswordLabel")}</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={t(
                  "auth.resetPasswordPage.confirmPasswordPlaceholder",
                )}
                className={errors.confirmPassword ? "error" : ""}
              />
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-signin">
              {loading
                ? t("auth.resetPasswordPage.loadingButton")
                : t("auth.resetPasswordPage.submitButton")}
            </button>
          </form>

          <div className="signup-link">
            <p>
              {t("auth.resetPasswordPage.rememberPassword")}{" "}
              <Link to="/login">{t("auth.resetPasswordPage.loginLink")}</Link>
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

export default ResetPasswordPage;
