import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, RotateCcw } from "lucide-react";
import PostDetailModal from "../shared/components/modals/PostDetailModal";
import PostRecoveryModal from "../shared/components/modals/PostRecoveryModal";
import axios from "../shared/services/axios";
import "./assets/styles/ReportedPost.css";

const ReportedPostPage = () => {
  const { t } = useTranslation();
  const [reportedPosts, setReportedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [sortConfig, setSortConfig] = useState({
    key: "hiddenAt",
    direction: "desc",
  });
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [detailPost, setDetailPost] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

  const normalizeReportedPost = (post) => {
    const reports = Array.isArray(post?.reports) ? post.reports : [];
    const latestReport = getLatestReport(reports);
    const reportCount = reports.length;
    const isHidden = Boolean(post?.isTemporarilyHidden);

    if (reportCount <= 0 || !isHidden) {
      return null;
    }

    return {
      id: post?._id || post?.id,
      postId: post?._id || post?.id,
      postTitle: post?.title || "Untitled post",
      author: post?.author?.fullname || post?.author?.username || "Unknown",
      authorAvatar: post?.author?.avatar || null,
      reportedBy: `${reportCount} ${reportCount === 1 ? "user" : "users"}`,
      reason: latestReport?.reason || "Reported content",
      reportCount,
      content: post?.body || "",
      category: post?.category || "General",
      media: Array.isArray(post?.media) ? post.media : [],
      reports,
      createdAt:
        post?.createdAt || latestReport?.createdAt || new Date().toISOString(),
      reportedDate:
        latestReport?.createdAt || post?.updatedAt || post?.createdAt,
      hiddenAt: post?.updatedAt || latestReport?.createdAt || post?.createdAt,
      updatedAt: post?.updatedAt || post?.createdAt || null,
      isLocked: Boolean(post?.isLocked),
      isTemporarilyHidden: isHidden,
      status: "hidden",
    };
  };

  const fetchReportedPosts = async () => {
    try {
      setLoading(true);
      setError("");

      let page = 1;
      let hasMore = true;
      const loadedPosts = [];
      const seenIds = new Set();

      while (hasMore && page <= 20) {
        const response = await axios.get("/web/forum", {
          params: {
            page,
            limit: 100,
            reportedOnly: true,
            hiddenOnly: true,
          },
        });

        const posts = response?.data?.data?.posts || [];

        posts.forEach((post) => {
          const id = String(post?._id || post?.id || "");
          const normalizedPost = normalizeReportedPost(post);

          if (!id || seenIds.has(id) || !normalizedPost) {
            return;
          }

          seenIds.add(id);
          loadedPosts.push(normalizedPost);
        });

        hasMore = Boolean(response?.data?.data?.pagination?.hasMore);
        page += 1;
      }

      setReportedPosts(loadedPosts);
    } catch (err) {
      console.error("Error fetching reported posts:", err);
      setError(err?.response?.data?.message || "Failed to load reported posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportedPosts();
  }, []);

  // Filter posts based on search
  const filteredPosts = reportedPosts.filter((post) => {
    const userQuery = userSearchQuery.toLowerCase().trim();

    const matchesUserQuery =
      !userQuery ||
      String(post.author || "")
        .toLowerCase()
        .includes(userQuery);

    return matchesUserQuery;
  });

  // Sort posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
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

  const openRecoveryModal = (post) => {
    setError("");
    setSelectedPost(post);
    setIsRecoveryModalOpen(true);
  };

  const openDetailModal = (post) => {
    setDetailPost(post);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setDetailPost(null);
  };

  const closeRecoveryModal = () => {
    setIsRecoveryModalOpen(false);
    setSelectedPost(null);
  };

  const handleRestorePost = async (recoveryReason = "") => {
    if (!selectedPost?.postId) {
      setError("Invalid post data. Please refresh and try again.");
      return;
    }

    try {
      setIsRestoring(true);
      setError("");

      await axios.patch(`/web/forum/${selectedPost.postId}/restore`, {
        recoveryReason: String(recoveryReason || "").trim(),
      });

      setReportedPosts((prev) => prev.filter((p) => p.id !== selectedPost.id));
      closeRecoveryModal();
    } catch (err) {
      console.error("Error restoring post:", err);
      setError(err?.response?.data?.message || "Failed to restore post");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="reported-posts-container">
      <div className="reported-posts-header">
        <h1>{tr("posts.reported", "Reported Posts")}</h1>
        <p className="subtitle">
          {tr(
            "posts.reportedSubtitle",
            "Manage and review reported user posts",
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

      <div className="reported-posts-table-wrapper">
        {loading ? (
          <div className="empty-state">
            <p>Loading reported posts...</p>
          </div>
        ) : (
          <>
            <table className="reported-posts-table">
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort("postTitle")}
                    className="sortable"
                  >
                    {tr("posts.postTitle", "Post Title")}
                  </th>
                  <th onClick={() => handleSort("author")} className="sortable">
                    {tr("posts.author", "Author")}
                  </th>
                  <th onClick={() => handleSort("reason")} className="sortable">
                    {tr("posts.reason", "Report Reason")}
                  </th>
                  <th>{tr("posts.reportCount", "Reports")}</th>
                  <th
                    onClick={() => handleSort("hiddenAt")}
                    className="sortable"
                  >
                    {tr("posts.reportedDate", "Hidden Date")}
                  </th>
                  <th>{tr("common.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {sortedPosts.map((post) => (
                  <tr key={post.id}>
                    <td className="post-title-cell">
                      <span className="post-title">{post.postTitle}</span>
                    </td>
                    <td className="post-author-cell">
                      <span>{post.author}</span>
                    </td>
                    <td className="post-reason-cell">
                      <span className="reason-badge">{post.reason}</span>
                    </td>
                    <td className="post-report-count-cell">
                      <span className="report-count-badge">
                        {post.reportCount}
                      </span>
                    </td>
                    <td className="post-date-cell">
                      <span>
                        {new Date(post.reportedDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="post-actions-cell">
                      <button
                        className="action-btn view-btn"
                        onClick={() => openDetailModal(post)}
                        title={tr("common.view", "View Details")}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="action-btn restore-btn"
                        onClick={() => openRecoveryModal(post)}
                        title={tr("posts.restore", "Restore Post")}
                      >
                        <RotateCcw size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sortedPosts.length === 0 && (
              <div className="empty-state">
                <p>{error || tr("common.noData", "No reported posts found")}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Post Recovery Modal */}
      <PostRecoveryModal
        isOpen={isRecoveryModalOpen}
        post={selectedPost}
        onClose={closeRecoveryModal}
        onConfirm={handleRestorePost}
        isSubmitting={isRestoring}
      />

      <PostDetailModal
        isOpen={isDetailModalOpen}
        post={detailPost}
        onClose={closeDetailModal}
        isLoading={false}
      />
    </div>
  );
};

export default ReportedPostPage;
