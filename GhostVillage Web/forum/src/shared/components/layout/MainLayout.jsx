import Header from './Header';
import SidebarNav from './SidebarNav';
import '../../assets/styles/theme.css';

const MainLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Header />
      <div className="app-layout">
        <SidebarNav />
        <main className="main-content with-sidebar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
