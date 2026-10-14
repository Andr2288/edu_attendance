import { apiRequest } from './client';

export function getGroups(token) {
  return apiRequest('/groups', { token });
}

export function getDisciplines(token) {
  return apiRequest('/disciplines', { token });
}

export function getLessons(token, archived = false) {
  const query = archived ? '?archived=1' : '?archived=0';
  return apiRequest(`/lessons${query}`, { token });
}

export function getLesson(token, id) {
  return apiRequest(`/lessons/${id}`, { token });
}

export function createLesson(token, payload) {
  return apiRequest('/lessons', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function updateLesson(token, id, payload) {
  return apiRequest(`/lessons/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
}

export function archiveLesson(token, id) {
  return apiRequest(`/lessons/${id}/archive`, {
    method: 'POST',
    token,
  });
}

export function unarchiveLesson(token, id) {
  return apiRequest(`/lessons/${id}/unarchive`, {
    method: 'POST',
    token,
  });
}

export function deleteLesson(token, id) {
  return apiRequest(`/lessons/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function getLessonAttendances(token, lessonId) {
  return apiRequest(`/lessons/${lessonId}/attendances`, { token });
}

export function getAttendanceStats(token, disciplineId) {
  const query = disciplineId
    ? `?disciplineId=${encodeURIComponent(disciplineId)}`
    : '';
  return apiRequest(`/attendance/stats${query}`, { token });
}
