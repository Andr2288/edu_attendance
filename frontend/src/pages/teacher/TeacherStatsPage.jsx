import { useEffect, useMemo, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useAuthStore } from '../../store/authStore';
import {
  getAttendanceStats,
  getDisciplines,
  getLessons,
} from '../../api/teacherApi';
import { teacherNavItems } from './teacherNav';

export default function TeacherStatsPage() {
  const token = useAuthStore((state) => state.token);
  const [disciplines, setDisciplines] = useState([]);
  const [disciplineId, setDisciplineId] = useState('');
  const [stats, setStats] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDisciplinesForTeacher() {
      setError('');
      try {
        const [disciplinesData, activeLessons, archivedLessons] =
          await Promise.all([
            getDisciplines(token),
            getLessons(token, false),
            getLessons(token, true),
          ]);

        const usedIds = new Set(
          [...(activeLessons.lessons || []), ...(archivedLessons.lessons || [])]
            .map((lesson) => lesson.disciplineId)
        );

        const available = (disciplinesData.disciplines || []).filter((item) =>
          usedIds.has(item.id)
        );

        setDisciplines(available);
        if (available.length > 0) {
          setDisciplineId(String(available[0].id));
        }
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    }

    loadDisciplinesForTeacher();
  }, [token]);

  useEffect(() => {
    if (!disciplineId) {
      setStats([]);
      setIsLoading(false);
      return;
    }

    async function loadStats() {
      setIsLoading(true);
      setError('');
      try {
        const data = await getAttendanceStats(token, disciplineId);
        setStats(data.stats || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, [token, disciplineId]);

  const selectedDisciplineName = useMemo(() => {
    const found = disciplines.find(
      (item) => String(item.id) === String(disciplineId)
    );
    return found?.name || '';
  }, [disciplines, disciplineId]);

  return (
    <AppShell title="Панель викладача" navItems={teacherNavItems}>
      <section>
        <h1 className="text-2xl font-semibold text-ink">Статистика</h1>

        <label className="mt-6 block max-w-md text-sm font-medium text-ink">
          Дисципліна
          <select
            value={disciplineId}
            onChange={(event) => setDisciplineId(event.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            {disciplines.length === 0 ? (
              <option value="">Немає дисциплін із заняттями</option>
            ) : (
              disciplines.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))
            )}
          </select>
        </label>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
          {selectedDisciplineName ? (
            <div className="border-b border-line px-4 py-3">
              <h2 className="font-semibold text-ink">{selectedDisciplineName}</h2>
            </div>
          ) : null}

          {isLoading ? (
            <p className="p-4 text-sm text-muted">Завантаження...</p>
          ) : !disciplineId ? (
            <p className="p-4 text-sm text-muted">Немає даних</p>
          ) : stats.length === 0 ? (
            <p className="p-4 text-sm text-muted">Немає даних</p>
          ) : (
            <ul className="divide-y divide-line">
              {stats.map((item) => (
                <li
                  key={`${item.disciplineId}-${item.studentId}-${item.groupId}`}
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
