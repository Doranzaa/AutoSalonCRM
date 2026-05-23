import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSales, fetchCars, fetchClients, fetchOptions } from '../store';
import { API_URL } from '../config';

const emptyForm = {
  id: null,
  car_id: '',
  client_id: '',
  sale_date: '',
  base_price: '',
  options_ids: [],
  options_price: '',
  total_price: '',
};

export default function SalesPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.sales);
  const carsState = useSelector((s) => s.cars);
  const clientsState = useSelector((s) => s.clients);
  const optionsState = useSelector((s) => s.options);
  const { role, token } = useSelector((s) => s.auth);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    dispatch(fetchSales());
    dispatch(fetchCars());
    dispatch(fetchClients());
    dispatch(fetchOptions());
  }, [dispatch]);

  const sumOptionsPrice = useMemo(() => {
    const selectedIds = new Set(form.options_ids.map((id) => String(id)));
    return optionsState.items
      .filter((o) => selectedIds.has(String(o.id)))
      .reduce((acc, o) => acc + Number(o.price || 0), 0);
  }, [form.options_ids, optionsState.items]);

  const basePriceNumber = Number(form.base_price || 0);
  const optionsPriceNumber =
    form.options_price !== ''
      ? Number(form.options_price)
      : sumOptionsPrice;

  const totalPriceNumber =
    form.total_price !== ''
      ? Number(form.total_price)
      : basePriceNumber + optionsPriceNumber;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOptionsChange = (e) => {
    const selected = Array.from(
      e.target.selectedOptions,
      (opt) => opt.value
    );
    setForm((prev) => ({ ...prev, options_ids: selected }));
  };

  const handleNew = () => {
    setForm(emptyForm);
    setError('');
  };

  const handleEdit = (sale) => {
    setForm({
      id: sale.id,
      car_id: sale.car_id,
      client_id: sale.client_id,
      sale_date: sale.sale_date,
      base_price: sale.base_price,
      options_ids: [],
      options_price: sale.options_price,
      total_price: sale.total_price,
    });
    setError('');
  };

  const handleDelete = async (sale) => {
    if (!window.confirm(`Видалити продаж ID ${sale.id}?`)) return;

    try {
      setSaving(true);
      const res = await fetch(`${API_URL}?resource=sales&id=${sale.id}&token=${token}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Помилка видалення');
      await dispatch(fetchSales());
      if (form.id === sale.id) setForm(emptyForm);
    } catch (e) {
      setError('Не вдалося видалити продаж. Переконайтесь, що ви адміністратор.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.car_id || !form.client_id || !form.sale_date || !basePriceNumber) {
      setError('Виберіть авто, клієнта, дату та вкажіть базову ціну.');
      return;
    }

    const payload = {
      car_id: Number(form.car_id),
      client_id: Number(form.client_id),
      sale_date: form.sale_date,
      base_price: String(basePriceNumber),
      options_price: String(optionsPriceNumber),
      total_price: String(totalPriceNumber),
    };

    const isUpdate = !!form.id;
    const url = isUpdate
      ? `${API_URL}?resource=sales&id=${form.id}&token=${token}`
      : `${API_URL}?resource=sales&token=${token}`;

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
      if (!res.ok) throw new Error('Помилка збереження');
      await dispatch(fetchSales());
      if (!isUpdate) setForm(emptyForm);
    } catch (e) {
      setError(
        'Не вдалося зберегти продаж. Перевірте, що ви адміністратор і всі поля заповнені коректно.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Продажі</h1>
      <p className="page-subtitle">
        Оформлення угод із вибором автомобіля, клієнта та додаткових опцій із автоматичним підрахунком вартості.
      </p>

      {role === 'admin' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                {form.id ? 'Редагування продажу' : 'Реєстрація нового продажу'}
              </div>
              <div className="card-meta">
                Оберіть авто, клієнта, додайте опції та вкажіть суму.
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
                <label>Автомобіль</label>
                <select
                  className="select"
                  value={form.car_id}
                  onChange={(e) => handleChange('car_id', e.target.value)}
                >
                  <option value="">Не обрано</option>
                  {carsState.items.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.brand_name} {c.model} ({c.year})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Клієнт</label>
                <select
                  className="select"
                  value={form.client_id}
                  onChange={(e) => handleChange('client_id', e.target.value)}
                >
                  <option value="">Не обрано</option>
                  {clientsState.items.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {cl.id} — {cl.fullname}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Дата продажу</label>
                <input
                  className="input"
                  type="date"
                  value={form.sale_date}
                  onChange={(e) => handleChange('sale_date', e.target.value)}
                />
              </div>

              <div className="field">
                <label>Базова ціна авто ($)</label>
                <input
                  className="input"
                  type="number"
                  value={form.base_price}
                  onChange={(e) => handleChange('base_price', e.target.value)}
                  placeholder="Напр., 20000"
                />
              </div>

              <div className="field">
                <label>Обрані опції</label>
                <select
                  className="select"
                  multiple
                  value={form.options_ids}
                  onChange={handleOptionsChange}
                  style={{ minHeight: 80 }}
                >
                  {optionsState.items.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} (+{o.price} $)
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Сума за опції ($)</label>
                <input
                  className="input"
                  type="number"
                  value={
                    form.options_price !== ''
                      ? form.options_price
                      : sumOptionsPrice
                  }
                  onChange={(e) => handleChange('options_price', e.target.value)}
                  placeholder="Рахується автоматично з обраних опцій"
                />
              </div>

              <div className="field">
                <label>Загальна сума ($)</label>
                <input
                  className="input"
                  type="number"
                  value={
                    form.total_price !== ''
                      ? form.total_price
                      : totalPriceNumber
                  }
                  onChange={(e) => handleChange('total_price', e.target.value)}
                  placeholder="Рахується як база + опції"
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                color: '#9ca3af',
              }}
            >
              Автоматичний підрахунок: база {basePriceNumber || 0} $ + опції{' '}
              {optionsPriceNumber || 0} $ ={' '}
              <strong>{totalPriceNumber || 0} $</strong>
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
                : 'Зареєструвати продаж'}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-header">
          <div className="card-title">Історія продажів</div>
          <div className="card-meta">
            {status === 'loading'
              ? 'Завантаження даних...'
              : `Кількість записів: ${items.length}`}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Автомобіль</th>
                <th>Клієнт</th>
                <th>Дата</th>
                <th>Базова</th>
                <th>Опції</th>
                <th>Разом</th>
                {role === 'admin' && <th style={{ width: 140 }}>Дії</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.car_name}</td>
                  <td>{s.client_name}</td>
                  <td>{s.sale_date}</td>
                  <td>{s.base_price}</td>
                  <td>{s.options_price}</td>
                  <td>{s.total_price}</td>
                  {role === 'admin' && (
                    <td>
                      <button
                        className="button-ghost"
                        onClick={() => handleEdit(s)}
                        style={{ marginRight: 6 }}
                      >
                        Редагувати
                      </button>
                      <button
                        className="button-danger"
                        onClick={() => handleDelete(s)}
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
                    colSpan={role === 'admin' ? 8 : 7}
                    style={{ textAlign: 'center', color: '#6b7280' }}
                  >
                    Продажів поки немає.
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