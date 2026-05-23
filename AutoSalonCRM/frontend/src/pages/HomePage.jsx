import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

export default function HomePage() {
  const { role } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const carsUrl = `${API_URL}?resource=cars`;
  const clientsUrl = `${API_URL}?resource=clients`;

  const sampleJson = `[
  {
    "id": 1,
    "brand_id": 1,
    "model": "Corolla",
    "year": 2020,
    "price": 20000.00,
    "equipment": "Базова комплектація",
    "photo_url": "https://via.placeholder.com/200x120?text=Corolla",
    "brand_name": "Toyota"
  },
  {
    "id": 2,
    "brand_id": 2,
    "model": "X5",
    "year": 2022,
    "price": 55000.00,
    "equipment": "Повна комплектація",
    "photo_url": "https://via.placeholder.com/200x120?text=BMW+X5",
    "brand_name": "BMW"
  }
]`;

  return (
    <>
      <h1 className="page-title">Панель автосалону</h1>
      <p className="page-subtitle">
        Керування автопарком, клієнтами, продажами та опціями.
      </p>

      {/* Швидка навігація */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Швидка навігація</div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          <button
            className="button-ghost"
            onClick={() => navigate('/brands')}
          >
            Автопарк
          </button>

          <button
            className="button-ghost"
            onClick={() => navigate('/clients')}
          >
            Клієнти
          </button>

          <button
            className="button-ghost"
            onClick={() => navigate('/sales')}
          >
            Продажі
          </button>

          <button
            className="button-ghost"
            onClick={() => navigate('/options')}
          >
            Опції
          </button>

          {role !== 'guest' && (
            <button
              className="button"
              onClick={() => navigate('/inquiry')}
            >
              Звернення
            </button>
          )}
        </div>
      </div>

      {/* Коротка демонстрація API */}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-header">
          <div>
            <div className="card-title">API (можна перевірити в Postman)</div>
          </div>
        </div>

        <div style={{ fontSize: 13, marginBottom: 8 }}>
          <div style={{ marginBottom: 4 }}>
            GET машини:{' '}
            <code style={{ color: '#bfdbfe' }}>{carsUrl}</code>
          </div>
          <div>
            GET клієнти:{' '}
            <code style={{ color: '#bfdbfe' }}>{clientsUrl}</code>
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            borderRadius: 12,
            background: '#020617',
            border: '1px solid rgba(31,41,55,0.9)',
            padding: 10,
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: 11.5,
            color: '#e5e7eb',
            maxHeight: 220,
            overflow: 'auto',
          }}
        >
{sampleJson}
        </div>
      </div>
    </>
  );
}