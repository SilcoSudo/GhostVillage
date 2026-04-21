import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../../app/hooks/useAuth";
import LangmaText from "../../../shared/assets/images/logo.png";
import FogEffect from "../components/FogEffect";
import "./Auth.css";

const RegisterPage = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    dateOfBirth: null,
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
    if (error) setError("");
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, dateOfBirth: date });
    if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: "" });
    if (error) setError("");
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim())
      newErrors.fullName = t("auth.registerPage.validation.fullNameRequired");
    else if (formData.fullName.length < 3)
      newErrors.fullName = t("auth.registerPage.validation.fullNameMin");
    if (!formData.email.trim())
      newErrors.email = t("auth.registerPage.validation.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = t("auth.registerPage.validation.emailInvalid");

    // Password strength: match backend rule (min 8 chars, uppercase, lowercase, special)
    const pwd = formData.password || "";
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwd)
      newErrors.password = t("auth.registerPage.validation.passwordRequired");
    else if (!pwdRegex.test(pwd))
      newErrors.password = t("auth.registerPage.validation.passwordWeak");

    if (!formData.confirmPassword)
      newErrors.confirmPassword = t(
        "auth.registerPage.validation.confirmPasswordRequired",
      );
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = t(
        "auth.registerPage.validation.passwordsMatch",
      );
    // date of birth validation: required, valid date, not in future, age >= 13
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = t("auth.registerPage.validation.dobRequired");
    } else {
      const dob =
        formData.dateOfBirth instanceof Date
          ? formData.dateOfBirth
          : new Date(formData.dateOfBirth);
      const now = new Date();
      if (isNaN(dob.getTime()) || dob > now) {
        newErrors.dateOfBirth = t("auth.registerPage.validation.dobInvalid");
      } else {
        // calculate age in years reliably
        let age = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
          age--;
        }
        if (age < 13)
          newErrors.dateOfBirth = t("auth.registerPage.validation.dobAge");
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    // convert dateOfBirth to ISO date string (yyyy-mm-dd) before sending
    const payload = {
      ...formData,
      dateOfBirth: formData.dateOfBirth
        ? formData.dateOfBirth.toISOString().split("T")[0]
        : "",
    };
    const result = await register(payload);
    if (result?.success) {
      localStorage.setItem("pendingVerificationEmail", formData.email);
      navigate("/registration-success");
    } else {
      setError(
        result?.message || t("auth.registerPage.errors.registrationFailed"),
      );
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <h2>{t("auth.registerPage.title")}</h2>
          <p className="form-subtitle">{t("auth.registerPage.subtitle")}</p>

          {error && <div className="alert-message alert-danger">{error}</div>}
          {message && (
            <div className="alert-message alert-success">{message}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>{t("auth.registerPage.fullNameLabel")}</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder={t("auth.registerPage.fullNamePlaceholder")}
              />
              {errors.fullName && (
                <div className="text-danger">{errors.fullName}</div>
              )}
            </div>

            <div className="form-group">
              <label>{t("auth.registerPage.emailLabel")}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t("auth.registerPage.emailPlaceholder")}
              />
              {errors.email && (
                <div className="text-danger">{errors.email}</div>
              )}
            </div>

            <div className="form-group date-input-wrapper">
              <label>{t("auth.registerPage.dobLabel")}</label>
              <DatePicker
                selected={formData.dateOfBirth}
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                placeholderText={t("auth.registerPage.dobPlaceholder")}
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
              <label>{t("auth.registerPage.passwordLabel")}</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t("auth.registerPage.passwordPlaceholder")}
                  className="password-input"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? t("auth.hidePassword")
                      : t("auth.showPassword")
                  }
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <div className="text-danger">{errors.password}</div>
              )}
            </div>

            <div className="form-group">
              <label>{t("auth.registerPage.confirmPasswordLabel")}</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={t(
                    "auth.registerPage.confirmPasswordPlaceholder",
                  )}
                  className="password-input"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? t("auth.hidePassword")
                      : t("auth.showPassword")
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="text-danger">{errors.confirmPassword}</div>
              )}
            </div>

            <button type="submit" className="btn-signin" disabled={loading}>
              {loading
                ? t("auth.registerPage.loadingButton")
                : t("auth.registerPage.submitButton")}
            </button>
          </form>

          <div className="form-divider">
            <span>{t("auth.registerPage.dividerText")}</span>
          </div>

          <div className="signup-link">
            <p>
              {t("auth.registerPage.loginPrompt")}{" "}
              <Link to="/login">{t("auth.registerPage.loginLink")}</Link>
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

export default RegisterPage;
