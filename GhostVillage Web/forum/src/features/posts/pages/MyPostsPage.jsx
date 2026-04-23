import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Col, Container, Row, Spinner } from "react-bootstrap";
import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/context/AuthContext";
import { useUserPosts } from "../hooks/usePosts";
import PostCard from "../components/PostCard";
import "./SavedPostsPage.css";

const PAGE_SIZE = 8;

const MyPostsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const [loadedPages, setLoadedPages] = useState({});

  const { data, isLoading, isFetching, isError, error } = useUserPosts(
    user?._id,
    {
      page,
      limit: PAGE_SIZE,
    },
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, navigate, user]);

  useEffect(() => {
    setPage(1);
    setLoadedPages({});
  }, [user?._id]);

  useEffect(() => {
    const fetchedPosts = data?.data?.posts;
    const responsePage = Number(data?.data?.pagination?.page);

    if (!Array.isArray(fetchedPosts) || responsePage !== Number(page)) {
      return;
    }

    setLoadedPages((prev) => ({
      ...prev,
      [responsePage]: fetchedPosts,
    }));
  }, [data, page]);

  const visiblePosts = useMemo(() => {
    return Object.keys(loadedPages)
      .map(Number)
      .sort((a, b) => a - b)
      .flatMap((pageNumber) => loadedPages[pageNumber] || []);
  }, [loadedPages]);

  const pagination = data?.data?.pagination;
  const totalPosts = pagination?.total ?? visiblePosts.length;
  const hasMore = Boolean(pagination?.hasMore);
  const isInitialLoading =
    authLoading || (isLoading && page === 1 && visiblePosts.length === 0);
  const isLoadingMore = isFetching && page > 1;
  const hasVisiblePosts = visiblePosts.length > 0;
  const pageErrorMessage =
    error?.response?.data?.message || error?.message || t("posts.myPostsError");

  if (isInitialLoading) {
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

  if (isError && !hasVisiblePosts) {
    return (
      <div className="posts-page-wrapper">
        <Container className="posts-page py-4">
          <Row>
            <Col lg={8} className="mx-auto">
              <Alert variant="danger" className="text-center">
                <Alert.Heading>{t("common.error")}</Alert.Heading>
                <p>{pageErrorMessage}</p>
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
                <FileText size={28} />
                {t("navbar.myPosts")}
                <span className="primary-color-text fw-normal fs-6 ms-2">
                  ({totalPosts})
                </span>
              </h2>
            </div>

            {isError && hasVisiblePosts && (
              <Alert variant="danger" className="text-center">
                {pageErrorMessage}
              </Alert>
            )}

            {hasVisiblePosts ? (
              <>
                {visiblePosts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </>
            ) : (
              <div className="no-posts text-center py-5">
                <FileText size={64} className="mb-3" />
                <p className="primary-color-text mb-4">
                  {t("posts.myPostsEmptyDescription")}
                </p>
              </div>
            )}

            {isLoadingMore ? (
              <div className="text-center mt-4">
                <Button variant="outline-primary" disabled>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {t("common.loading")}
                </Button>
              </div>
            ) : (
              hasMore && (
                <div className="text-center mt-4">
                  <Button
                    variant="outline-primary"
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={isFetching}
                  >
                    {t("common.loadMore")}
                  </Button>
                </div>
              )
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default MyPostsPage;
