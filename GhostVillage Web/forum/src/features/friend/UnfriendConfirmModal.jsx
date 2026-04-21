import { useTranslation } from "react-i18next";
import "./UnfriendConfirmModal.css";

const UnfriendConfirmModal = ({
  isOpen,
  onCancel,
  onConfirm,
  isLoading = false,
  friendName = "",
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const message = friendName
    ? t("unfriendConfirm.messageWithName", { name: friendName })
    : t("unfriendConfirm.messageWithoutName");

  return (
    <div className="unfriend-modal-overlay" onClick={onCancel}>
      <div
        className="unfriend-modal-content"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("unfriendConfirm.ariaLabel")}
      >
        <h3 className="unfriend-modal-title">{t("unfriendConfirm.title")}</h3>
        <p className="unfriend-modal-message">{message}</p>
        <div className="unfriend-modal-actions">
          <button
            type="button"
            className="unfriend-modal-btn cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t("unfriendConfirm.cancel")}
          </button>
          <button
            type="button"
            className="unfriend-modal-btn confirm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading
              ? t("unfriendConfirm.loading")
              : t("unfriendConfirm.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnfriendConfirmModal;
