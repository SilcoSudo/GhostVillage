import React, { useEffect, useMemo, useState } from "react";
import { Search, Unlock } from "lucide-react";
import axios from "../shared/services/axios";
import "./assets/styles/UserManagement.css";

const UserManagementPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unmutingUserId, setUnmutingUserId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const normalizeUser = (user) => {
    const isMuted = Boolean(user?.isMuted ?? user?.isMute);

    return {
      ...user,
      id: user?._id || user?.id,
      name: user?.fullname || user?.name || "Unknown",
      email: user?.email || "",
      status:
        user?.status || (user?.isVerified === false ? "pending" : "active"),
      isMuted,
      isMute: isMuted,
      muteExpiresAt:
        user?.muteExpiresAt || user?.moderation?.mutedUntil || null,
    };
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get("/admin/users", {
        params: {
          page: currentPage,
          limit: 10,
          search: searchQuery.trim() || undefined,
        },
      });

      const userItems = response?.data?.data?.users || [];
      const paginationData = response?.data?.data?.pagination || null;

      setUsers(userItems.map(normalizeUser));

      if (paginationData) {
        setPagination({
          page: paginationData.page || 1,
          limit: paginationData.limit || 10,
          total: paginationData.total || 0,
          totalPages: paginationData.totalPages || 1,
        });
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchQuery]);

  const getMuteExpiresAt = (user) => {
    return user?.muteExpiresAt || user?.moderation?.mutedUntil || null;
  };

  const getAccountStatus = (user) => {
    const expiresAt = getMuteExpiresAt(user);
    const hasActiveMuteByTime = expiresAt
      ? new Date(expiresAt) > new Date()
      : false;
    const hasMutedFlag = Boolean(user?.isMuted ?? user?.isMute);
    const isMuted = hasActiveMuteByTime || hasMutedFlag;

    return {
      isMuted,
      mutedUntil: hasActiveMuteByTime ? expiresAt : null,
    };
  };

  const handleUnmuteUser = async (userId) => {
    try {
      setUnmutingUserId(userId);
      setError("");

      await axios.patch(`/admin/users/${userId}/unmute`);

      await fetchUsers();
    } catch (err) {
      console.error("Error unmuting user:", err);
      setError(err?.response?.data?.message || "Failed to unmute user");
    } finally {
      setUnmutingUserId(null);
    }
  };

  const getRemainingMuteTime = (expiresAt) => {
    if (!expiresAt) return null;

    const now = new Date();
    const expireDate = new Date(expiresAt);
    const diffMs = expireDate - now;

    if (diffMs <= 0) return "Expired";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;

    if (diffDays > 0) {
      return `${diffDays}d ${remainingHours}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m`;
    }
  };

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <div className="user-management-header-row">
          <div className="user-management-header-text">
            <h1>Users Management</h1>
            <p>Total: {pagination.total} users</p>
          </div>

          <div className="um-header-search">
            <div className="um-search-wrapper">
              <Search size={18} className="um-search-icon" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="um-search-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-wrapper">
        {loading ? (
          <div className="empty-state">
            <p>Loading users...</p>
          </div>
        ) : users.length > 0 ? (
          <table className="users-table">
            <colgroup>
              <col className="col-stt" />
              <col className="col-name" />
              <col className="col-email" />
              <col className="col-status" />
              <col className="col-action" />
            </colgroup>
            <thead>
              <tr>
                <th className="stt-header">
                  <span>STT</span>
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Account Status</th>
                <th className="action-header">Unmute</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => {
                const accountStatus = getAccountStatus(user);
                const remainingTime = accountStatus.mutedUntil
                  ? getRemainingMuteTime(accountStatus.mutedUntil)
                  : null;

                return (
                  <tr
                    key={user.id}
                    className={`user-row status-${user.status}`}
                  >
                    <td className="stt-cell">
                      {index + 1 + (pagination.page - 1) * pagination.limit}
                    </td>
                    <td className="user-name-cell">{user.name}</td>
                    <td className="user-email-cell">{user.email}</td>
                    <td className="account-status-cell">
                      <div className="account-status-inline">
                        <span
                          className={`account-status-badge ${accountStatus.isMuted ? "muted" : "active"}`}
                        >
                          {accountStatus.isMuted ? "Muted" : "Active"}
                        </span>
                        <span className="account-status-detail">
                          {accountStatus.isMuted
                            ? remainingTime
                              ? `Remaining: ${remainingTime}`
                              : "Restricted"
                            : "No restriction"}
                        </span>
                      </div>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button
                          className="action-btn action-unmute-icon"
                          onClick={() => handleUnmuteUser(user.id)}
                          title="Restore posting and commenting"
                          aria-label="Restore posting and commenting"
                          disabled={
                            !accountStatus.isMuted || unmutingUserId === user.id
                          }
                        >
                          <Unlock size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>{error || "No users found"}</p>
          </div>
        )}
      </div>

      {!loading && pagination.totalPages > 1 && (
        <div className="users-pagination">
          <button
            type="button"
            className="pagination-btn"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </button>

          <span className="pagination-info">
            Page {pagination.page} / {pagination.totalPages}
          </span>

          <button
            type="button"
            className="pagination-btn"
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, pagination.totalPages),
              )
            }
            disabled={currentPage >= pagination.totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
