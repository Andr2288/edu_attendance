import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const roleLabels = {
  admin: 'Адміністратор',
  teacher: 'Викладач',
  student: 'Студент',
};

export default function AppShell({ title, navItems = [], children }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-bold tracking-tight text-ink">EduAttend</p>
              <p className="text-sm text-muted">{title}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-ink">{user?.fullName}</p>
                <p className="text-xs text-muted">
                  {roleLabels[user?.role] || user?.role}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface"
              >
                Вийти
              </button>
            </div>
          </div>

          {navItems.length > 0 ? (
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      'rounded-lg px-3 py-2 text-sm font-medium transition',
                      isActive
                        ? 'bg-accent text-white'
                        : 'bg-white text-muted hover:bg-surface hover:text-ink',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
