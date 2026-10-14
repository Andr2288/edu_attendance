import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import AppShell from '../../components/AppShell';
import { useAuthStore } from '../../store/authStore';
import {
  archiveLesson,
  deleteLesson,
  getDisciplines,
  getGroups,
  getLesson,
  getLessonAttendances,
  unarchiveLesson,
  updateLesson,
} from '../../api/teacherApi';
import { teacherNavItems } from './teacherNav';

export default function TeacherLessonDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  const [lesson, setLesson] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [groups, setGroups] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    setIsLoading(true);
    setError('');
    try {
      const [lessonData, attendanceData, groupsData, disciplinesData] =
        await Promise.all([
          getLesson(token, id),
          getLessonAttendances(token, id),
          getGroups(token),
          getDisciplines(token),
        ]);

      const current = lessonData.lesson;
      setLesson(current);
      setAttendances(attendanceData.attendances || []);
      setGroups(groupsData.groups || []);
      setDisciplines(disciplinesData.disciplines || []);
      setForm({
        disciplineId: String(current.disciplineId),
        groupId: String(current.groupId),
        lessonDate: current.lessonDate,
        startTime: current.startTime.slice(0, 5),
        endTime: current.endTime.slice(0, 5),
        locationName: current.locationName,
        latitude: String(current.latitude),
        longitude: String(current.longitude),
        radiusMeters: String(current.radiusMeters),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token, id]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = await updateLesson(token, id, {
        disciplineId: Number(form.disciplineId),
        groupId: Number(form.groupId),
        lessonDate: form.lessonDate,
        startTime: form.startTime,
        endTime: form.endTime,
        locationName: form.locationName.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        radiusMeters: Number(form.radiusMeters),
      });
      setLesson(data.lesson);
      setSuccess('Заняття оновлено');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive() {
    setError('');
    setSuccess('');
    try {
      const data = await archiveLesson(token, id);
      setLesson(data.lesson);
      setSuccess('Заняття в архіві (статистика зберігається)');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUnarchive() {
    setError('');
    setSuccess('');
    try {
      const data = await unarchiveLesson(token, id);
      setLesson(data.lesson);
      setSuccess('Заняття повернуто з архіву');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      'Видалити заняття повністю? Це також прибере відмітки і більше не впливатиме на статистику.'
    );
    if (!confirmed) return;

    setError('');
    try {
      await deleteLesson(token, id);
      navigate('/teacher/lessons', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppShell title="Панель викладача" navItems={teacherNavItems}>
      <section>
        <Link
          to="/teacher/lessons"
          className="text-sm font-medium text-accent hover:text-accent-dark"
        >
          ← До списку занять
        </Link>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted">Завантаження...</p>
        ) : error && !lesson ? (
          <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : lesson && form ? (
          <>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-ink">
                  {lesson.disciplineName}
                </h1>
                <p className="mt-2 text-muted">
                  {lesson.groupName} · {lesson.lessonDate} ·{' '}
                  {lesson.startTime.slice(0, 5)}–{lesson.endTime.slice(0, 5)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {lesson.locationName} · радіус {lesson.radiusMeters} м
                  {lesson.isArchived ? ' · в архіві' : ''}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {lesson.isArchived ? (
                  <button
                    type="button"
                    onClick={handleUnarchive}
                    className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
                  >
                    З архіву
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleArchive}
                    className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
                  >
                    В архів
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-danger hover:bg-red-50"
                >
                  Видалити назавжди
                </button>
              </div>
            </div>

            {error ? (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
            {success ? (
              <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-success">
                {success}
              </p>
            ) : null}

            <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
              <div className="rounded-2xl border border-line bg-white p-5 text-center">
                <h2 className="text-lg font-semibold text-ink">QR-код заняття</h2>
                <p className="mt-1 text-sm text-muted">
                  {lesson.isArchived
                    ? 'Архівне заняття — нові відмітки недоступні'
                    : 'Покажіть студентам для відмітки присутності'}
                </p>
                <div className="mt-4 flex justify-center">
                  <QRCodeSVG value={lesson.qrToken} size={200} />
                </div>
                <p className="mt-4 break-all text-xs text-muted">
                  {lesson.qrToken}
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-white">
                <div className="border-b border-line px-4 py-3">
                  <h2 className="text-lg font-semibold text-ink">Присутні</h2>
                  <p className="text-sm text-muted">
                    Зареєстровано: {attendances.length}
                  </p>
                </div>

                {attendances.length === 0 ? (
                  <p className="p-4 text-sm text-muted">
                    Поки ніхто не відмітився
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {attendances.map((item) => (
                      <li key={item.id} className="px-4 py-3">
                        <p className="font-medium text-ink">{item.studentName}</p>
                        <p className="text-sm text-muted">
                          {item.studentEmail} · {item.checkedInAt}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <form
              onSubmit={handleSave}
              className="mt-6 grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2"
            >
              <h2 className="text-lg font-semibold text-ink sm:col-span-2">
                Редагувати заняття
              </h2>

              <label className="block text-sm font-medium text-ink">
                Дисципліна
                <select
                  value={form.disciplineId}
                  onChange={(event) =>
                    updateField('disciplineId', event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  {disciplines.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-ink">
                Група
                <select
                  value={form.groupId}
                  onChange={(event) => updateField('groupId', event.target.value)}
                  required
                  className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  {groups.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-ink">
                Дата
                <input
                  type="date"
                  value={form.lessonDate}
                  onChange={(event) =>
                    updateField('lessonDate', event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                Місце
                <input
                  value={form.locationName}
                  onChange={(event) =>
                    updateField('locationName', event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                Початок
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(event) =>
                    updateField('startTime', event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                Кінець
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(event) => updateField('endTime', event.target.value)}
                  required
                  className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                Широта
                <input
                  value={form.latitude}
                  onChange={(event) =>
                    updateField('latitude', event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                Довгота
                <input
                  value={form.longitude}
                  onChange={(event) =>
                    updateField('longitude', event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>

              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Радіус (метри)
                <input
                  type="number"
                  min="1"
                  value={form.radiusMeters}
                  onChange={(event) =>
                    updateField('radiusMeters', event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
                >
                  {isSaving ? 'Збереження...' : 'Зберегти зміни'}
                </button>
              </div>
            </form>
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
