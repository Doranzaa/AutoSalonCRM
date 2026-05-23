import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminInquiries } from '../store';
import { API_URL } from '../config';

export default function AdminInquiriesPage() {
  const dispatch = useDispatch();
  const { role, token } = useSelector((s) => s.auth);
  const { items, status } = useSelector((s) => s.adminInquiries);

  useEffect(() => {
    if (role === 'admin' && token) {
      dispatch(fetchAdminInquiries(token));
    }
  }, [dispatch, role, token]);

  const handleDelete = async (id) => {
    if (!window.confirm(`Видалити звернення #${id}?`)) return;

    const res = await fetch(`${API_URL}?resource=inquiries&id=${id}&token=${token}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      dispatch(fetchAdminInquiries(token));
    } else {
      alert('Не вдалося видалити звернення');
    }
  };

  if (role !== 'admin') {
    return (
      <>
        <h1 className="page-title">Заявки</h1>
        <p className="page-subtitle">Ця сторінка доступна тільки адміністратору.</p>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">Звернення користувачів</h1>
      <p className="page-subtitle">Адміністратор бачить усі звернення з бази даних.</p>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Список звернень</div>
          <div className="card-meta">
            {status === 'loading' ? 'Завантаження...' : `Кількість: ${items.length}`}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Логін</th>
                <th>ПІБ</th>
                <th>Телефон</th>
                <th>Повідомлення</th>
                <th>Дата</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.login}</td>
                  <td>{item.fullname}</td>
                  <td>{item.phone}</td>
                  <td>{item.message}</td>
                  <td>{item.created_at}</td>
                  <td>
                    <button className="button-danger" onClick={() => handleDelete(item.id)}>
                      Видалити
                    </button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && status === 'succeeded' && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#6b7280' }}>
                    Звернень поки немає.
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