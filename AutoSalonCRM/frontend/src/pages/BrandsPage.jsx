import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCars } from '../store';
import { API_URL } from '../config';

const emptyForm = {
  id: null,
  brand_id: '',
  brand_name: '',
  model: '',
  year: '',
  price: '',
  equipment: '',
  photo_url: '',
};

export default function BrandsPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.cars);
  const { role, token } = useSelector((s) => s.auth);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    dispatch(fetchCars());
  }, [dispatch]);

  const filtered = items.filter((c) => {
    const text = `${c.brand_name || ''} ${c.model || ''}`.toLowerCase();
    return text.includes(filter.toLowerCase());
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (car) => {
    setForm({
      id: car.id,
      brand_id: car.brand_id,
      brand_name: car.brand_name,
      model: car.model,
      year: car.year,
      price: car.price,
      equipment: car.equipment || '',
      photo_url: car.photo_url || '',
    });
    setIsEditing(true);
    setError('');
  };

  const handleNew = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setError('');
  };

  const handleDelete = async (car) => {
    if (!window.confirm(`Ви впевнені, що хочете видалити ${car.brand_name} ${car.model}?`)) {
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}?resource=cars&id=${car.id}&token=${token}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error('Помилка видалення');
      }
      await dispatch(fetchCars());
    } catch (e) {
      setError('Не вдалося видалити авто (перевірте права адміністратора).');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.brand_id || !form.model || !form.year || !form.price) {
      setError('Заповніть марку (brand_id), модель, рік та ціну.');
      return;
    }

    const payload = {
      brand_id: Number(form.brand_id),
      model: form.model,
      year: Number(form.year),
      price: Number(form.price),
      equipment: form.equipment,
      photo_url: form.photo_url,
    };

    const isUpdate = !!form.id;
    const url = isUpdate
      ? `${API_URL}?resource=cars&id=${form.id}&token=${token}`
      : `${API_URL}?resource=cars&token=${token}`;

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

      await dispatch(fetchCars());
      if (!isUpdate) {
        setForm(emptyForm);
      }
      setIsEditing(false);
    } catch (e) {
      setError(
        'Не вдалося зберегти авто. Переконайтеся, що ви авторизовані як адміністратор і всі поля заповнені коректно.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Автопарк</h1>
      <p className="page-subtitle">
        Каталог усіх автомобілів автосалону з можливістю додавання, редагування і видалення (для адміністратора).
      </p>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Пошук по автопарку</div>
            <div className="card-meta">
              Поле нижче – приклад компонента з локальним state та подією onChange:
              змінює внутрішній стан <code>filter</code> і фільтрує список машин у режимі реального часу.
            </div>
          </div>
          <div className="badge">
            Загалом: {items.length} авто
          </div>
        </div>

        <div className="field" style={{ maxWidth: 320 }}>
          <label>Марка або модель</label>
          <input
            className="input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Наприклад, BMW або Model 3"
          />
        </div>
      </div>

      {role === 'admin' && (
        <div className="card" style={{ marginTop: 18 }}>
          <div className="card-header">
            <div>
              <div className="card-title">
                {form.id ? 'Редагування автомобіля' : 'Додавання нового автомобіля'}
              </div>
              <div className="card-meta">
                Вкажіть марку (ID з таблиці brands), модель, рік, ціну та опціонально фото/комплектацію.
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
              }}
            >
              <div className="field">
                <label>ID марки (brand_id)</label>
                <input
                  className="input"
                  type="number"
                  value={form.brand_id}
                  onChange={(e) => handleChange('brand_id', e.target.value)}
                  placeholder="Напр., 1 (Toyota)"
                />
              </div>
              <div className="field">
                <label>Модель</label>
                <input
                  className="input"
                  value={form.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="Напр., Corolla"
                />
              </div>
              <div className="field">
                <label>Рік</label>
                <input
                  className="input"
                  type="number"
                  value={form.year}
                  onChange={(e) => handleChange('year', e.target.value)}
                  placeholder="Напр., 2024"
                />
              </div>
              <div className="field">
                <label>Ціна ($)</label>
                <input
                  className="input"
                  type="number"
                  value={form.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  placeholder="Напр., 25000"
                />
              </div>
              <div className="field">
                <label>Посилання на фото</label>
                <input
                  className="input"
                  value={form.photo_url}
                  onChange={(e) => handleChange('photo_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: 8 }}>
              <label>Комплектація</label>
              <textarea
                className="textarea"
                value={form.equipment}
                onChange={(e) => handleChange('equipment', e.target.value)}
                rows={3}
                placeholder="Коротко опишіть комплектацію авто"
              />
            </div>

            <button
              type="submit"
              className="button"
              disabled={saving}
              style={{ marginTop: 4 }}
            >
              {saving ? 'Збереження...' : form.id ? 'Зберегти зміни' : 'Додати авто'}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-header">
          <div className="card-title">Список автомобілів</div>
          <div className="card-meta">
            {status === 'loading'
              ? 'Завантаження даних з сервера...'
              : `Показано: ${filtered.length} авто`}
          </div>
        </div>

        <div className="grid-cards">
          {filtered.map((car) => (
            <div key={car.id} className="card" style={{ padding: 14 }}>
              <div className="car-card-img">
                {car.photo_url ? (
                  <img src={car.photo_url} alt={car.model} />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: 150,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4b5563',
                      fontSize: 12,
                    }}
                  >
                    Немає фото
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>
                  {car.brand_name} {car.model}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                  Рік: {car.year}
                </div>
              </div>
              <div style={{ fontSize: 13, marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#6b7280',
                  }}
                >
                  Ціна:
                </span>{' '}
                <strong>{car.price} $</strong>
              </div>
              {car.equipment && (
                <div
                  style={{
                    fontSize: 12,
                    color: '#9ca3af',
                    marginBottom: 10,
                  }}
                >
                  {car.equipment}
                </div>
              )}

              {role === 'admin' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="button-ghost"
                    onClick={() => handleEdit(car)}
                  >
                    Редагувати
                  </button>
                  <button
                    className="button-danger"
                    onClick={() => handleDelete(car)}
                    disabled={saving}
                  >
                    Видалити
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}