import { Link } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { studentNavItems } from './studentNav';

const cards = [
  {
    to: '/student/check-in',
    title: 'Відмітка присутності',
    text: 'Скануйте QR і підтвердіть геолокацію',
  },
  {
    to: '/student/history',
    title: 'Історія',
    text: 'Перегляньте свої відвідування',
  },
];

export default function StudentHomePage() {
  return (
    <AppShell title="Кабінет студента" navItems={studentNavItems}>
      <section>
        <h1 className="text-2xl font-semibold text-ink">Кабінет студента</h1>
        <p className="mt-2 text-muted">
          Відмічайте присутність на заняттях і стежте за історією.
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
