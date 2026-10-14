import { Link } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import { adminNavItems } from './adminNav';

const cards = [
  {
    to: '/admin/groups',
    title: 'Групи',
    text: 'Створювати та редагувати навчальні групи',
  },
  {
    to: '/admin/disciplines',
    title: 'Дисципліни',
    text: 'Додавати та редагувати дисципліни',
  },
  {
    to: '/admin/users',
    title: 'Користувачі',
    text: 'Додавати, змінювати та видаляти акаунти',
  },
];

export default function AdminHomePage() {
  return (
    <AppShell title="Панель адміністратора" navItems={adminNavItems}>
      <section>
        <h1 className="text-2xl font-semibold text-ink">Керування системою</h1>
        <p className="mt-2 text-muted">
          Оберіть розділ, щоб працювати з даними.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
