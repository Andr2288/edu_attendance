import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useAuthStore } from '../../store/authStore';
import { createGroup, getGroups, updateGroup } from '../../api/adminApi';
import { adminNavItems } from './adminNav';

export default function GroupsPage() {
  const token = useAuthStore((state) => state.token);
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadGroups() {
    setIsLoading(true);
    setError('');
    try {
      const data = await getGroups(token);
      setGroups(data.groups || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadGroups();
  }, [token]);

  function startEdit(group) {
    setEditId(group.id);
    setName(group.name);
    setSuccess('');
    setError('');
  }

  function resetForm() {
    setEditId(null);
    setName('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editId) {
        await updateGroup(token, editId, name.trim());
        setSuccess('Групу оновлено');
      } else {
        await createGroup(token, name.trim());
        setSuccess('Групу створено');
      }
      resetForm();
      await loadGroups();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="Панель адміністратора" navItems={adminNavItems}>
      <section>
        <h1 className="text-2xl font-semibold text-ink">Групи</h1>
        <p className="mt-2 text-muted">Створення та редагування навчальних груп</p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-line bg-white p-5"
        >
          <label className="block text-sm font-medium text-ink">
            Назва групи
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Наприклад, КН-24"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
            >
              {editId ? 'Зберегти' : 'Додати групу'}
            </button>
            {editId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink"
              >
                Скасувати
              </button>
            ) : null}
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
          ) : groups.length === 0 ? (
            <p className="p-4 text-sm text-muted">Груп ще немає</p>
          ) : (
            <ul className="divide-y divide-line">
              {groups.map((group) => (
                <li
                  key={group.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-ink">{group.name}</p>
                    <p className="text-xs text-muted">id: {group.id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(group)}
                    className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface"
                  >
                    Редагувати
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </AppShell>
  );
}
