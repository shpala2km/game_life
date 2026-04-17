import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '@/pages/profilepage.css';
import Navbar from '@/modules/Navbar';

const API_URL = 'http://127.0.0.1:8000/api';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<string | null>(
    localStorage.getItem('username')
  );

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('access_token'));

  // Axios с токеном
  const api = axios.create({ baseURL: API_URL });
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Загрузка данных пользователя при открытии страницы
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const savedEmail = localStorage.getItem('user_email'); // будем сохранять при регистрации
    setFormData({
      username: currentUser || '',
      email: savedEmail || '',
      newPassword: '',
      confirmNewPassword: '',
    });
  }, [isLoggedIn, currentUser, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setMessage(null);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setMessage(null);

  try {
    const updateData: any = {};

    if (formData.email && formData.email !== localStorage.getItem('user_email')) {
      updateData.email = formData.email;
    }

    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmNewPassword) {
        setMessage({ type: 'error', text: 'Новые пароли не совпадают' });
        setLoading(false);
        return;
      }
      if (formData.newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Новый пароль должен содержать минимум 6 символов' });
        setLoading(false);
        return;
      }
      updateData.new_password = formData.newPassword;
    }

    if (Object.keys(updateData).length === 0) {
      setMessage({ type: 'error', text: 'Ничего не изменено' });
      setLoading(false);
      return;
    }

    const response = await api.put('/auth/profile/update/', updateData);

    if (formData.email) {
      localStorage.setItem('user_email', formData.email);
    }

    setMessage({ type: 'success', text: 'Профиль успешно обновлён!' });

    setFormData(prev => ({
      ...prev,
      newPassword: '',
      confirmNewPassword: '',
    }));

  } catch (err: any) {
    setMessage({
      type: 'error',
      text: err.response?.data?.error || err.response?.data?.detail || 'Ошибка при обновлении'
    });
  } finally {
    setLoading(false);
  }
};

  const handleLogout = () => {
    localStorage.clear(); // очищаем всё
    navigate('/login');
  };

  if (!isLoggedIn) {
    return <div>Перенаправление...</div>;
  }

  return (
    <div className="app">
      <Navbar />
      <div className="profile-container">
        <div className="profile-card">
          <h1>Профиль пользователя</h1>
          <p className="profile-subtitle">Управление аккаунтом</p>

          <form onSubmit={handleUpdateProfile} className="profile-form">
            <div className="form-group">
              <label>Имя пользователя</label>
              <input
                type="text"
                value={formData.username}
                disabled
                className="input-disabled"
              />
            </div>

            <div className="form-group">
              <label>Электронная почта</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@mail.com"
              />
            </div>

            <hr className="divider" />

            <h3>Изменить пароль</h3>

            <div className="form-group">
              <label>Новый пароль</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Введите новый пароль"
              />
            </div>

            <div className="form-group">
              <label>Подтверждение нового пароля</label>
              <input
                type="password"
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                onChange={handleChange}
                placeholder="Повторите новый пароль"
              />
            </div>

            {message && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </form>

          <div className="profile-actions">
            <button onClick={handleLogout} className="logout-btn-full">
              Выйти из аккаунта
            </button>
            <button onClick={() => navigate('/')} className="back-btn">
              ← Вернуться в игру
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;