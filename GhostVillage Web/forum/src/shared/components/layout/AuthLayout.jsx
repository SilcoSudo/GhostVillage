import '../../assets/styles/theme.css';

const AuthLayout = ({ children }) => {
  return (
    <div className="app-container">
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;
