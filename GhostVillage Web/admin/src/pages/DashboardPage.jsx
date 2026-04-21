import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users,
  FileText,
  MessageSquare,
  AlertCircle,
  Ticket,
  Megaphone,
  BookOpen,
  Activity,
  Package,
} from "lucide-react";
import "./assets/styles/DashboardPage.css";

const DashboardPage = () => {
  const { t } = useTranslation();

  const dashboardItems = [
    {
      id: "profile",
      titleKey: "dashboard.profile",
      descKey: "dashboard.manageProfiles",
      icon: Users,
      link: "/profile",
      color: "blue",
    },
    {
      id: "user-list",
      titleKey: "dashboard.userList",
      descKey: "dashboard.viewAllUsers",
      icon: Users,
      link: "/users",
      color: "green",
    },
    {
      id: "reported-posts",
      titleKey: "dashboard.reportedPosts",
      descKey: "dashboard.reviewPosts",
      icon: AlertCircle,
      link: "/reports/posts",
      color: "orange",
    },
    {
      id: "reported-comments",
      titleKey: "dashboard.reportedComments",
      descKey: "dashboard.reviewComments",
      icon: MessageSquare,
      link: "/reports/comments",
      color: "red",
    },
    {
      id: "support-tickets",
      titleKey: "dashboard.supportTickets",
      descKey: "dashboard.manageTickets",
      icon: Ticket,
      link: "/support-tickets",
      color: "purple",
    },
    {
      id: "announcements",
      titleKey: "dashboard.announcements",
      descKey: "dashboard.createAnnouncements",
      icon: Megaphone,
      link: "/announcements",
      color: "yellow",
    },
    {
      id: "wiki",
      titleKey: "dashboard.wiki",
      descKey: "dashboard.manageWiki",
      icon: BookOpen,
      link: "/wiki",
      color: "cyan",
    },
    {
      id: "activity-log",
      titleKey: "dashboard.activityLog",
      descKey: "dashboard.viewActivities",
      icon: Activity,
      link: "/activity-log",
      color: "gray",
    },
    {
      id: "game-version",
      titleKey: "dashboard.gameVersion",
      descKey: "dashboard.manageVersions",
      icon: Package,
      link: "/game-versions",
      color: "indigo",
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>{t("dashboard.title")}</h1>
        <p>{t("dashboard.subtitle")}</p>
      </div>

      <div className="dashboard-grid">
        {dashboardItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.link}
              className={`dashboard-card dashboard-card-${item.color}`}
            >
              <div className="card-icon-wrapper">
                <Icon size={32} className="card-icon" />
              </div>
              <h3 className="card-title">{t(item.titleKey)}</h3>
              <p className="card-description">{t(item.descKey)}</p>
              <div className="card-arrow">→</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardPage;
