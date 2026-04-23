import React, { useState, useEffect } from "react";
import { Container, Row, Col, Spinner, Alert, Button } from "react-bootstrap";
import { Plus, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { usePosts } from "../hooks/usePosts";
import { useAuth } from "../../../app/context/AuthContext";
import PostCard from "../components/PostCard";
import CreatePostModal from "../components/CreatePostModal";
import PostDetailModal from "../components/PostDetailModal";
import "./PostsPage.css";

const PostsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("General");
  const [showSharedPost, setShowSharedPost] = useState(false);
  const [sharedPostId, setSharedPostId] = useState(null);
  const [sharedScrollToComments, setSharedScrollToComments] = useState(false);

  // Check for postId in URL params
  useEffect(() => {
    const postId = searchParams.get("postId");
    if (postId) {
      setSharedPostId(postId);
      setSharedScrollToComments(searchParams.get("scrollToComments") === "1");
      setShowSharedPost(true);
    } else {
      setShowSharedPost(false);
      setSharedPostId(null);
      setSharedScrollToComments(false);
    }
  }, [searchParams]);

  const handleOpenSharedPost = (postId, shouldScrollComments = false) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set("postId", postId);

    if (shouldScrollComments) {
      nextSearchParams.set("scrollToComments", "1");
    } else {
      nextSearchParams.delete("scrollToComments");
    }

    setSearchParams(nextSearchParams);
  };

  const handleCloseSharedPost = () => {
    setShowSharedPost(false);
    setSharedPostId(null);
    setSharedScrollToComments(false);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("postId");
    nextSearchParams.delete("scrollToComments");
    setSearchParams(nextSearchParams);
  };

  const { data, isLoading, isError, error } = usePosts({
    page,
    limit: 10,
    category: selectedCategory,
  });

  const posts = data?.data?.posts || [];
  const hasMore = data?.data?.pagination?.hasMore || false;

  const categories = [
    { key: "General", label: t("posts.categories.general") },
    { key: "Discussion", label: t("posts.categories.discussion") },
    { key: "Trading", label: t("posts.categories.trading") },
    { key: "Team Up", label: t("posts.categories.teamUp") },
    { key: "Bug Report", label: t("posts.categories.bugReport") },
  ];

  if (isLoading && page === 1) {
    return (
      <div className="posts-page-wrapper">
        <Container className="posts-page py-4">
          <div className="loading-container">
            <div className="blood-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <p className="loading-text">{t("common.loading")}</p>
          </div>
        </Container>
      </div>
    );
  }

  if (isError) {
    return (
      <Container className="posts-page py-4">
        <Alert variant="danger">
          <Alert.Heading>{t("common.error")}</Alert.Heading>
          <p>{error?.message || t("posts.failedToLoadPosts")}</p>
          <Button
            variant="outline-danger"
            onClick={() => window.location.reload()}
          >
            {t("common.retry")}
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="posts-page-wrapper">
      <Container className="posts-page py-4">
        <Row>
          <Col lg={8} className="mx-auto">
            {/* Category Tabs */}
            <div className="category-tabs mb-4">
              <div className="d-flex gap-2 flex-wrap justify-content-between">
                {categories.map((category) => (
                  <Button
                    key={category.key}
                    variant={
                      selectedCategory === category.key
                        ? "primary"
                        : "outline-secondary"
                    }
                    className="category-tab-btn flex-fill"
                    onClick={() => {
                      setSelectedCategory(category.key);
                      setPage(1);
                    }}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Posts List */}
            {posts.length === 0 ? (
              <div className="no-posts text-center py-5">
                <div className="empty-feed">
                  <FileText size={48} />
                  <p>{t("posts.noPostsRecorded")}</p>
                  <span>{t("posts.noPosts")}</span>
                </div>
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onOpenDetail={handleOpenSharedPost}
                  />
                ))}

                {/* Load More */}
                {hasMore && (
                  <div className="text-center mt-4">
                    <Button
                      variant="outline-primary"
                      className="load-more-btn"
                      onClick={() => setPage((prev) => prev + 1)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="mini-blood-spinner">
                            <div className="mini-ring"></div>
                          </div>
                          <span className="ms-2">{t("common.loading")}</span>
                        </>
                      ) : (
                        t("common.loadMore")
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>

      {/* Floating Action Button */}
      {user && (
        <button
          className="floating-create-btn"
          onClick={() => setShowCreateModal(true)}
          aria-label={t("posts.createPost")}
        >
          <Plus size={24} />
        </button>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
        />
      )}

      {/* Shared Post Detail Modal */}
      {showSharedPost && sharedPostId && (
        <PostDetailModal
          show={showSharedPost}
          onHide={handleCloseSharedPost}
          postId={sharedPostId}
          scrollToComments={sharedScrollToComments}
        />
      )}
    </div>
  );
};

export default PostsPage;
