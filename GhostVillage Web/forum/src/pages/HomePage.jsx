import React, { useContext } from 'react';
import { Download, Play, ArrowRight, Calendar, Users, Trophy } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { AuthContext } from '../app/context/AuthContext';
import langmaLogo from '../shared/assets/images/logo.png';
import '../shared/assets/styles/HomePage.css';

const HomePage = () => {
  const { user } = useContext(AuthContext);

  const handleDownloadGame = () => {
    alert('Game download coming soon!');
  };

  const handlePlayGame = () => {
    window.location.href = '/game';
  };

  return (
    <div className="home-page">
      {/* Hero Section - Large Banner */}
      <section className="hero-banner">
        <div className="hero-overlay"></div>
        <div className="hero-content-wrapper">
          <div className="hero-text-content">
            <img src={langmaLogo} alt="Ghost Village" className="hero-logo" />
            <p className="hero-tagline">
              KHÁM PHÁ THẾ GIỚI MA QUÁI - PHIÊU LƯU CÙNG ĐỒNG ĐỘI<br />
              VÀO LÀNG MA ĐẦY BÍ ẨN VÀ THÁCH THỨC
            </p>
            <button className="hero-cta-button" onClick={handlePlayGame}>
              CHƠI MIỄN PHÍ
            </button>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="news-section">
        <div className="section-container">
          <h2 className="section-title">TIN TỨC NỔI BẬT</h2>
        </div>
          
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          breakpoints={{
            768: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 30,
            },
          }}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          className="news-carousel"
        >
            <SwiperSlide>
              <div className="news-card">
                <div className="news-image">
                  <div className="news-placeholder">📰</div>
                </div>
                <div className="news-content">
                  <span className="news-category">CẬP NHẬT</span>
                  <h3 className="news-title">Phiên Bản Mới Ra Mắt</h3>
                  <p className="news-excerpt">Khám phá những tính năng mới và cải tiến trong bản cập nhật lớn nhất năm</p>
                </div>
              </div>
            </SwiperSlide>

            <SwiperSlide>
              <div className="news-card">
                <div className="news-image">
                  <div className="news-placeholder">🎮</div>
                </div>
                <div className="news-content">
                  <span className="news-category">SỰ KIỆN</span>
                  <h3 className="news-title">Phát hành lần đầu tiên</h3>
                  <p className="news-excerpt">Đăng ký tham gia ngay để nhận quà tặng bạn mới nào!</p>
                </div>
              </div>
            </SwiperSlide>

            <SwiperSlide>
              <div className="news-card">
                <div className="news-image">
                  <div className="news-placeholder">⚔️</div>
                </div>
                <div className="news-content">
                  <span className="news-category">HƯỚNG DẪN</span>
                  <h3 className="news-title">Chiến Thuật Sinh Tồn</h3>
                  <p className="news-excerpt">Học hỏi từ những game thủ hàng đầu để nâng cao kỹ năng</p>
                </div>
              </div>
            </SwiperSlide>
          </Swiper>
      </section>

      {/* Character Showcase Section */}
      <section className="character-section">
        <div className="character-content">
          <div className="character-info">
            <span className="character-label">NHÂN VẬT MỚI</span>
            <h2 className="character-name">Ông Kẹ</h2>
            <p className="character-description">
              Chủ nhân sức mạnh hắc ám với khả năng triệu hồi linh hồn.<br />
              Làm chủ nghệ thuật ma pháp và thống trị chiến trường.
            </p>
            <div className="character-actions">
              <button className="btn-explore">
                KHÁM PHÁ NHÂN VẬT
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
          <div className="character-image">
            <div className="character-placeholder">👤</div>
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section className="modes-section">
        <div className="section-container">
          <h2 className="section-title">CHẾ ĐỘ CHƠI ĐA DẠNG</h2>
          
          <div className="modes-grid">
            <div className="mode-card">
              <div className="mode-icon">
                <Users size={48} />
              </div>
              <h3 className="mode-name">PvP Arena</h3>
              <p className="mode-description">Đối đầu với người chơi khác trong trận chiến gay cấn</p>
              <button className="mode-button">CHƠI NGAY</button>
            </div>

            <div className="mode-card">
              <div className="mode-icon">
                <Trophy size={48} />
              </div>
              <h3 className="mode-name">Ranked</h3>
              <p className="mode-description">Leo rank và chứng tỏ bạn là người mạnh nhất</p>
              <button className="mode-button">CHƠI NGAY</button>
            </div>

            <div className="mode-card">
              <div className="mode-icon">
                <Calendar size={48} />
              </div>
              <h3 className="mode-name">Event</h3>
              <p className="mode-description">Tham gia sự kiện đặc biệt với phần thưởng độc quyền</p>
              <button className="mode-button">CHƠI NGAY</button>
            </div>
          </div>
        </div>
      </section>

      {/* Download CTA Section */}
      <section className="download-section">
        <div className="download-content">
          <h2 className="download-title">TẢI GAME VÀ BẮT ĐẦU PHIÊU LƯU</h2>
          <p className="download-subtitle">
            Tham gia cùng hàng triệu game thủ trên toàn thế giới
          </p>
          <button className="download-button" onClick={handleDownloadGame}>
            <Download size={24} />
            TẢI GAME NGAY
          </button>
        </div>
      </section>

      {/* Community Stats */}
      <section className="stats-section">
        <div className="section-container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">1M+</div>
              <div className="stat-label">Người Chơi</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">50K+</div>
              <div className="stat-label">Trận Đấu/Ngày</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">100+</div>
              <div className="stat-label">Nhân Vật</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">24/7</div>
              <div className="stat-label">Hỗ Trợ</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
