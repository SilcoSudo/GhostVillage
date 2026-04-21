import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/context/AuthContext";
import { Spinner } from "react-bootstrap";
import "./Auth.css";

const OAuthCallbackPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      if (error) {
        // Redirect to login with error message
        navigate(`/login?error=${error}`);
        return;
      }

      if (!token) {
        navigate("/login?error=no_token");
        return;
      }

      try {
        // Fetch user info
        const response = await fetch("http://localhost:5000/api/web/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSession(token, data.user);

          // Remember OAuth login (30 days)
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          localStorage.setItem("rememberMeExpiry", expiryDate.toISOString());

          // Redirect to home
          navigate("/");
        } else {
          throw new Error("Failed to fetch user info");
        }
      } catch (error) {
        console.error("OAuth callback error:", error);
        navigate("/login?error=auth_failed");
      }
    };

    handleCallback();
  }, [searchParams, navigate, setSession]);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="text-center py-5">
          <Spinner
            animation="border"
            variant="light"
            style={{ width: "3rem", height: "3rem" }}
          />
          <p className="mt-3 text-light">
            {t("auth.oauthCallbackPage.loading")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
