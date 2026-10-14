import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useAuthStore } from '../../store/authStore';
import { getAttendanceStats } from '../../api/teacherApi';
import { teacherNavItems } from './teacherNav';

export default function TeacherStatsPage() {
  const token = useAuthStore((state) => state.token);
  const [stats, setStats] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const data = await getAttendanceStats(token);
        setStats(data.stats || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [token]);

  return (
    <AppShell title="Панель викладача" navItems={teacherNavItems}>
      <section>
        <h1 className="text-2xl font-semibold text-ink">Статистика</h1>
        <p className="mt-2 text-muted">
          Відвідуваність студентів по ваших заняттях
        </p>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
          {isLoading ? (
            <p className="p-4 text-sm text-muted">Завантаження...</p>
          ) : stats.length === 0 ? (
            <p className="p-4 text-sm text-muted">Поки немає даних</p>
          ) : (
            <ul className="divide-y divide-line">
              {stats.map((item) => (
                <li
                  key={`${item.studentId}-${item.groupId}`}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-ink">{item.studentName}</p>
                    <p className="text-sm text-muted">
                      {item.groupName} · {item.studentEmail}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-ink">
                    {item.presentCount}/{item.totalLessons} ({item.percent}%)
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </AppShell>
  );
}
