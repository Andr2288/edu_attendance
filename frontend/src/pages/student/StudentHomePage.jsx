import AppShell from '../../components/AppShell';

export default function StudentHomePage() {
  return (
    <AppShell title="Кабінет студента">
      <section>
        <h1 className="text-2xl font-semibold text-ink">Вітаємо</h1>
        <p className="mt-2 text-muted">
          Тут зʼявляться сканування QR та історія відвідувань.
        </p>
      </section>
    </AppShell>
  );
}
