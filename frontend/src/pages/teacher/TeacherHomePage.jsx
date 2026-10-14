import AppShell from '../../components/AppShell';

export default function TeacherHomePage() {
  return (
    <AppShell title="Панель викладача">
      <section>
        <h1 className="text-2xl font-semibold text-ink">Вітаємо</h1>
        <p className="mt-2 text-muted">
          Тут зʼявляться заняття, QR-код та відвідуваність.
        </p>
      </section>
    </AppShell>
  );
}
