import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/hooks/useAuth";
import { authService } from "../services/authService";
import LangmaText from "../../../shared/assets/images/logo.png";
import FogEffect from "../components/FogEffect";
import "./Auth.css";

const VerifyEmailPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const verifyOnceRef = useRef(false);

  const [verificationStatus, setVerificationStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const token = searchParams.get("token");
  const email =
    searchParams.get("email") ||
    localStorage.getItem("pendingVerificationEmail");

  useEffect(() => {
    if (!token) {
      setVerificationStatus("error");
      setMessage(t("auth.verifyEmailPage.messages.invalidLink"));
      return;
    }

    // Guard against double effect execution (React StrictMode) causing duplicate API calls
    if (verifyOnceRef.current) return;
    verifyOnceRef.current = true;
    verifyEmail(token);
  }, [token]);

  // Countdown and auto-redirect on success
  useEffect(() => {
    if (verificationStatus === "success") {
      // Auto-redirect to home after 2 seconds
      const timer = setTimeout(() => {
        navigate("/");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [verificationStatus, navigate]);

  const verifyEmail = async (verificationToken) => {
    try {
      setVerificationStatus("loading");

      const result = await authService.verify(verificationToken);

      if (result.success) {
        const { token: accessToken, user } = result;
        if (accessToken && user) {
          const sessionSet = setSession(accessToken, user);
          if (!sessionSet) {
            setVerificationStatus("error");
            setMessage(t("auth.verifyEmailPage.messages.sessionFailed"));
            return;
          }
        }

        setVerificationStatus("success");
        setMessage(t("auth.verifyEmailPage.messages.success"));

        localStorage.removeItem("pendingVerificationEmail");
      } else {
        setVerificationStatus("error");
        setMessage(result.message || t("auth.verifyEmailPage.messages.failed"));
      }
    } catch (error) {
      setVerificationStatus("error");
      setMessage(t("auth.verifyEmailPage.messages.failed"));
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case "loading":
        return (
          <div className="verify-content">
            <div className="spinner-wrapper">
              <div className="spinner"></div>
            </div>
            <h3>{t("auth.verifyEmailPage.loadingHeading")}</h3>
            <p className="text-muted">
              {t("auth.verifyEmailPage.loadingMessage")}
            </p>
          </div>
        );

      case "success":
        return (
          <div className="verify-content success">
            <div className="success-icon">✓</div>
            <h3>{t("auth.verifyEmailPage.successHeading")}</h3>
            <p className="success-message">{message}</p>

            <div className="redirect-loading">
              <div className="spinner"></div>
              <p>{t("auth.verifyEmailPage.successRedirect")}</p>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="verify-content error">
            <div className="error-icon">✕</div>
            <h3>{t("auth.verifyEmailPage.errorHeading")}</h3>
            <div className="alert-message alert-danger">{message}</div>

            <div className="action-links">
              <Link to="/register" className="btn-signin">
                {t("auth.verifyEmailPage.registerAgain")}
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="login-page">
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <h2>{t("auth.verifyEmailPage.title")}</h2>
          <p className="form-subtitle">{t("auth.verifyEmailPage.subtitle")}</p>

          {renderContent()}
        </div>
      </div>

      <div className="login-image-section">
        <FogEffect />
        <img src={LangmaText} alt="Langma" className="langma-image" />
      </div>
    </div>
  );
};

export default VerifyEmailPage;
