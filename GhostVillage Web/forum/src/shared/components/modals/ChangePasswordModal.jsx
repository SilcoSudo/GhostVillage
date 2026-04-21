import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Eye, EyeOff, Lock, Check, AlertCircle } from "lucide-react";
import api from "../../../shared/services/axios";
import "./ChangePasswordModal.css";

const ChangePasswordModal = ({ onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const criteria = [
      {
        met: minLength,
        text: t("auth.changePasswordModal.criteria.minLength"),
      },
      {
        met: hasUpperCase,
        text: t("auth.changePasswordModal.criteria.uppercase"),
      },
      {
        met: hasLowerCase,
        text: t("auth.changePasswordModal.criteria.lowercase"),
      },
      {
        met: hasSpecialChar,
        text: t("auth.changePasswordModal.criteria.specialChar"),
      },
    ];

    const score = criteria.filter((c) => c.met).length;
    return { score, criteria };
  };

  const passwordStrength = checkPasswordStrength(formData.newPassword);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const toggleShowPassword = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.currentPassword) {
      setError(
        t("auth.changePasswordModal.validation.currentPasswordRequired"),
      );
      setLoading(false);
      return;
    }

    if (!formData.newPassword) {
      setError(t("auth.changePasswordModal.validation.newPasswordRequired"));
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError(t("auth.changePasswordModal.validation.minLength"));
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError(t("auth.changePasswordModal.validation.passwordsDoNotMatch"));
      setLoading(false);
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError(t("auth.changePasswordModal.validation.differentFromCurrent"));
      setLoading(false);
      return;
    }

    if (passwordStrength.score < 4) {
      setError(t("auth.changePasswordModal.validation.strengthRequirements"));
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/web/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setError(response.data.message || t("auth.changePasswordModal.failed"));
      }
    } catch (err) {
      setError(
        err.response?.data?.message || t("auth.changePasswordModal.failed"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="horror-modal-overlay" onClick={onClose}>
      <div
        className="horror-modal-content change-password-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="horror-modal-header">
          <div className="horror-modal-title">
            <Lock size={24} />
            <h2>{t("auth.changePasswordModal.title")}</h2>
          </div>
          <button className="horror-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="horror-modal-form">
          {error && (
            <div className="horror-alert horror-alert-error">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="horror-alert horror-alert-success">
              <Check size={20} />
              <span>{t("auth.changePasswordModal.successMessage")}</span>
            </div>
          )}

          {/* Current Password */}
          <div className="horror-form-group">
            <label htmlFor="currentPassword">
              {t("auth.changePasswordModal.currentPasswordLabel")}
            </label>
            <div className="horror-password-input-wrapper">
              <input
                type={showPasswords.current ? "text" : "password"}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder={t(
                  "auth.changePasswordModal.currentPasswordPlaceholder",
                )}
                required
                className="horror-input"
                disabled={loading || success}
              />
              <button
                type="button"
                className="horror-password-toggle"
                onClick={() => toggleShowPassword("current")}
                tabIndex={-1}
              >
                {showPasswords.current ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="horror-form-group">
            <label htmlFor="newPassword">
              {t("auth.changePasswordModal.newPasswordLabel")}
            </label>
            <div className="horror-password-input-wrapper">
              <input
                type={showPasswords.new ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder={t(
                  "auth.changePasswordModal.newPasswordPlaceholder",
                )}
                required
                className="horror-input"
                disabled={loading || success}
              />
              <button
                type="button"
                className="horror-password-toggle"
                onClick={() => toggleShowPassword("new")}
                tabIndex={-1}
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {formData.newPassword && (
            <div className="horror-password-strength">
              <div className="horror-strength-bar">
                <div
                  className={`horror-strength-fill horror-strength-${passwordStrength.score}`}
                  style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                />
              </div>
              <div className="horror-strength-criteria">
                {passwordStrength.criteria.map((criterion, index) => (
                  <div
                    key={index}
                    className={`horror-criterion ${criterion.met ? "met" : ""}`}
                  >
                    {criterion.met ? <Check size={14} /> : <X size={14} />}
                    <span>{criterion.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div className="horror-form-group">
            <label htmlFor="confirmPassword">
              {t("auth.changePasswordModal.confirmPasswordLabel")}
            </label>
            <div className="horror-password-input-wrapper">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={t(
                  "auth.changePasswordModal.confirmPasswordPlaceholder",
                )}
                required
                className="horror-input"
                disabled={loading || success}
              />
              <button
                type="button"
                className="horror-password-toggle"
                onClick={() => toggleShowPassword("confirm")}
                tabIndex={-1}
              >
                {showPasswords.confirm ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="horror-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-horror-outline"
              disabled={loading || success}
            >
              {t("auth.changePasswordModal.cancel")}
            </button>
            <button
              type="submit"
              className="btn-horror"
              disabled={loading || success}
            >
              {loading
                ? t("auth.changePasswordModal.changing")
                : success
                  ? t("auth.changePasswordModal.successButton")
                  : t("auth.changePasswordModal.submitButton")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
