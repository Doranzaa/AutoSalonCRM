import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginThunk, registerThunk } from '../store';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ login: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, isAuthenticated } = useSelector((s) => s.auth);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.login || !form.password) return;

    try {
      if (mode === 'login') {
        await dispatch(loginThunk(form)).unwrap();
      } else {
        await dispatch(registerThunk(form)).unwrap();
      }
      navigate('/');
    } catch {}
  };

  return (
    <>
      <h1 className="page-title">Авторизація / Реєстрація</h1>
      <p className="page-subtitle">
        Якщо у вас вже є акаунт — увійдіть. Якщо ви вперше на сайті — зареєструйтесь.
      </p>

      <div className="card" style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            className={mode === 'login' ? 'button' : 'button-ghost'}
            onClick={() => setMode('login')}
          >
            Авторизація
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'button' : 'button-ghost'}
            onClick={() => setMode('register')}
          >
            Реєстрація
          </button>
        </div>

        {isAuthenticated && (
          <div
            style={{
              marginBottom: 10,
              fontSize: 12,
              color: '#bbf7d0',
              background: 'rgba(20,83,45,0.35)',
              borderRadius: 10,
              padding: '6px 10px',
              border: '1px solid rgba(74,222,128,0.45)',
            }}
          >
            Ви вже авторизовані.
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: 10,
              fontSize: 12,
              color: '#fecaca',
              background: 'rgba(127,29,29,0.55)',
              borderRadius: 10,
              padding: '6px 10px',
              border: '1px solid rgba(248,113,113,0.8)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Логін</label>
            <input
              className="input"
              value={form.login}
              onChange={(e) => handleChange('login', e.target.value)}
              placeholder="Введіть логін"
            />
          </div>

          <div className="field">
            <label>Пароль</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Введіть пароль"
            />
          </div>

          <button type="submit" className="button" disabled={status === 'loading'}>
            {status === 'loading'
              ? 'Зачекайте...'
              : mode === 'login'
              ? 'Увійти'
              : 'Зареєструватися'}
          </button>
        </form>
      </div>
    </>
  );
}