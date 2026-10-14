import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useAuthStore } from '../../store/authStore';
import {
  createDiscipline,
  deleteDiscipline,
  getDisciplines,
  updateDiscipline,
} from '../../api/adminApi';
import { adminNavItems } from './adminNav';

export default function DisciplinesPage() {
  const token = useAuthStore((state) => state.token);
  const [disciplines, setDisciplines] = useState([]);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadDisciplines() {
    setIsLoading(true);
    setError('');
    try {
      const data = await getDisciplines(token);
      setDisciplines(data.disciplines || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDisciplines();
  }, [token]);

  function startEdit(discipline) {
    setEditId(discipline.id);
    setName(discipline.name);
    setSuccess('');
    setError('');
  }

  function resetForm() {
    setEditId(null);
    setName('');
  }

  async function handleDelete(discipline) {
    const confirmed = window.confirm(
      `Видалити дисципліну "${discipline.name}"?`
    );
    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      await deleteDiscipline(token, discipline.id);
      setSuccess('Дисципліну видалено');
      if (editId === discipline.id) resetForm();
      await loadDisciplines();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editId) {
        await updateDiscipline(token, editId, name.trim());
        setSuccess('Дисципліну оновлено');
      } else {
        await createDiscipline(token, name.trim());
        setSuccess('Дисципліну створено');
      }
      resetForm();
      await loadDisciplines();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="Панель адміністратора" navItems={adminNavItems}>
      <section>
        <h1 className="text-2xl font-semibold text-ink">Дисципліни</h1>
        <p className="mt-2 text-muted">Додавання та редагування дисциплін</p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-2xl border border-line bg-white p-5"
        >
          <label className="block text-sm font-medium text-ink">
            Назва дисципліни
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Наприклад, Комп'ютерні мережі"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
            >
              {editId ? 'Зберегти' : 'Додати дисципліну'}
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
          ) : disciplines.length === 0 ? (
            <p className="p-4 text-sm text-muted">Дисциплін ще немає</p>
          ) : (
            <ul className="divide-y divide-line">
              {disciplines.map((discipline) => (
                <li
                  key={discipline.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-ink">{discipline.name}</p>
                    <p className="text-xs text-muted">id: {discipline.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(discipline)}
                      className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface"
                    >
                      Редагувати
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(discipline)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-danger hover:bg-red-50"
                    >
                      Видалити
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </AppShell>
  );
}
