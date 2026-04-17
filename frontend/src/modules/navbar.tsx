import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './navbar.css';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('access_token');
  const username = localStorage.getItem('username');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('user_email');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="nav-logo">
            Conway's Game of Life
          </Link>
        </div>

        <div className="navbar-right">
          <Link to="/" className="nav-btn home-btn">
            🏠 Главная
          </Link>

          {isLoggedIn ? (
            <>
              <Link to="/profile" className="nav-btn profile-btn">
                👤 {username || 'Профиль'}
              </Link>
              <button onClick={handleLogout} className="nav-btn logout-btn">
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-btn login-btn">
                Войти
              </Link>
              <Link to="/register" className="nav-btn register-btn">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;