import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import WikiCard from "../components/WikiCard";
import "../../../shared/assets/styles/WikiPage.css";

const WikiListPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [wikis, setWikis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [featuredWikis, setFeaturedWikis] = useState([]);

  const category = searchParams.get("category") || "all";
  const page = parseInt(searchParams.get("page")) || 1;

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

  const categories = [
    { value: "all", label: t("wiki.categories.all") },
    { value: "Monster Database", label: t("wiki.categories.monster") },
    { value: "Map Guide", label: t("wiki.categories.map") },
    { value: "Item Database", label: t("wiki.categories.item") },
    { value: "Game Guide", label: t("wiki.categories.guide") },
    { value: "Tutorial", label: t("wiki.categories.tutorial") },
    { value: "Lore", label: t("wiki.categories.lore") },
    { value: "FAQ", label: t("wiki.categories.faq") },
  ];

  useEffect(() => {
    fetchWikis();
  }, [category, page]);

  useEffect(() => {
    fetchFeaturedWikis();
  }, []);

  const fetchWikis = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/web/wiki`, {
        params: { category, page, limit: 12 },
      });
      setWikis(response.data.data.wikis);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Error fetching wikis:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedWikis = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/web/wiki/featured`);
      setFeaturedWikis(response.data.data);
    } catch (error) {
      console.error("Error fetching featured wikis:", error);
    }
  };

  const handleCategoryChange = (newCategory) => {
    setSearchParams({ category: newCategory, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ category, page: newPage });
  };

  return (
    <div className="wiki-page">
      <div className="wiki-header">
        <h1>{t("wiki.title")}</h1>
        <p>{t("wiki.subtitle")}</p>
      </div>

      {/* Featured Wikis */}
      {featuredWikis.length > 0 && (
        <section className="featured-section">
          <h2>{t("wiki.featured")}</h2>
          <div className="featured-grid">
            {featuredWikis.map((wiki) => (
              <WikiCard key={wiki._id} wiki={wiki} featured />
            ))}
          </div>
        </section>
      )}

      {/* Category Filter */}
      <div className="category-filter">
        {categories.map((cat) => (
          <button
            key={cat.value}
            className={`category-btn ${category === cat.value ? "active" : ""}`}
            onClick={() => handleCategoryChange(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Wiki List */}
      <section className="wiki-list-section">
        {loading ? (
          <div className="loading">{t("wiki.loading")}</div>
        ) : wikis.length > 0 ? (
          <>
            <div className="wiki-grid">
              {wikis.map((wiki) => (
                <WikiCard key={wiki._id} wiki={wiki} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.total > pagination.limit && (
              <div className="pagination">
                <button
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  {t("wiki.pagination.prev")}
                </button>
                <span>
                  {t("wiki.pagination.pageStatus", {
                    page: pagination.page,
                    total: Math.ceil(pagination.total / pagination.limit),
                  })}
                </span>
                <button
                  disabled={!pagination.hasMore}
                  onClick={() => handlePageChange(page + 1)}
                >
                  {t("wiki.pagination.next")}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-results">{t("wiki.empty")}</div>
        )}
      </section>
    </div>
  );
};

export default WikiListPage;
