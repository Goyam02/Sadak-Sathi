import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <Routes>
      {/* Landing page: splash screen + onboarding flow */}
      <Route path="/" element={<LandingPage />} />

      {/* Sign Up page */}
      <Route path="/signup" element={<SignupPage />} />

      {/* Dashboard redirects to /home */}
      <Route path="/dashboard" element={<Navigate to="/home" replace />} />

      {/* Dashboard pages (each with bottom nav via DashboardLayout) */}
      <Route path="/home" element={<HomePage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/profile" element={<ProfilePage />} />

      {/* Catch-all redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
