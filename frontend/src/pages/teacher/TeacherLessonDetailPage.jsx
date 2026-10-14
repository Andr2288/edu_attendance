import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import AppShell from '../../components/AppShell';
import { useAuthStore } from '../../store/authStore';
import { getLesson, getLessonAttendances } from '../../api/teacherApi';
import { teacherNavItems } from './teacherNav';

export default function TeacherLessonDetailPage() {
  const { id } = useParams();
  const token = useAuthStore((state) => state.token);
  const [lesson, setLesson] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const [lessonData, attendanceData] = await Promise.all([
          getLesson(token, id),
          getLessonAttendances(token, id),
        ]);
        setLesson(lessonData.lesson);
        setAttendances(attendanceData.attendances || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [token, id]);

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
        ) : error ? (
          <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : lesson ? (
          <>
            <h1 className="mt-4 text-2xl font-semibold text-ink">
              {lesson.disciplineName}
            </h1>
            <p className="mt-2 text-muted">
              {lesson.groupName} · {lesson.lessonDate} ·{' '}
              {lesson.startTime.slice(0, 5)}–{lesson.endTime.slice(0, 5)}
            </p>
            <p className="mt-1 text-sm text-muted">
              {lesson.locationName} · радіус {lesson.radiusMeters} м
            </p>

            <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
              <div className="rounded-2xl border border-line bg-white p-5 text-center">
                <h2 className="text-lg font-semibold text-ink">QR-код заняття</h2>
                <p className="mt-1 text-sm text-muted">
                  Покажіть студентам для відмітки присутності
                </p>
                <div className="mt-4 flex justify-center">
                  <QRCodeSVG value={lesson.qrToken} size={200} />
                </div>
                <p className="mt-4 break-all text-xs text-muted">{lesson.qrToken}</p>
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
          </>
        ) : null}
      </section>
    </AppShell>
  );
}
