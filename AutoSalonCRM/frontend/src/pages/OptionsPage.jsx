import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOptions } from '../store';
import { API_URL } from '../config';

const emptyForm = {
  id: null,
  name: '',
  price: '',
};

export default function OptionsPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.options);
  const { role, token } = useSelector((s) => s.auth);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    dispatch(fetchOptions());
  }, [dispatch]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNew = () => {
    setForm(emptyForm);
    setError('');
  };

  const handleEdit = (opt) => {
    setForm({
      id: opt.id,
      name: opt.name,
      price: opt.price,
    });
    setError('');
  };

  const handleDelete = async (opt) => {
    if (!window.confirm(`Видалити опцію "${opt.name}"?`)) return;

    try {
      setSaving(true);
      const res = await fetch(`${API_URL}?resource=options&id=${opt.id}&token=${token}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Помилка видалення');
      }

      await dispatch(fetchOptions());
      if (form.id === opt.id) {
        setForm(emptyForm);
      }
    } catch (e) {
      setError(
        'Не вдалося видалити опцію. Переконайтесь, що ви авторизовані як адміністратор.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name) {
      setError('Поле "Назва опції" є обовʼязковим.');
      return;
    }

    const payload = {
      name: form.name,
      price: form.price || '0',
    };

    const isUpdate = !!form.id;
    const url = isUpdate
      ? `${API_URL}?resource=options&id=${form.id}&token=${token}`
      : `${API_URL}?resource=options&token=${token}`;

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

      await dispatch(fetchOptions());
      if (!isUpdate) setForm(emptyForm);
    } catch (e) {
      setError(
        'Не вдалося зберегти опцію. Перевірте, що ви адміністратор і поля заповнені коректно.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Опції</h1>
      <p className="page-subtitle">
        Додаткові опції / пакети для автомобілів з ціною (доступно для редагування лише адміністратору).
      </p>

      {role === 'admin' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                {form.id ? 'Редагування опції' : 'Додавання нової опції'}
              </div>
              <div className="card-meta">
                Вкажіть назву опції та, за потреби, доплату у доларах.
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
                gridTemplateColumns: '2fr 1fr',
                gap: 12,
                maxWidth: 480,
              }}
            >
              <div className="field">
                <label>Назва опції *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Наприклад, Підігрів сидінь"
                />
              </div>
              <div className="field">
                <label>Ціна доплати ($)</label>
                <input
                  className="input"
                  type="number"
                  value={form.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder="Напр., 500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="button"
              disabled={saving}
              style={{ marginTop: 6 }}
            >
              {saving
                ? 'Збереження...'
                : form.id
                ? 'Зберегти зміни'
                : 'Додати опцію'}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-header">
          <div className="card-title">Список опцій</div>
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
                <th>Назва</th>
                <th>Ціна доплати ($)</th>
                {role === 'admin' && <th style={{ width: 140 }}>Дії</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.name}</td>
                  <td>{o.price}</td>
                  {role === 'admin' && (
                    <td>
                      <button
                        className="button-ghost"
                        onClick={() => handleEdit(o)}
                        style={{ marginRight: 6 }}
                      >
                        Редагувати
                      </button>
                      <button
                        className="button-danger"
                        onClick={() => handleDelete(o)}
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
                  <td
                    colSpan={role === 'admin' ? 4 : 3}
                    style={{ textAlign: 'center', color: '#6b7280' }}
                  >
                    Опцій поки немає.
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