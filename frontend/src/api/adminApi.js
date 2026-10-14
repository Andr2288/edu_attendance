import { apiRequest } from './client';

export function getGroups(token) {
  return apiRequest('/groups', { token });
}

export function createGroup(token, name) {
  return apiRequest('/groups', {
    method: 'POST',
    token,
    body: { name },
  });
}

export function updateGroup(token, id, name) {
  return apiRequest(`/groups/${id}`, {
    method: 'PUT',
    token,
    body: { name },
  });
}

export function deleteGroup(token, id) {
  return apiRequest(`/groups/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function getDisciplines(token) {
  return apiRequest('/disciplines', { token });
}

export function createDiscipline(token, name) {
  return apiRequest('/disciplines', {
    method: 'POST',
    token,
    body: { name },
  });
}

export function updateDiscipline(token, id, name) {
  return apiRequest(`/disciplines/${id}`, {
    method: 'PUT',
    token,
    body: { name },
  });
}

export function deleteDiscipline(token, id) {
  return apiRequest(`/disciplines/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function getUsers(token) {
  return apiRequest('/users', { token });
}

export function createUser(token, payload) {
  return apiRequest('/users', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function updateUser(token, id, payload) {
  return apiRequest(`/users/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
}

export function deleteUser(token, id) {
  return apiRequest(`/users/${id}`, {
    method: 'DELETE',
    token,
  });
}
