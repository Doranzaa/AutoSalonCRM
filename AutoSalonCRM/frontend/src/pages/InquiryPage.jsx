import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { API_URL } from '../config';

export default function InquiryPage() {
  const { role, token, login } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    fullname: login || '',
    phone: '',
    message: '',
  });

  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  if (role === 'guest') {
    return (
      <>
        <h1 className="page-title">Звернення</h1>
        <p className="page-subtitle">
          Щоб залишити звернення, спочатку увійдіть або зареєструйтесь.
        </p>
      </>
    );
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');

    if (!form.fullname || !form.message) {
      setMsg('Заповніть ПІБ і повідомлення.');
      return;
    }

    try {
      setSending(true);
      const res = await fetch(`${API_URL}?resource=inquiries&token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Помилка');

      setForm({
        fullname: login || '',
        phone: '',
        message: '',
      });
      setMsg('Звернення відправлено.');
    } catch {
      setMsg('Не вдалося відправити звернення.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Звернення до автосалону</h1>
      <p className="page-subtitle">
        Ваше звернення буде записано в базу даних і доступне адміністратору.
      </p>

      <div className="card" style={{ maxWidth: 520 }}>
        {msg && (
          <div
            style={{
              marginBottom: 10,
              fontSize: 12,
              color: '#e5e7eb',
              background: 'rgba(30,41,59,0.55)',
              borderRadius: 10,
              padding: '6px 10px',
              border: '1px solid rgba(148,163,184,0.4)',
            }}
          >
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>ПІБ</label>
            <input
              className="input"
              value={form.fullname}
              onChange={(e) => handleChange('fullname', e.target.value)}
            />
          </div>

          <div className="field">
            <label>Телефон</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+380..."
            />
          </div>

          <div className="field">
            <label>Повідомлення</label>
            <textarea
              className="textarea"
              rows={4}
              value={form.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Напишіть звернення..."
            />
          </div>

          <button type="submit" className="button" disabled={sending}>
            {sending ? 'Відправлення...' : 'Відправити'}
          </button>
        </form>
      </div>
    </>
  );
}