import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { useAuthStore } from '../../store/authStore';
import {
  createLesson,
  getDisciplines,
  getGroups,
  getLessons,
} from '../../api/teacherApi';
import {
  insecureContextMessage,
  isSecureContext,
} from '../../utils/secureContext';
import { teacherNavItems } from './teacherNav';

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = {
  disciplineId: '',
  groupId: '',
  lessonDate: todayDate(),
  startTime: '09:00',
  endTime: '10:20',
  locationName: '',
  latitude: '',
  longitude: '',
  radiusMeters: '100',
};

export default function TeacherLessonsPage() {
  const token = useAuthStore((state) => state.token);
  const [lessons, setLessons] = useState([]);
  const [groups, setGroups] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [geoMessage, setGeoMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingGeo, setIsLoadingGeo] = useState(false);

  async function loadPageData() {
    setIsLoading(true);
    setError('');
    try {
      const [lessonsData, groupsData, disciplinesData] = await Promise.all([
        getLessons(token),
        getGroups(token),
        getDisciplines(token),
      ]);
      setLessons(lessonsData.lessons || []);
      setGroups(groupsData.groups || []);
      setDisciplines(disciplinesData.disciplines || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPageData();
  }, [token]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function fillMyCoordinates() {
    if (!isSecureContext()) {
      setGeoMessage(insecureContextMessage());
      return;
    }

    if (!navigator.geolocation) {
      setGeoMessage('Геолокація не підтримується цим браузером');
      return;
    }

    setIsLoadingGeo(true);
    setGeoMessage('Визначаємо ваше місцезнаходження...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }));
        setGeoMessage('Координати аудиторії підставлені з вашого місця');
        setIsLoadingGeo(false);
      },
      (error) => {
        const reason =
          error?.code === 1
            ? 'Доступ до геолокації заборонено в налаштуваннях браузера.'
            : 'Не вдалося отримати координати. Дозвольте доступ до геолокації.';
        setGeoMessage(reason);
        setIsLoadingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await createLesson(token, {
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

      setSuccess('Заняття створено. QR-код уже згенеровано.');
      setForm({
        ...emptyForm,
        lessonDate: todayDate(),
        latitude: form.latitude,
        longitude: form.longitude,
        radiusMeters: form.radiusMeters,
      });
      await loadPageData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="Панель викладача" navItems={teacherNavItems}>
      <section>
        <h1 className="text-2xl font-semibold text-ink">Заняття</h1>
        <p className="mt-2 text-muted">
          Створіть заняття в аудиторії, підставте свої координати й покажіть
          QR студентам
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2"
        >
          <label className="block text-sm font-medium text-ink">
            Дисципліна
            <select
              value={form.disciplineId}
              onChange={(event) => updateField('disciplineId', event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">Оберіть дисципліну</option>
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
              <option value="">Оберіть групу</option>
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
              onChange={(event) => updateField('lessonDate', event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="block text-sm font-medium text-ink">
            Місце
            <input
              value={form.locationName}
              onChange={(event) => updateField('locationName', event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="block text-sm font-medium text-ink">
            Початок
            <input
              type="time"
              value={form.startTime}
              onChange={(event) => updateField('startTime', event.target.value)}
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

          <div className="sm:col-span-2 rounded-xl border border-line bg-surface/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-ink">
                  Координати місця заняття
                </p>
                <p className="mt-1 text-xs text-muted">
                  Натисніть кнопку в аудиторії — підставляться ваші координати
                </p>
              </div>
              <button
                type="button"
                onClick={fillMyCoordinates}
                disabled={isLoadingGeo}
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-white disabled:opacity-60"
              >
                {isLoadingGeo ? 'Визначаємо...' : 'Взяти мої координати'}
              </button>
            </div>
            {geoMessage ? (
              <p className="mt-3 text-sm text-muted">{geoMessage}</p>
            ) : null}
          </div>

          <label className="block text-sm font-medium text-ink">
            Широта
            <input
              value={form.latitude}
              onChange={(event) => updateField('latitude', event.target.value)}
              required
              placeholder="Натисніть «Взяти мої координати»"
              className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="block text-sm font-medium text-ink">
            Довгота
            <input
              value={form.longitude}
              onChange={(event) => updateField('longitude', event.target.value)}
              required
              placeholder="Натисніть «Взяти мої координати»"
              className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="block text-sm font-medium text-ink sm:col-span-2">
            Радіус (метри)
            <input
              type="number"
              min="1"
              value={form.radiusMeters}
              onChange={(event) => updateField('radiusMeters', event.target.value)}
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
              {isSaving ? 'Створення...' : 'Створити заняття'}
            </button>
          </div>
        </form>

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
        ) : null}
        {success ? (
          <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-success">
            {success}
          </p>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
          {isLoading ? (
            <p className="p-4 text-sm text-muted">Завантаження...</p>
          ) : lessons.length === 0 ? (
            <p className="p-4 text-sm text-muted">Занять ще немає</p>
          ) : (
            <ul className="divide-y divide-line">
              {lessons.map((lesson) => (
                <li
                  key={lesson.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-ink">
                      {lesson.disciplineName} · {lesson.groupName}
                    </p>
                    <p className="text-sm text-muted">
                      {lesson.lessonDate} · {lesson.startTime.slice(0, 5)}–
                      {lesson.endTime.slice(0, 5)} · {lesson.locationName}
                    </p>
                  </div>
                  <Link
                    to={`/teacher/lessons/${lesson.id}`}
                    className="rounded-lg border border-line px-3 py-1.5 text-center text-sm font-medium text-ink hover:bg-surface"
                  >
                    QR і присутність
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </AppShell>
  );
}
