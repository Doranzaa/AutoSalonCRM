import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from './config';

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ login, password }) => {
    const res = await fetch(`${API_URL}?resource=auth&action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  }
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async ({ login, password }) => {
    const res = await fetch(`${API_URL}?resource=auth&action=register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Register failed');
    return data;
  }
);

const savedAuth = (() => {
  try {
    const raw = localStorage.getItem('autosalon_auth');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: !!savedAuth,
    login: savedAuth?.login || null,
    role: savedAuth?.role || 'guest',
    token: savedAuth?.token || null,
    status: 'idle',
    error: null,
  },
  reducers: {
    logout(state) {
      state.isAuthenticated = false;
      state.login = null;
      state.role = 'guest';
      state.token = null;
      state.status = 'idle';
      state.error = null;
      localStorage.removeItem('autosalon_auth');
    },
  },
  extraReducers: (builder) => {
    const saveAuth = (state, action) => {
      state.status = 'succeeded';
      state.isAuthenticated = true;
      state.login = action.payload.login;
      state.role = action.payload.role;
      state.token = action.payload.token;
      state.error = null;
      localStorage.setItem(
        'autosalon_auth',
        JSON.stringify({
          login: action.payload.login,
          role: action.payload.role,
          token: action.payload.token,
        })
      );
    };

    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, saveAuth)
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Помилка входу';
      })
      .addCase(registerThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, saveAuth)
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Помилка реєстрації';
      });
  },
});

const createListSlice = (name, resource) => {
  const fetchThunk = createAsyncThunk(`${name}/fetch`, async () => {
    const res = await fetch(`${API_URL}?resource=${resource}`);
    if (!res.ok) throw new Error('Fetch failed');
    return await res.json();
  });

  const slice = createSlice({
    name,
    initialState: { items: [], status: 'idle', error: null },
    reducers: {},
    extraReducers: (builder) => {
      builder
        .addCase(fetchThunk.pending, (state) => {
          state.status = 'loading';
        })
        .addCase(fetchThunk.fulfilled, (state, action) => {
          state.status = 'succeeded';
          state.items = action.payload;
        })
        .addCase(fetchThunk.rejected, (state) => {
          state.status = 'failed';
          state.error = 'Помилка завантаження';
        });
    },
  });

  return { reducer: slice.reducer, fetchThunk };
};

// важливо: додаємо token в query
export const fetchAdminInquiries = createAsyncThunk(
  'adminInquiries/fetch',
  async (token) => {
    const res = await fetch(`${API_URL}?resource=inquiries&token=${token}`);
    if (!res.ok) throw new Error('Fetch failed');
    return await res.json();
  }
);

const adminInquiriesSlice = createSlice({
  name: 'adminInquiries',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminInquiries.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAdminInquiries.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchAdminInquiries.rejected, (state) => {
        state.status = 'failed';
        state.error = 'Помилка завантаження';
      });
  },
});

const cars = createListSlice('cars', 'cars');
const clients = createListSlice('clients', 'clients');
const optionsSlice = createListSlice('options', 'options');
const sales = createListSlice('sales', 'sales');

export const { logout } = authSlice.actions;
export const fetchCars = cars.fetchThunk;
export const fetchClients = clients.fetchThunk;
export const fetchOptions = optionsSlice.fetchThunk;
export const fetchSales = sales.fetchThunk;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    cars: cars.reducer,
    clients: clients.reducer,
    options: optionsSlice.reducer,
    sales: sales.reducer,
    adminInquiries: adminInquiriesSlice.reducer,
  },
});