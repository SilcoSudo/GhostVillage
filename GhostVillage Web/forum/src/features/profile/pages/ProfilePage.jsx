import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  History,
  Users,
} from "lucide-react";
import "./ProfilePage.css";
import PostDetailModal from '../../posts/components/PostDetailModal';
import PostCard from '../../posts/components/PostCard';
import ChangePasswordModal from '../../../shared/components/modals/ChangePasswordModal';
import './ProfilePage.css';

const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("activity");
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
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const isOwnProfile = currentUser && (id ? currentUser._id === id : true);

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
          setError(response.data.message || "Subject not found");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(
          err.response?.data?.message || "Connection to database failed",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, currentUser, isOwnProfile]);

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
      alert("Failed to update name");
    }
  };

  const handleUpdateProfile = async () => {
    if (!newName.trim()) {
      alert("Name cannot be empty");
      return;
    }
    if (newName.length > 100) {
      alert("Name cannot exceed 100 characters");
      return;
    }
    if (newBio.length > 500) {
      alert("Bio cannot exceed 500 characters");
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
        alert("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert(err.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      alert("Only JPEG, PNG, and GIF images are allowed");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size cannot exceed 5MB");
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
      alert("Please select an image first");
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
        alert("Avatar uploaded successfully!");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.message || "Failed to upload avatar");
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
      alert("Failed to update visibility");
    }
  };

  const handlePostClick = (postId) => {
    setSelectedPostId(postId);
    setShowPostModal(true);
  };

  const handleClosePostModal = () => {
    setShowPostModal(false);
    setSelectedPostId(null);
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="horror-spinner"></div>
        <p>RETRACING FOOTAGE...</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="profile-error">
        <h2>404 - SUBJECT NOT FOUND</h2>
        <p>
          {error ||
            "The requested profile does not exist in the village records."}
        </p>
        <button onClick={() => navigate("/")} className="btn-horror">
          RETURN TO SAFETY
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
                  placeholder="Enter display name"
                  maxLength={100}
                />
                <button onClick={handleUpdateProfile} className="btn-horror-save" disabled={updating}>
                  {updating ? 'SAVING...' : 'SAVE'}
                </button>
                <button onClick={() => setIsEditingName(false)} className="btn-horror-cancel">
                  CANCEL
                </button>
              </div>
            ) : (
              <div className="name-display-group">
                <h1 className="profile-name">
                  {profileUser.fullname || 'Anonymous Subject'}
                </h1>
                {isOwnProfile && (
                  <Edit2 
                    size={20} 
                    className="edit-inline-icon" 
                    onClick={() => setIsEditingName(true)}
                    title="Edit display name"
                  />
                )}
              </div>
            )}
            <div className="profile-badges">
              {profileUser.role === "admin" && (
                <span className="badge admin-badge">WARDEN</span>
              )}
              <span className="badge rank-badge">EXPLORER</span>
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
            <h3>LOG DATA</h3>
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
                    title="Toggle Visibility"
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
                  Joined{" "}
                  {new Date(
                    profileUser.createdAt || Date.now(),
                  ).toLocaleDateString()}
                </span>
              </li>
              <li
                className="clickable-row"
                onClick={() => setActiveTab("friends")}
              >
                <Users size={16} />
                <span>Friends: {profileUser.friends?.length || 0}</span>
                <span className="view-link">VIEW</span>
              </li>
              {profileUser.bio && (
                <li className="bio-item">
                  <p>{profileUser.bio}</p>
                </li>
              )}
            </ul>
          </div>

          <div className="profile-card stats-card">
            <h3>VITAL SIGNS</h3>
            <div className="stats-mini-grid">
              <div className="stat-mini-item">
                <span className="stat-value">{profileUser.pagination?.total || profileUser.posts?.length || 0}</span>
                <span className="stat-label">POSTS</span>
              </div>
              <div className="stat-mini-item">
                <span className="stat-value">0</span>
                <span className="stat-label">ACHIEVEMENTS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="profile-main-content">
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === "activity" ? "active" : ""}`}
              onClick={() => setActiveTab("activity")}
            >
              <History size={16} />
              ACTIVITY
            </button>
            <button
              className={`tab-btn ${activeTab === "posts" ? "active" : ""}`}
              onClick={() => setActiveTab("posts")}
            >
              <BookOpen size={16} />
              POSTS
            </button>
            {isOwnProfile && (
              <button
                className={`tab-btn ${activeTab === "saved" ? "active" : ""}`}
                onClick={() => setActiveTab("saved")}
              >
                <Bookmark size={16} />
                SAVED
              </button>
            )}
            <button
              className={`tab-btn ${activeTab === "friends" ? "active" : ""}`}
              onClick={() => setActiveTab("friends")}
            >
              <Users size={16} />
              FRIENDS
            </button>
            {isOwnProfile && (
              <button
                className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
                onClick={() => setActiveTab("settings")}
              >
                <SettingsIcon size={16} />
                SETTINGS
              </button>
            )}
          </div>

          <div className="profile-feed-container">
            {activeTab === "activity" && (
              <div className="activity-history">
                <h4 className="feed-title">GAME MATCH HISTORY</h4>
                <div className="empty-feed">
                  <History size={48} />
                  <p>NO MATCH DATA FOUND</p>
                  <span>
                    The subject has not participated in any recorded matches.
                  </span>
                </div>
              </div>
            )}

            {activeTab === "posts" && (
              <div className="posts-list">
                <h4 className="feed-title">PUBLISHED POSTS</h4>
                {profileUser?.posts && profileUser.posts.length > 0 ? (
                  <>
                    <div className="posts-feed">
                      {profileUser.posts.map((post) => (
                        <PostCard 
                          key={post._id} 
                          post={post}
                          onPostUpdate={() => {}}
                        />
                      ))}
                    </div>
                    {profileUser.pagination && profileUser.pagination.hasMore && (
                      <button className="btn-horror-outline load-more-btn">
                        LOAD MORE
                      </button>
                    )}
                  </>
                ) : (
                  <div className="empty-feed">
                    <BookOpen size={48} />
                    <p>NO POSTS RECORDED</p>
                    <span>This folder is currently empty.</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === "saved" && (
              <div className="saved-posts">
                <h4 className="feed-title">ARCHIVED / SAVED</h4>
                <div className="empty-feed">
                  <Bookmark size={48} />
                  <p>NO SAVED CONTENT</p>
                  <span>Only the warden can see this archive.</span>
                </div>
              </div>
            )}

            {activeTab === "friends" && (
              <div className="friends-list">
                <h4 className="feed-title">ACCOMPLICES / FRIENDS</h4>
                <div className="empty-feed">
                  <Users size={48} />
                  <p>NO ACCOMPLICES FOUND</p>
                  <span>This subject wanders the village alone.</span>
                </div>
              </div>
            )}

            {activeTab === "settings" && isOwnProfile && (
              <div className="profile-settings-section">
                <h4 className="feed-title">ACCOUNT PREFERENCES</h4>
                <div className="settings-grid">
                  <div className="settings-group">
                    <label>
                      <UserCheck size={16} /> PROFILE DETAILS
                    </label>
                    <div className="profile-edit-form">
                      <div className="form-group">
                        <label>Display Name</label>
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) =>
                            setNewName(e.target.value.slice(0, 100))
                          }
                          className="horror-input"
                          placeholder="Enter display name"
                          maxLength={100}
                        />
                        <span className="char-count">{newName.length}/100</span>
                      </div>

                      <div className="form-group">
                        <label>Bio</label>
                        <textarea
                          value={newBio}
                          onChange={(e) =>
                            setNewBio(e.target.value.slice(0, 500))
                          }
                          className="horror-input"
                          placeholder="Enter bio (optional)"
                          maxLength={500}
                          rows={3}
                        />
                        <span className="char-count">{newBio.length}/500</span>
                      </div>

                      <div className="form-group">
                        <label>Avatar Upload</label>
                        <div className="avatar-upload-section">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarFileChange}
                            className="file-input"
                            disabled={uploading}
                          />
                          <span className="file-info">
                            Supported: JPEG, PNG, GIF (Max 5MB)
                          </span>

                          {avatarPreview && (
                            <div className="avatar-preview">
                              <img src={avatarPreview} alt="Avatar preview" />
                            </div>
                          )}

                          {avatarFile && (
                            <button
                              className="btn-horror-upload"
                              onClick={handleUploadAvatar}
                              disabled={uploading}
                            >
                              {uploading ? "UPLOADING..." : "UPLOAD AVATAR"}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Avatar URL (Alternative)</label>
                        <input
                          type="text"
                          value={newAvatar}
                          onChange={(e) => setNewAvatar(e.target.value)}
                          className="horror-input"
                          placeholder="Or enter image URL directly"
                        />
                        {newAvatar && !avatarFile && (
                          <div className="avatar-preview">
                            <img
                              src={newAvatar}
                              alt="Avatar preview"
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
                          {updating ? "SAVING..." : "SAVE CHANGES"}
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
                          CANCEL
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="settings-group">
                    <label><Lock size={16} /> SECURITY</label>
                    <button className="btn-horror-outline" onClick={() => setShowChangePasswordModal(true)}>
                      CHANGE PASSWORD
                    </button>
                    <button
                      className="btn-horror-outline"
                      onClick={() => navigate("/forgot-password")}
                    >
                      FORGOT PASSWORD?
                    </button>
                  </div>

                  <div className="settings-group">
                    <label>
                      <Shield size={16} /> PRIVACY
                    </label>
                    <div className="setting-toggle">
                      <span>Show email to others</span>
                      <button
                        className={`toggle-btn ${profileUser.emailVisibility ? "on" : "off"}`}
                        onClick={toggleEmailVisibility}
                      >
                        {profileUser.emailVisibility ? "ENABLED" : "DISABLED"}
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
      />

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={() => {
            console.log('Password changed successfully');
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;
