import { Link } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { teacherNavItems } from './teacherNav';

const cards = [
  {
    to: '/teacher/lessons',
    title: 'Заняття',
    text: 'Створювати заняття та показувати QR-код',
  },
  {
    to: '/teacher/stats',
    title: 'Статистика',
    text: 'Дивитись відвідуваність студентів',
  },
];

export default function TeacherHomePage() {
  return (
    <AppShell title="Панель викладача" navItems={teacherNavItems}>
      <section>
        <h1 className="text-2xl font-semibold text-ink">Кабінет викладача</h1>
        <p className="mt-2 text-muted">
          Керуйте заняттями та контролем присутності.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="rounded-2xl border border-line bg-white p-5 transition hover:border-accent/40 hover:shadow-sm"
            >
              <h2 className="text-lg font-semibold text-ink">{card.title}</h2>
              <p className="mt-2 text-sm text-muted">{card.text}</p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
