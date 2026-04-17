import { BrowserRouter, Routes, Route } from "react-router-dom";

import '@/App.css'

import HomePage from './pages/homepage';
import RegisterPage from './pages/registerpage';
import LoginPage from './pages/loginpage';
import ProfilePage from './pages/profilepage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}