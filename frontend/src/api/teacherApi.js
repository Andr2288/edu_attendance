import { apiRequest } from './client';

export function getGroups(token) {
  return apiRequest('/groups', { token });
}

export function getDisciplines(token) {
  return apiRequest('/disciplines', { token });
}

export function getLessons(token) {
  return apiRequest('/lessons', { token });
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

export function getLessonAttendances(token, lessonId) {
  return apiRequest(`/lessons/${lessonId}/attendances`, { token });
}

export function getAttendanceStats(token) {
  return apiRequest('/attendance/stats', { token });
}
