import AppShell from '../../components/AppShell';

export default function AdminHomePage() {
  return (
    <AppShell title="Панель адміністратора">
      <section>
        <h1 className="text-2xl font-semibold text-ink">Вітаємо</h1>
        <p className="mt-2 text-muted">
          Тут зʼявляться користувачі, групи та дисципліни.
        </p>
      </section>
    </AppShell>
  );
}
