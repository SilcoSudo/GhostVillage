import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/context/AuthContext";
import LangmaText from "../../../shared/assets/images/logo.png";
import FogEffect from "../components/FogEffect";
import "./Auth.css";

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { forgotPassword } = useAuth();

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await forgotPassword(email);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(
        result.message || t("auth.forgotPasswordPage.errors.failedSend"),
      );
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="login-page">
        <div className="login-form-section">
          <div className="login-form-wrapper">
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <i
                className="bi bi-check-circle-fill"
                style={{ fontSize: "60px", color: "#4CAF50" }}
              ></i>
            </div>
            <h2 style={{ textAlign: "center", marginBottom: "12px" }}>
              {t("auth.forgotPasswordPage.successTitle")}
            </h2>
            <p className="form-subtitle" style={{ textAlign: "center" }}>
              {t("auth.forgotPasswordPage.successMessagePrefix")}{" "}
              <strong>{email}</strong>{" "}
              {t("auth.forgotPasswordPage.successMessageSuffix")}
            </p>
            <p
              className="form-subtitle"
              style={{ textAlign: "center", marginBottom: "24px" }}
            >
              {t("auth.forgotPasswordPage.successNote")}
            </p>
            <Link
              to="/login"
              className="btn-signin"
              style={{
                display: "block",
                textAlign: "center",
                textDecoration: "none",
                width: "100%",
              }}
            >
              {t("auth.forgotPasswordPage.backToLogin")}
            </Link>
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
          <h2>{t("auth.forgotPasswordPage.title")}</h2>
          <p className="form-subtitle">
            {t("auth.forgotPasswordPage.subtitle")}
          </p>

          {error && <div className="alert-message alert-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t("auth.forgotPasswordPage.emailLabel")}</label>
              <input
                type="email"
                value={email}
                onChange={handleChange}
                required
                placeholder={t("auth.forgotPasswordPage.emailPlaceholder")}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-signin">
              {loading
                ? t("auth.forgotPasswordPage.loadingButton")
                : t("auth.forgotPasswordPage.submitButton")}
            </button>
          </form>

          <div className="signup-link">
            <p>
              {t("auth.forgotPasswordPage.rememberPassword")}{" "}
              <Link to="/login">{t("auth.forgotPasswordPage.loginLink")}</Link>
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

export default ForgotPasswordPage;
