import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/hooks/useAuth";
import FogEffect from "../components/FogEffect";
import api from "../../../shared/services/axios";
import "./Auth.css";

const RegistrationSuccessPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const email = localStorage.getItem("pendingVerificationEmail");

  // Auto-redirect if email is already verified (no pending email in localStorage)
  useEffect(() => {
    if (!email) {
      // No pending email = already verified, redirect to home
      navigate("/");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendVerification = async () => {
    if (!email) {
      setMessage(t("auth.registrationSuccessPage.errors.emailNotFound"));
      setMessageType("error");
      return;
    }

    try {
      setResendLoading(true);
      setMessage("");
      setMessageType("");

      const response = await api.post("/web/auth/resend-verification", {
        email: email,
      });

      if (response.data.success) {
        setMessage(t("auth.registrationSuccessPage.successMessage"));
        setMessageType("success");
        setCountdown(60);
      }
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.response?.data?.message ||
          t("auth.registrationSuccessPage.errors.resendFailed"),
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-form-section">
        <div className="login-form-wrapper" style={{ textAlign: "center" }}>
          <h2>{t("auth.registrationSuccessPage.title")}</h2>
          <p className="form-subtitle" style={{ marginBottom: "20px" }}>
            {t("auth.registrationSuccessPage.subtitle")}
          </p>
          <p>{t("auth.registrationSuccessPage.description")}</p>

          {message && (
            <div
              className={`alert-message ${messageType === "success" ? "alert-success" : "alert-danger"}`}
              style={{ marginTop: "15px" }}
            >
              {message}
            </div>
          )}

          {countdown === 0 ? (
            <button
              className="btn-signin"
              onClick={handleResendVerification}
              disabled={resendLoading}
              style={{ marginTop: "20px" }}
            >
              {resendLoading
                ? t("auth.registrationSuccessPage.loadingButton")
                : t("auth.registrationSuccessPage.resendButton")}
            </button>
          ) : (
            <p style={{ marginTop: "15px", color: "#666" }}>
              {t("auth.registrationSuccessPage.countdown", {
                count: countdown,
              })}
            </p>
          )}
        </div>
      </div>
      <div className="login-image-section">
        <FogEffect />
      </div>
    </div>
  );
};

export default RegistrationSuccessPage;
