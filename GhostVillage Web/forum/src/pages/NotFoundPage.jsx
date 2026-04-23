import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="text-center py-5">
      <h1 className="display-5 fw-bold">404</h1>
      <p className="lead">{t("errors.notFoundMessage")}</p>
      <Link to="/" className="btn btn-primary">
        {t("errors.goHome")}
      </Link>
    </div>
  );
}
