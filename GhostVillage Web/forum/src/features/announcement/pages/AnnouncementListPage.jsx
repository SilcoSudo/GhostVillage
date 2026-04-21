import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import AnnouncementCard from "../components/AnnouncementCard";
import "../../../shared/assets/styles/AnnouncementPage.css";

const AnnouncementListPage = () => {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  useEffect(() => {
    fetchAnnouncements();
  }, [page]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/web/announcement`, {
        params: { page, limit: 10 },
      });
      setAnnouncements(response.data.data.announcements);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  return (
    <div className="announcement-page">
      <div className="announcement-header">
        <h1>{t("announcements.title")}</h1>
        <p>{t("announcements.subtitle")}</p>
      </div>

      {loading ? (
        <div className="loading">{t("announcements.loading")}</div>
      ) : announcements.length > 0 ? (
        <>
          <div className="announcement-list">
            {announcements.map((announcement) => (
              <AnnouncementCard
                key={announcement._id}
                announcement={announcement}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.total > pagination.limit && (
            <div className="pagination">
              <button
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
              >
                {t("announcements.pagination.prev")}
              </button>
              <span>
                {t("announcements.pagination.pageStatus", {
                  page: pagination.page,
                  total: Math.ceil(pagination.total / pagination.limit),
                })}
              </span>
              <button
                disabled={!pagination.hasMore}
                onClick={() => handlePageChange(page + 1)}
              >
                {t("announcements.pagination.next")}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="no-results">{t("announcements.empty")}</div>
      )}
    </div>
  );
};

export default AnnouncementListPage;
