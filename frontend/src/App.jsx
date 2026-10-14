import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import GroupsPage from './pages/admin/GroupsPage';
import DisciplinesPage from './pages/admin/DisciplinesPage';
import UsersPage from './pages/admin/UsersPage';
import TeacherLessonsPage from './pages/teacher/TeacherLessonsPage';
import TeacherLessonDetailPage from './pages/teacher/TeacherLessonDetailPage';
import TeacherStatsPage from './pages/teacher/TeacherStatsPage';
import StudentCheckInPage from './pages/student/StudentCheckInPage';
import StudentHistoryPage from './pages/student/StudentHistoryPage';
import { useAuthStore } from './store/authStore';

function HomeRedirect() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const homePathByRole = useAuthStore((state) => state.homePathByRole);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={homePathByRole()} replace />;
}

function AdminRoute({ children }) {
  return <ProtectedRoute roles={['admin']}>{children}</ProtectedRoute>;
}

function TeacherRoute({ children }) {
  return <ProtectedRoute roles={['teacher']}>{children}</ProtectedRoute>;
}

function StudentRoute({ children }) {
  return <ProtectedRoute roles={['student']}>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={<Navigate to="/admin/groups" replace />}
        />
        <Route
          path="/admin/groups"
          element={
            <AdminRoute>
              <GroupsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/disciplines"
          element={
            <AdminRoute>
              <DisciplinesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          }
        />

        <Route
          path="/teacher"
          element={<Navigate to="/teacher/lessons" replace />}
        />
        <Route
          path="/teacher/lessons"
          element={
            <TeacherRoute>
              <TeacherLessonsPage />
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher/lessons/:id"
          element={
            <TeacherRoute>
              <TeacherLessonDetailPage />
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher/stats"
          element={
            <TeacherRoute>
              <TeacherStatsPage />
            </TeacherRoute>
          }
        />

        <Route
          path="/student"
          element={<Navigate to="/student/check-in" replace />}
        />
        <Route
          path="/student/check-in"
          element={
            <StudentRoute>
              <StudentCheckInPage />
            </StudentRoute>
          }
        />
        <Route
          path="/student/history"
          element={
            <StudentRoute>
              <StudentHistoryPage />
            </StudentRoute>
          }
        />

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
