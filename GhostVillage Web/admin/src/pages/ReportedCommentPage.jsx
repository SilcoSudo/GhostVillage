import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RotateCcw, Trash2 } from "lucide-react";
import CommentRecoveryModal from "../shared/components/modals/CommentRecoveryModal";
import axios from "../shared/services/axios";
import "./assets/styles/ReportedComment.css";

const ReportedCommentPage = () => {
  const { t } = useTranslation();
  const [reportedComments, setReportedComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [sortConfig, setSortConfig] = useState({
    key: "hiddenAt",
    direction: "desc",
  });
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedComment, setSelectedComment] = useState(null);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const tr = (key, fallback) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const getLatestReport = (reports) => {
    if (!Array.isArray(reports) || reports.length === 0) {
      return null;
    }

    return [...reports].sort(
      (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0),
    )[0];
  };

  const normalizeReportedComment = (comment) => {
    const reports = Array.isArray(comment?.reports) ? comment.reports : [];
    const latestReport = getLatestReport(reports);
    const reportCount = reports.length;
    const isHidden = Boolean(comment?.isHiddenByModeration);

    if (reportCount <= 0 || !isHidden) {
      return null;
    }

    return {
      id: comment?._id,
      commentId: comment?._id,
      postId: comment?.postId,
      commentText: comment?.content || "",
      author: comment?.author?.fullname || "Unknown",
      authorAvatar: comment?.author?.avatar || null,
      postTitle: comment?.postTitle || "Unknown post",
      reportedBy: `${reportCount} ${reportCount === 1 ? "user" : "users"}`,
      reason: latestReport?.reason || comment?.reason || "Reported content",
      reportCount,
      content: comment?.content || "",
      createdAt:
        comment?.createdAt ||
        latestReport?.createdAt ||
        new Date().toISOString(),
      reportedDate:
        latestReport?.createdAt || comment?.updatedAt || comment?.createdAt,
      hiddenAt:
        comment?.updatedAt || latestReport?.createdAt || comment?.createdAt,
      updatedAt: comment?.updatedAt || comment?.createdAt || null,
      reports,
      status: "hidden",
    };
  };

  const fetchReportedComments = async () => {
    try {
      setLoading(true);
      setError("");

      let page = 1;
      let hasMore = true;
      const loadedComments = [];
      const seenIds = new Set();

      while (hasMore && page <= 20) {
        const response = await axios.get("/web/forum/reported-comments", {
          params: {
            page,
            limit: 100,
          },
        });

        const comments = response?.data?.data?.comments || [];

        comments.forEach((comment) => {
          const id = String(comment?._id || "");
          const normalizedComment = normalizeReportedComment(comment);

          if (!id || seenIds.has(id) || !normalizedComment) {
            return;
          }

          seenIds.add(id);
          loadedComments.push(normalizedComment);
        });

        hasMore = Boolean(response?.data?.data?.pagination?.hasMore);
        page += 1;
      }

      setReportedComments(loadedComments);
    } catch (err) {
      console.error("Error fetching reported comments:", err);
      setError(
        err?.response?.data?.message || "Failed to load reported comments",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportedComments();
  }, []);

  // Filter comments based on search
  const filteredComments = reportedComments.filter((comment) => {
    const userQuery = userSearchQuery.toLowerCase().trim();

    return (
      !userQuery ||
      String(comment.author || "")
        .toLowerCase()
        .includes(userQuery)
    );
  });

  // Sort comments
  const sortedComments = [...filteredComments].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (sortConfig.key === "reportedDate" || sortConfig.key === "hiddenAt") {
      const aTime = new Date(aValue || 0).getTime();
      const bTime = new Date(bValue || 0).getTime();
      return sortConfig.direction === "asc" ? aTime - bTime : bTime - aTime;
    }

    if (typeof aValue === "string") {
      return sortConfig.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const openRecoveryModal = (comment) => {
    setError("");
    setSelectedComment(comment);
    setIsRecoveryModalOpen(true);
  };

  const closeRecoveryModal = () => {
    setIsRecoveryModalOpen(false);
    setSelectedComment(null);
  };

  const handleRestoreComment = async (recoveryReason = "") => {
    if (!selectedComment?.commentId || !selectedComment?.postId) {
      setError("Invalid comment data. Please refresh and try again.");
      return;
    }

    try {
      setIsRestoring(true);
      setError("");

      await axios.patch(
        `/web/forum/${selectedComment.postId}/comments/${selectedComment.commentId}/restore`,
        {
          recoveryReason: String(recoveryReason || "").trim(),
        },
      );

      setReportedComments((prev) =>
        prev.filter((c) => c.id !== selectedComment.id),
      );
      closeRecoveryModal();
    } catch (err) {
      console.error("Error restoring comment:", err);
      setError(err?.response?.data?.message || "Failed to restore comment");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteComment = (commentId) => {
    setReportedComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <div className="reported-comments-container">
      <div className="reported-comments-header">
        <h1>{tr("comments.reported", "Reported Comments")}</h1>
        <p className="subtitle">
          {tr(
            "comments.reportedSubtitle",
            "Manage and review reported user comments",
          )}
        </p>
      </div>

      <div className="search-and-filter">
        <input
          type="text"
          placeholder="Search by user name..."
          className="search-input"
          value={userSearchQuery}
          onChange={(e) => setUserSearchQuery(e.target.value)}
        />
      </div>

      <div className="reported-comments-table-wrapper">
        {loading ? (
          <div className="empty-state">
            <p>Loading reported comments...</p>
          </div>
        ) : (
          <>
            <table className="reported-comments-table">
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort("commentText")}
                    className="sortable"
                  >
                    {tr("comments.commentText", "Comment")}
                  </th>
                  <th onClick={() => handleSort("author")} className="sortable">
                    {tr("comments.author", "Author")}
                  </th>
                  <th
                    onClick={() => handleSort("postTitle")}
                    className="sortable"
                  >
                    {tr("comments.postTitle", "Post")}
                  </th>
                  <th onClick={() => handleSort("reason")} className="sortable">
                    {tr("comments.reason", "Report Reason")}
                  </th>
                  <th>{tr("comments.reportCount", "Reports")}</th>
                  <th
                    onClick={() => handleSort("hiddenAt")}
                    className="sortable"
                  >
                    {tr("comments.reportedDate", "Hidden Date")}
                  </th>
                  <th>{tr("common.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {sortedComments.map((comment) => (
                  <tr key={comment.id}>
                    <td className="comment-text-cell">
                      <span
                        className="comment-text"
                        title={comment.commentText || ""}
                      >
                        {comment.commentText}
                      </span>
                    </td>
                    <td className="comment-author-cell">
                      <span>{comment.author}</span>
                    </td>
                    <td className="comment-post-cell">
                      <span className="post-link">{comment.postTitle}</span>
                    </td>
                    <td className="comment-reason-cell">
                      <span className="reason-badge">{comment.reason}</span>
                    </td>
                    <td className="comment-report-count-cell">
                      <span className="report-count-badge">
                        {comment.reportCount}
                      </span>
                    </td>
                    <td className="comment-date-cell">
                      <span>
                        {new Date(comment.hiddenAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="comment-actions-cell">
                      <button
                        className="action-btn restore-btn"
                        onClick={() => openRecoveryModal(comment)}
                        title={tr("comments.restore", "Restore Comment")}
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteComment(comment.id)}
                        title={tr("common.delete", "Delete Comment")}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sortedComments.length === 0 && (
              <div className="empty-state">
                <p>
                  {error || tr("common.noData", "No reported comments found")}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Comment Recovery Modal */}
      <CommentRecoveryModal
        isOpen={isRecoveryModalOpen}
        comment={selectedComment}
        onClose={closeRecoveryModal}
        onConfirm={handleRestoreComment}
        isSubmitting={isRestoring}
      />
    </div>
  );
};

export default ReportedCommentPage;
