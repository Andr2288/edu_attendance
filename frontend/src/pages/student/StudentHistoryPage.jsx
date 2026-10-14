import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useAuthStore } from '../../store/authStore';
import { getMyAttendances } from '../../api/studentApi';
import { studentNavItems } from './studentNav';

export default function StudentHistoryPage() {
  const token = useAuthStore((state) => state.token);
  const [attendances, setAttendances] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const data = await getMyAttendances(token);
        setAttendances(data.attendances || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [token]);

  return (
    <AppShell title="Кабінет студента" navItems={studentNavItems}>
      <section>
        <h1 className="text-2xl font-semibold text-ink">Історія відвідувань</h1>
        <p className="mt-2 text-muted">Ваші підтверджені присутності</p>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
          {isLoading ? (
            <p className="p-4 text-sm text-muted">Завантаження...</p>
          ) : attendances.length === 0 ? (
            <p className="p-4 text-sm text-muted">Поки немає відміток</p>
          ) : (
            <ul className="divide-y divide-line">
              {attendances.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <p className="font-medium text-ink">{item.disciplineName}</p>
                  <p className="text-sm text-muted">
                    {item.lessonDate} · {String(item.startTime).slice(0, 5)}–
                    {String(item.endTime).slice(0, 5)} · {item.locationName}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Відмітка: {item.checkedInAt}
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
