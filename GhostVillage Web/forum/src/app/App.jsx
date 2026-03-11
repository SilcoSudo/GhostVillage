import { useContext } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { FriendSidebarProvider } from "./context/FriendSidebarContext";
import { ChatProvider } from "./context/ChatContext.jsx";
import Header from "../shared/components/layout/Header";
import SidebarNav from "../shared/components/layout/SidebarNav";
import FriendSidebar from "../shared/components/layout/FriendSidebar";
import MainLayout from "../shared/components/layout/MainLayout";
import AuthLayout from "../shared/components/layout/AuthLayout";
import NotificationListener from "../features/notification/components/NotificationListener";
import ChatModal from "../features/chat/ChatModal";
import LoginPage from "../features/auth/pages/LoginPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import RegistrationSuccessPage from "../features/auth/pages/RegistrationSuccessPage";
import VerifyEmailPage from "../features/auth/pages/VerifyEmailPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";
import ProfilePage from "../features/profile/pages/ProfilePage";
import OAuthCallbackPage from "../features/auth/pages/OAuthCallbackPage";
import CompleteProfilePage from "../features/auth/pages/CompleteProfilePage";
import HomePage from "../pages/HomePage";
import PostsPage from "../features/posts/pages/PostsPage";
import SavedPostsPage from "../features/posts/pages/SavedPostsPage";
import WikiListPage from "../features/wiki/pages/WikiListPage";
import WikiDetailPage from "../features/wiki/pages/WikiDetailPage";
import AnnouncementListPage from "../features/announcement/pages/AnnouncementListPage";
import AnnouncementDetailPage from "../features/announcement/pages/AnnouncementDetailPage";
import SearchPage from "../features/search/pages/SearchPage";
import SupportTicketPage from "../features/support/pages/SupportTicketPage";
import "../shared/assets/styles/theme.css";

function AppContent() {
  const { token } = useContext(AuthContext);
  const location = useLocation();

  // Các trang không hiển thị Header và Sidebar
  const authPages = [
    "/login",
    "/register",
    "/registration-success",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
    "/complete-profile",
  ];
  const showLayout = !authPages.includes(location.pathname);

  return (
    <div className="app-container">
      <NotificationListener token={token} />
      <ChatModal />
      {showLayout && <Header />}
      <div className="app-layout">
        {showLayout && <SidebarNav />}
        <main className={`main-content ${showLayout ? "with-sidebar" : ""}`}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/registration-success"
              element={<RegistrationSuccessPage />}
            />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
            <Route path="/auth/callback" element={<OAuthCallbackPage />} />
            <Route path="/complete-profile" element={<CompleteProfilePage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/posts" element={<PostsPage />} />
            <Route path="/saved-posts" element={<SavedPostsPage />} />
            <Route path="/support/ticket" element={<SupportTicketPage />} />
            <Route path="/wiki" element={<WikiListPage />} />
            <Route path="/wiki/:slug" element={<WikiDetailPage />} />
            <Route path="/announcements" element={<AnnouncementListPage />} />
            <Route
              path="/announcements/:slug"
              element={<AnnouncementDetailPage />}
            />
            <Route path="/search" element={<SearchPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        {showLayout && <FriendSidebar />}
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FriendSidebarProvider>
          <ChatProvider>
            <AppContent />
          </ChatProvider>
        </FriendSidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
