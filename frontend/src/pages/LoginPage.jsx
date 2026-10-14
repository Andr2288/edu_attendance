import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const homePathByRole = useAuthStore((state) => state.homePathByRole);

  const [email, setEmail] = useState('admin@edu.local');
  const [password, setPassword] = useState('password123');

  if (token && user) {
    return <Navigate to={homePathByRole()} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const loggedUser = await login(email.trim(), password);
      if (loggedUser.role === 'admin') navigate('/admin', { replace: true });
      else if (loggedUser.role === 'teacher') navigate('/teacher', { replace: true });
      else navigate('/student', { replace: true });
    } catch {
      // error already in store
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            EduAttend
          </p>
          <p className="mt-3 text-base text-muted">
            Облік відвідуваності занять через QR і геолокацію
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8"
        >
          <h1 className="text-xl font-semibold text-ink">Увійти в систему</h1>
          <p className="mt-1 text-sm text-muted">Використайте свій email і пароль</p>

          <label className="mt-6 block text-sm font-medium text-ink">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="username"
              className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-ink">
            Пароль
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>

          {error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Вхід...' : 'Увійти'}
          </button>

          <p className="mt-4 text-xs leading-relaxed text-muted">
            Тест: admin@edu.local / teacher1@edu.local / student1@edu.local —
            пароль password123
          </p>
        </form>
      </div>
    </div>
  );
}
