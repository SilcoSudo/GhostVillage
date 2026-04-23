import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/hooks/useAuth";
import api from "../../../shared/services/axios";
import FriendActions from "../../friend/FriendActions";
import {
  User,
  Mail,
  Calendar,
  Edit2,
  MapPin,
  Link as LinkIcon,
  MessageSquare,
  Trophy,
  Clock,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  Lock,
  UserCheck,
  Shield,
  BookOpen,
  Bookmark,
  Users,
} from "lucide-react";
import "./ProfilePage.css";
import PostDetailModal from "../../posts/components/PostDetailModal";
import PostCard from "../../posts/components/PostCard";
import ChangePasswordModal from "../../../shared/components/modals/ChangePasswordModal";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const { user: currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedPostsLoading, setSavedPostsLoading] = useState(false);
  const [savedPostsError, setSavedPostsError] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [updating, setUpdating] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [scrollToComments, setScrollToComments] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const dateLocale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";

  const isOwnProfile = currentUser && (id ? currentUser._id === id : true);

  useEffect(() => {
    const postId = searchParams.get("postId");
    const shouldScroll = searchParams.get("scrollToComments") === "1";

    setSelectedPostId(postId);
    setShowPostModal(Boolean(postId));
    setScrollToComments(Boolean(postId && shouldScroll));
  }, [searchParams]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const targetId = id || currentUser?._id;
        if (!targetId) {
          setLoading(false);
          return;
        }

        // Use own profile endpoint if it's current user, else use public profile
        const endpoint = isOwnProfile
          ? "/web/user/profile/me"
          : `/web/user/profile/${targetId}`;
        const response = await api.get(endpoint);

        if (response.data.success) {
          setProfileUser(response.data.data);
          setNewName(response.data.data.fullname);
          setNewBio(response.data.data.bio || "");
          setNewAvatar(response.data.data.avatar || "");
        } else {
          setError(
            response.data.message || t("profile.errors.subjectNotFound"),
          );
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(
          err.response?.data?.message || t("profile.errors.connectionFailed"),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, currentUser, isOwnProfile]);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (!isOwnProfile || activeTab !== "saved") return;

      try {
        setSavedPostsLoading(true);
        setSavedPostsError("");

        const response = await api.get("/web/user/saved-posts");
        if (response.data.success) {
          setSavedPosts(response.data?.data?.posts || []);
        } else {
          setSavedPosts([]);
          setSavedPostsError(t("posts.failedToLoadSaved"));
        }
      } catch (err) {
        console.error("Failed to fetch saved posts:", err);
        setSavedPostsError(
          err.response?.data?.message || t("posts.failedToLoadSaved"),
        );
      } finally {
        setSavedPostsLoading(false);
      }
    };

    fetchSavedPosts();
  }, [activeTab, isOwnProfile, t]);

  const handleUpdateName = async () => {
    try {
      const response = await api.put("/web/user/profile/update-name", {
        fullname: newName,
      });
      if (response.data.success) {
        setProfileUser({ ...profileUser, fullname: newName });
        setIsEditingName(false);
        refreshUser();
      }
    } catch (err) {
      alert(t("profile.errors.failedUpdateName"));
    }
  };

  const handleUpdateProfile = async () => {
    if (!newName.trim()) {
      alert(t("profile.errors.nameEmpty"));
      return;
    }
    if (newName.length > 100) {
      alert(t("profile.errors.nameTooLong"));
      return;
    }
    if (newBio.length > 500) {
      alert(t("profile.errors.bioTooLong"));
      return;
    }

    setUpdating(true);
    try {
      const response = await api.put("/web/user/profile/me", {
        fullname: newName,
        avatar: newAvatar || undefined,
        bio: newBio || undefined,
      });

      if (response.data.success) {
        const updatedData = response.data.data;
        setProfileUser(updatedData);
        setIsEditingName(false);
        setIsEditingBio(false);
        setIsEditingAvatar(false);
        refreshUser();
        alert(t("profile.success.updated"));
      }
    } catch (err) {
      console.error("Update error:", err);
      alert(
        err.response?.data?.message || t("profile.errors.failedUpdateProfile"),
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      alert(t("profile.errors.onlyImageTypes"));
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t("profile.errors.fileTooLarge"));
      return;
    }

    setAvatarFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) {
      alert(t("profile.errors.selectImageFirst"));
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const response = await api.post("/web/user/avatar/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        const updatedData = response.data.data;
        setProfileUser(updatedData);
        setAvatarFile(null);
        setAvatarPreview("");
        refreshUser();
        alert(t("profile.success.avatarUploaded"));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(
        err.response?.data?.message || t("profile.errors.failedUploadAvatar"),
      );
    } finally {
      setUploading(false);
    }
  };

  const toggleEmailVisibility = async () => {
    try {
      const response = await api.put(
        "/web/user/profile/toggle-email-visibility",
      );
      if (response.data.success) {
        setProfileUser({
          ...profileUser,
          emailVisibility: !profileUser.emailVisibility,
        });
      }
    } catch (err) {
      alert(t("profile.errors.failedUpdateVisibility"));
    }
  };

  const handlePostClick = (postId, shouldScrollComments = false) => {
    setSelectedPostId(postId);
    setShowPostModal(true);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("postId", postId);

    if (shouldScrollComments) {
      nextSearchParams.set("scrollToComments", "1");
    } else {
      nextSearchParams.delete("scrollToComments");
    }

    setScrollToComments(shouldScrollComments);
    setSearchParams(nextSearchParams);
  };

  const handleClosePostModal = () => {
    setShowPostModal(false);
    setSelectedPostId(null);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("postId");
    nextSearchParams.delete("scrollToComments");
    setSearchParams(nextSearchParams);
  };

  const handleSavedPostUpdate = (updatedPost) => {
    setSavedPosts((prev) =>
      prev.filter((post) => post._id !== updatedPost._id),
    );
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="horror-spinner"></div>
        <p>{t("profile.loading")}</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="profile-error">
        <h2>{t("profile.notFoundTitle")}</h2>
        <p>{error || t("profile.notFoundMessage")}</p>
        <button onClick={() => navigate("/")} className="btn-horror">
          {t("profile.buttons.returnHome")}
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-cover"></div>
        <div className="profile-header-content">
          <div className="profile-avatar-wrapper">
            <img
              src={
                profileUser.avatar ||
                `https://ui-avatars.com/api/?name=${profileUser.fullname}&background=990000&color=B5A642`
              }
              alt={profileUser.fullname}
              className="profile-avatar"
            />
          </div>

          <div className="profile-main-info">
            {isEditingName ? (
              <div className="edit-name-group">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="horror-input-small"
                  placeholder={t("profile.placeholders.displayName")}
                  maxLength={100}
                />
                <button
                  onClick={handleUpdateProfile}
                  className="btn-horror-save"
                  disabled={updating}
                >
                  {updating
                    ? t("profile.buttons.saving")
                    : t("profile.buttons.save")}
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="btn-horror-cancel"
                >
                  {t("profile.buttons.cancel")}
                </button>
              </div>
            ) : (
              <div className="name-display-group">
                <h1 className="profile-name">
                  {profileUser.fullname || t("profile.anonymousSubject")}
                </h1>
                {isOwnProfile && (
                  <Edit2
                    size={20}
                    className="edit-inline-icon"
                    onClick={() => setIsEditingName(true)}
                    title={t("profile.actions.editDisplayName")}
                  />
                )}
              </div>
            )}
            <div className="profile-badges">
              {profileUser.role === "admin" && (
                <span className="badge admin-badge">
                  {t("profile.badges.warden")}
                </span>
              )}
              <span className="badge rank-badge">
                {t("profile.badges.explorer")}
              </span>
            </div>
          </div>

          <div className="profile-actions">
            {!isOwnProfile && profileUser && (
              <FriendActions
                targetUserId={id}
                preloadedStatus={profileUser.friendshipStatus}
              />
            )}
          </div>
        </div>
      </div>

      <div className="profile-body-grid">
        {/* Sidebar Info */}
        <div className="profile-sidebar">
          <div className="profile-card info-card">
            <h3>{t("profile.headings.logData")}</h3>
            <ul className="info-list">
              <li>
                <Mail size={16} />
                <span>
                  {profileUser.emailVisibility || isOwnProfile
                    ? profileUser.email
                    : "••••••••@••••.com"}
                </span>
                {isOwnProfile && (
                  <button
                    className="icon-btn-inline"
                    onClick={toggleEmailVisibility}
                    title={t("profile.actions.toggleVisibility")}
                  >
                    {profileUser.emailVisibility ? (
                      <Eye size={14} />
                    ) : (
                      <EyeOff size={14} />
                    )}
                  </button>
                )}
              </li>
              <li>
                <Calendar size={16} />
                <span>
                  {t("profile.labels.joinedDate", {
                    date: new Date(
                      profileUser.createdAt || Date.now(),
                    ).toLocaleDateString(dateLocale),
                  })}
                </span>
              </li>
              <li
                className="clickable-row"
                onClick={() => setActiveTab("friends")}
              >
                <Users size={16} />
                <span>
                  {t("profile.labels.friendsCount", {
                    count: profileUser.friends?.length || 0,
                  })}
                </span>
                <span className="view-link">{t("profile.view")}</span>
              </li>
              {profileUser.bio && (
                <li className="bio-item">
                  <p>{profileUser.bio}</p>
                </li>
              )}
            </ul>
          </div>

          <div className="profile-card stats-card">
            <h3>{t("profile.headings.vitalSigns")}</h3>
            <div className="stats-mini-grid">
              <div className="stat-mini-item">
                <span className="stat-value">
                  {profileUser.pagination?.total ||
                    profileUser.posts?.length ||
                    0}
                </span>
                <span className="stat-label">{t("profile.labels.posts")}</span>
              </div>
              <div className="stat-mini-item">
                <span className="stat-value">0</span>
                <span className="stat-label">
                  {t("profile.labels.achievements")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="profile-main-content">
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === "posts" ? "active" : ""}`}
              onClick={() => setActiveTab("posts")}
            >
              <BookOpen size={16} />
              {t("profile.tabs.posts")}
            </button>
            {isOwnProfile && (
              <button
                className={`tab-btn ${activeTab === "saved" ? "active" : ""}`}
                onClick={() => setActiveTab("saved")}
              >
                <Bookmark size={16} />
                {t("profile.tabs.saved")}
              </button>
            )}
            <button
              className={`tab-btn ${activeTab === "friends" ? "active" : ""}`}
              onClick={() => setActiveTab("friends")}
            >
              <Users size={16} />
              {t("profile.tabs.friends")}
            </button>
            {isOwnProfile && (
              <button
                className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
                onClick={() => setActiveTab("settings")}
              >
                <SettingsIcon size={16} />
                {t("profile.tabs.settings")}
              </button>
            )}
          </div>

          <div className="profile-feed-container">
            {activeTab === "posts" && (
              <div className="posts-list">
                <h4 className="feed-title">
                  {t("profile.headings.publishedPosts")}
                </h4>
                {profileUser?.posts && profileUser.posts.length > 0 ? (
                  <>
                    <div className="posts-feed">
                      {profileUser.posts.map((post) => (
                        <PostCard
                          key={post._id}
                          post={post}
                          onPostUpdate={() => {}}
                          onOpenDetail={handlePostClick}
                        />
                      ))}
                    </div>
                    {profileUser.pagination &&
                      profileUser.pagination.hasMore && (
                        <button className="btn-horror-outline load-more-btn">
                          {t("profile.buttons.loadMore")}
                        </button>
                      )}
                  </>
                ) : (
                  <div className="empty-feed">
                    <BookOpen size={48} />
                    <p>{t("posts.noPostsRecorded")}</p>
                    <span>{t("profile.empty.postsDescription")}</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === "saved" && (
              <div className="saved-posts">
                <h4 className="feed-title">
                  {t("profile.headings.archivedSaved")}
                </h4>

                {savedPostsLoading && (
                  <div className="empty-feed">
                    <Bookmark size={48} />
                    <p>{t("common.loading")}</p>
                  </div>
                )}

                {!savedPostsLoading && savedPostsError && (
                  <div className="empty-feed">
                    <Bookmark size={48} />
                    <p>{savedPostsError}</p>
                  </div>
                )}

                {!savedPostsLoading && !savedPostsError && savedPosts.length === 0 && (
                  <div className="empty-feed">
                    <Bookmark size={48} />
                    <p>{t("profile.empty.noSavedContent")}</p>
                    <span>{t("profile.empty.onlyWardenArchive")}</span>
                  </div>
                )}

                {!savedPostsLoading && !savedPostsError && savedPosts.length > 0 && (
                  <div className="posts-feed">
                    {savedPosts.map((post) => (
                      <PostCard
                        key={post._id}
                        post={post}
                        onPostUpdate={handleSavedPostUpdate}
                        onOpenDetail={handlePostClick}
                        isSavedPostsPage={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "friends" && (
              <div className="friends-list">
                <h4 className="feed-title">
                  {t("profile.headings.accomplicesFriends")}
                </h4>
                <div className="empty-feed">
                  <Users size={48} />
                  <p>{t("profile.empty.noAccomplicesFound")}</p>
                  <span>{t("profile.empty.subjectWandersAlone")}</span>
                </div>
              </div>
            )}

            {activeTab === "settings" && isOwnProfile && (
              <div className="profile-settings-section">
                <h4 className="feed-title">
                  {t("profile.headings.accountPreferences")}
                </h4>
                <div className="settings-grid">
                  <div className="settings-group">
                    <label>
                      <UserCheck size={16} />{" "}
                      {t("profile.labels.profileDetails")}
                    </label>
                    <div className="profile-edit-form">
                      <div className="form-group">
                        <label>{t("profile.labels.displayName")}</label>
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) =>
                            setNewName(e.target.value.slice(0, 100))
                          }
                          className="horror-input"
                          placeholder={t("profile.placeholders.displayName")}
                          maxLength={100}
                        />
                        <span className="char-count">{newName.length}/100</span>
                      </div>

                      <div className="form-group">
                        <label>{t("profile.labels.bio")}</label>
                        <textarea
                          value={newBio}
                          onChange={(e) =>
                            setNewBio(e.target.value.slice(0, 500))
                          }
                          className="horror-input"
                          placeholder={t("profile.placeholders.bio")}
                          maxLength={500}
                          rows={3}
                        />
                        <span className="char-count">{newBio.length}/500</span>
                      </div>

                      <div className="form-group">
                        <label>{t("profile.labels.avatarUpload")}</label>
                        <div className="avatar-upload-section">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarFileChange}
                            className="file-input"
                            disabled={uploading}
                          />
                          <span className="file-info">
                            {t("profile.labels.supportedImageTypes")}
                          </span>

                          {avatarPreview && (
                            <div className="avatar-preview">
                              <img
                                src={avatarPreview}
                                alt={t("profile.labels.avatarPreview")}
                              />
                            </div>
                          )}

                          {avatarFile && (
                            <button
                              className="btn-horror-upload"
                              onClick={handleUploadAvatar}
                              disabled={uploading}
                            >
                              {uploading
                                ? t("profile.buttons.uploading")
                                : t("profile.buttons.uploadAvatar")}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>
                          {t("profile.labels.avatarUrlAlternative")}
                        </label>
                        <input
                          type="text"
                          value={newAvatar}
                          onChange={(e) => setNewAvatar(e.target.value)}
                          className="horror-input"
                          placeholder={t("profile.placeholders.avatarUrl")}
                        />
                        {newAvatar && !avatarFile && (
                          <div className="avatar-preview">
                            <img
                              src={newAvatar}
                              alt={t("profile.labels.avatarPreview")}
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          </div>
                        )}
                      </div>

                      <div className="form-actions">
                        <button
                          className="btn-horror"
                          onClick={handleUpdateProfile}
                          disabled={updating}
                        >
                          {updating
                            ? t("profile.buttons.saving")
                            : t("profile.buttons.saveChanges")}
                        </button>
                        <button
                          className="btn-horror-outline"
                          onClick={() => {
                            setNewName(profileUser.fullname);
                            setNewBio(profileUser.bio || "");
                            setNewAvatar(profileUser.avatar || "");
                          }}
                          disabled={updating}
                        >
                          {t("profile.buttons.cancel")}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="settings-group">
                    <label>
                      <Lock size={16} /> {t("profile.labels.security")}
                    </label>
                    <button
                      className="btn-horror-outline"
                      onClick={() => setShowChangePasswordModal(true)}
                    >
                      {t("profile.buttons.changePassword")}
                    </button>
                    <button
                      className="btn-horror-outline"
                      onClick={() => navigate("/forgot-password")}
                    >
                      {t("profile.buttons.forgotPassword")}
                    </button>
                  </div>

                  <div className="settings-group">
                    <label>
                      <Shield size={16} /> {t("profile.labels.privacy")}
                    </label>
                    <div className="setting-toggle">
                      <span>{t("profile.labels.showEmailToOthers")}</span>
                      <button
                        className={`toggle-btn ${profileUser.emailVisibility ? "on" : "off"}`}
                        onClick={toggleEmailVisibility}
                      >
                        {profileUser.emailVisibility
                          ? t("profile.status.enabled")
                          : t("profile.status.disabled")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Detail Modal */}
      <PostDetailModal
        show={showPostModal}
        onHide={handleClosePostModal}
        postId={selectedPostId}
        scrollToComments={scrollToComments}
      />

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={() => {
            console.log("Password changed successfully");
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;
