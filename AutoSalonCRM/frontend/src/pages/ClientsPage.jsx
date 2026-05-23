import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClients } from '../store';
import { API_URL } from '../config';

const emptyForm = {
  id: null,
  fullname: '',
  phone: '',
  email: '',
};

export default function ClientsPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.clients);
  const { role, token } = useSelector((s) => s.auth);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNew = () => {
    setForm(emptyForm);
    setError('');
  };

  const handleEdit = (client) => {
    setForm({
      id: client.id,
      fullname: client.fullname,
      phone: client.phone || '',
      email: client.email || '',
    });
    setError('');
  };

  const handleDelete = async (client) => {
    if (
      !window.confirm(
        `Ви впевнені, що хочете видалити клієнта "${client.fullname}"?`
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API_URL}?resource=clients&id=${client.id}&token=${token}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Помилка видалення');
      }

      await dispatch(fetchClients());
      if (form.id === client.id) {
        setForm(emptyForm);
      }
    } catch (e) {
      setError(
        'Не вдалося видалити клієнта. Переконайтесь, що ви авторизовані як адміністратор.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.fullname) {
      setError('Поле "ПІБ" є обовʼязковим.');
      return;
    }

    const payload = {
      fullname: form.fullname,
      phone: form.phone,
      email: form.email,
    };

    const isUpdate = !!form.id;
    const url = isUpdate
      ? `${API_URL}?resource=clients&id=${form.id}&token=${token}`
      : `${API_URL}?resource=clients&token=${token}`;

    try {
      setSaving(true);
      const res = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Помилка збереження');
      }

      await dispatch(fetchClients());
      if (!isUpdate) setForm(emptyForm);
    } catch (e) {
      setError(
        'Не вдалося зберегти дані клієнта. Перевірте, що ви адміністратор, і поля заповнені коректно.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Клієнти</h1>
      <p className="page-subtitle">
        База клієнтів автосалону з контактними даними та можливістю керування
        записами (для адміністратора).
      </p>

      {role === 'admin' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                {form.id ? 'Редагування клієнта' : 'Додавання нового клієнта'}
              </div>
              <div className="card-meta">
                Вкажіть ПІБ та, за бажання, телефон і Email клієнта.
              </div>
            </div>
            <button className="button-ghost" onClick={handleNew}>
              Очистити форму
            </button>
          </div>

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
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              <div className="field">
                <label>ПІБ *</label>
                <input
                  className="input"
                  value={form.fullname}
                  onChange={(e) => handleChange('fullname', e.target.value)}
                  placeholder="Наприклад, Іван Іванов"
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
                <label>Email</label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="client@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              className="button"
              disabled={saving}
              style={{ marginTop: 4 }}
            >
              {saving
                ? 'Збереження...'
                : form.id
                ? 'Зберегти зміни'
                : 'Додати клієнта'}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-header">
          <div className="card-title">Список клієнтів</div>
          <div className="card-meta">
            {status === 'loading'
              ? 'Завантаження даних...'
              : `Загальна кількість: ${items.length}`}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ПІБ</th>
                <th>Телефон</th>
                <th>Email</th>
                {role === 'admin' && <th style={{ width: 140 }}>Дії</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((cl) => (
                <tr key={cl.id}>
                  <td>{cl.id}</td>
                  <td>{cl.fullname}</td>
                  <td>{cl.phone}</td>
                  <td>{cl.email}</td>
                  {role === 'admin' && (
                    <td>
                      <button
                        className="button-ghost"
                        onClick={() => handleEdit(cl)}
                        style={{ marginRight: 6 }}
                      >
                        Редагувати
                      </button>
                      <button
                        className="button-danger"
                        onClick={() => handleDelete(cl)}
                        disabled={saving}
                      >
                        Видалити
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {items.length === 0 && status === 'succeeded' && (
                <tr>
                  <td colSpan={role === 'admin' ? 5 : 4} style={{ textAlign: 'center', color: '#6b7280' }}>
                    Клієнтів поки немає.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}