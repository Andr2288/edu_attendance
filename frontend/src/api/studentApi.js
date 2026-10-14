import { apiRequest } from './client';

export function checkIn(token, payload) {
  return apiRequest('/attendance/check-in', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function getMyAttendances(token) {
  return apiRequest('/attendance/me', { token });
}
