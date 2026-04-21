import { useState, useEffect } from "react";
import { Container, Row, Col, Spinner, Alert, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { Bookmark } from "lucide-react";
import PostCard from "../components/PostCard";
import api from "../../../shared/services/axios";
import "./SavedPostsPage.css";

const SavedPostsPage = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const fetchSavedPosts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/web/user/saved-posts");

      if (response.data.success) {
        setPosts(response.data.data.posts);
      }
    } catch (err) {
      console.error("Failed to fetch saved posts:", err);
      setError(err.response?.data?.message || t("posts.failedToLoadSaved"));
    } finally {
      setLoading(false);
    }
  };

  // Callback when post is unbookmarked
  const handlePostUpdate = (updatedPost) => {
    // Remove post from list if it was unbookmarked
    setPosts((prevPosts) =>
      prevPosts.filter((post) => post._id !== updatedPost._id),
    );
  };

  if (loading) {
    return (
      <div className="posts-page-wrapper">
        <Container className="posts-page py-4">
          <Row>
            <Col lg={8} className="mx-auto">
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-3">{t("common.loading")}</p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  if (error && !loading && posts.length === 0) {
    return (
      <div className="posts-page-wrapper">
        <Container className="posts-page py-4">
          <Row>
            <Col lg={8} className="mx-auto">
              <Alert variant="danger" className="text-center">
                <Alert.Heading>{t("common.error")}</Alert.Heading>
                <p>{error}</p>
                <Button
                  variant="outline-danger"
                  onClick={() => window.location.reload()}
                >
                  {t("common.retry")}
                </Button>
              </Alert>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="posts-page-wrapper">
      <Container className="posts-page py-4">
        <Row>
          <Col lg={8} className="mx-auto">
            <div className="posts-header">
              <h2 className="posts-title">
                <Bookmark size={28} />
                {t("navbar.saved")}
                <span className="primary-color-text fw-normal fs-6 ms-2">
                  ({posts.length})
                </span>
              </h2>
            </div>

            {error && !loading && posts.length > 0 && (
              <Alert variant="danger" className="text-center">
                {error}
              </Alert>
            )}

            {!loading && !error && posts.length === 0 && (
              <div className="no-posts text-center py-5">
                <Bookmark
                  size={64}
                  className="mb-3"
                  style={{ color: "var(--text-muted)" }}
                />
                <p className="primary-color-text mb-4">
                  {t("posts.savedPostsEmptyDescription")}
                </p>
              </div>
            )}

            {!loading && !error && posts.length > 0 && (
              <>
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onPostUpdate={handlePostUpdate}
                    isSavedPostsPage={true}
                  />
                ))}
              </>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SavedPostsPage;
