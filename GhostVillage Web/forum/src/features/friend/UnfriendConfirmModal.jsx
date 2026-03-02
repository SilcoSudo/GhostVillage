import "./UnfriendConfirmModal.css";

const UnfriendConfirmModal = ({
  isOpen,
  onCancel,
  onConfirm,
  isLoading = false,
  friendName = "",
}) => {
  if (!isOpen) return null;

  const message = friendName
    ? `Bạn có chắc muốn hủy kết bạn với ${friendName} không?`
    : "Bạn có chắc muốn hủy kết bạn với người này không?";

  return (
    <div className="unfriend-modal-overlay" onClick={onCancel}>
      <div
        className="unfriend-modal-content"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Xác nhận hủy kết bạn"
      >
        <h3 className="unfriend-modal-title">Xác nhận</h3>
        <p className="unfriend-modal-message">{message}</p>
        <div className="unfriend-modal-actions">
          <button
            type="button"
            className="unfriend-modal-btn cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="button"
            className="unfriend-modal-btn confirm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý..." : "Hủy kết bạn"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnfriendConfirmModal;
