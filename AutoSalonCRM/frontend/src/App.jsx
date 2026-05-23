import React from 'react';
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
} from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './store';

import HomePage from './pages/HomePage';
import BrandsPage from './pages/BrandsPage';
import ClientsPage from './pages/ClientsPage';
import SalesPage from './pages/SalesPage';
import OptionsPage from './pages/OptionsPage';
import InquiryPage from './pages/InquiryPage';
import LoginPage from './pages/LoginPage';
import AdminInquiriesPage from './pages/AdminInquiriesPage';

function RolePill({ role }) {
  const map = {
    admin: 'Адміністратор',
    user: 'Користувач',
    guest: 'Гість',
  };
  const label = map[role] || role;
  const cls =
    role === 'admin'
      ? 'tag-pill tag-pill-admin'
      : role === 'user'
      ? 'tag-pill tag-pill-user'
      : 'tag-pill tag-pill-guest';
  return <span className={cls}>{label}</span>;
}

function AppShell() {
  const { isAuthenticated, login, role } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  const navLinkClass = ({ isActive }) =>
    'nav-link' + (isActive ? ' nav-link-active' : '');

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="logo-mark">AS</div>
            <div>
              <div className="logo-title">Автосалон</div>
              <div className="logo-name">AutoSpace CRM</div>
            </div>
          </div>

          <div className="app-nav">
            <NavLink to="/" className={navLinkClass} end>
              Головна
            </NavLink>
            <NavLink to="/brands" className={navLinkClass}>
              Машини
            </NavLink>
            <NavLink to="/clients" className={navLinkClass}>
              Клієнти
            </NavLink>
            <NavLink to="/sales" className={navLinkClass}>
              Продажі
            </NavLink>
            <NavLink to="/options" className={navLinkClass}>
              Опції
            </NavLink>
            {role !== 'guest' && (
              <NavLink to="/inquiry" className={navLinkClass}>
                Звернення
              </NavLink>
            )}
            {role === 'admin' && (
              <NavLink to="/admin-inquiries" className={navLinkClass}>
                Заявки
              </NavLink>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="user-chip">
              <div className="user-avatar">
                {isAuthenticated ? login?.[0]?.toUpperCase() || 'U' : 'G'}
              </div>
              <div className="user-meta">
                <span className="user-role">
                  <RolePill role={role} />
                </span>
                <span className="user-name">
                  {isAuthenticated ? login : 'Не авторизований'}
                </span>
              </div>
            </div>

            <NavLink to="/login">
              <button className="button-ghost">
                {isAuthenticated ? 'Обліковий запис' : 'Увійти'}
              </button>
            </NavLink>

            {isAuthenticated && (
              <button
                className="button-danger"
                onClick={() => dispatch(logout())}
              >
                Вихід
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/brands" element={<BrandsPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/options" element={<OptionsPage />} />
          <Route path="/inquiry" element={<InquiryPage />} />
          <Route path="/admin-inquiries" element={<AdminInquiriesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}