import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useAuthStore } from '../../store/authStore';
import {
  createUser,
  deleteUser,
  getGroups,
  getUsers,
  updateUser,
} from '../../api/adminApi';
import { adminNavItems } from './adminNav';

const emptyForm = {
  email: '',
  fullName: '',
  role: 'student',
  password: '',
  groupId: '',
};

export default function UsersPage() {
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadData() {
    setIsLoading(true);
    setError('');
    try {
      const [usersData, groupsData] = await Promise.all([
        getUsers(token),
        getGroups(token),
      ]);
      setUsers(usersData.users || []);
      setGroups(groupsData.groups || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [token]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startEdit(user) {
    setEditId(user.id);
    setForm({
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      password: '',
      groupId: user.groupId ? String(user.groupId) : '',
    });
    setSuccess('');
    setError('');
  }

  function resetForm() {
    setEditId(null);
    setForm(emptyForm);
  }

  function buildPayload() {
    const payload = {
      email: form.email.trim(),
      fullName: form.fullName.trim(),
      role: form.role,
      groupId: form.role === 'student' ? Number(form.groupId) : null,
    };

    if (form.password.trim()) {
      payload.password = form.password.trim();
    }

    return payload;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      if (form.role === 'student' && !form.groupId) {
        throw new Error('Для студента потрібно обрати групу');
      }

      if (!editId && !form.password.trim()) {
        throw new Error('Пароль обовʼязковий при створенні');
      }

      const payload = buildPayload();

      if (editId) {
        await updateUser(token, editId, payload);
        setSuccess('Користувача оновлено');
      } else {
        await createUser(token, {
          ...payload,
          password: form.password.trim(),
        });
        setSuccess('Користувача створено');
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(user) {
    if (user.id === currentUser?.id) {
      setError('Не можна видалити власний акаунт');
      return;
    }

    const confirmed = window.confirm(
      `Видалити користувача ${user.fullName}?`
    );
    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      await deleteUser(token, user.id);
      setSuccess('Користувача видалено');
      if (editId === user.id) resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function groupNameById(groupId) {
    if (!groupId) return '—';
    const group = groups.find((item) => item.id === groupId);
    return group ? group.name : `id ${groupId}`;
  }

  const roleSections = [
    { role: 'admin', title: 'Адміністратори' },
    { role: 'teacher', title: 'Викладачі' },
    { role: 'student', title: 'Студенти' },
  ];

  function renderUserRow(user) {
    return (
      <li
        key={user.id}
        className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="font-medium text-ink">{user.fullName}</p>
          <p className="text-sm text-muted">
            {user.email}
            {user.role === 'student'
              ? ` · група: ${groupNameById(user.groupId)}`
              : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => startEdit(user)}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface"
          >
            Редагувати
          </button>
          <button
            type="button"
            onClick={() => handleDelete(user)}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-danger hover:bg-red-50"
          >
            Видалити
          </button>
        </div>
      </li>
    );
  }

  return (
    <AppShell title="Панель адміністратора" navItems={adminNavItems}>
      <section>
        <h1 className="text-2xl font-semibold text-ink">Користувачі</h1>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2"
        >
          <label className="block text-sm font-medium text-ink">
            ПІБ
            <input
              value={form.fullName}
              onChange={(event) => updateField('fullName', event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="block text-sm font-medium text-ink">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="block text-sm font-medium text-ink">
            Роль
            <select
              value={form.role}
              onChange={(event) => updateField('role', event.target.value)}
              className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="admin">Адміністратор</option>
              <option value="teacher">Викладач</option>
              <option value="student">Студент</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-ink">
            {editId ? 'Новий пароль' : 'Пароль'}
            <input
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              required={!editId}
              className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>

          {form.role === 'student' ? (
            <label className="block text-sm font-medium text-ink sm:col-span-2">
              Група
              <select
                value={form.groupId}
                onChange={(event) => updateField('groupId', event.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="">Оберіть групу</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
            >
              {editId ? 'Зберегти' : 'Додати користувача'}
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

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="rounded-2xl border border-line bg-white p-4 text-sm text-muted">
              Завантаження...
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-2xl border border-line bg-white p-4 text-sm text-muted">
              Користувачів ще немає
            </div>
          ) : (
            roleSections.map((section) => {
              const sectionUsers = users.filter(
                (user) => user.role === section.role
              );

              return (
                <div
                  key={section.role}
                  className="overflow-hidden rounded-2xl border border-line bg-white"
                >
                  <div className="border-b border-line px-4 py-3">
                    <h2 className="font-semibold text-ink">
                      {section.title}
                      <span className="ml-2 text-sm font-normal text-muted">
                        ({sectionUsers.length})
                      </span>
                    </h2>
                  </div>
                  {sectionUsers.length === 0 ? (
                    <p className="p-4 text-sm text-muted">Порожньо</p>
                  ) : (
                    <ul className="divide-y divide-line">
                      {sectionUsers.map((user) => renderUserRow(user))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </AppShell>
  );
}
