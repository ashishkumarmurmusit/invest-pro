export const API_BASE = '/api';

export function getUserToken(): string | null {
  return localStorage.getItem('nexus_user_token');
}

export function setUserToken(token: string | null) {
  if (token) {
    localStorage.setItem('nexus_user_token', token);
  } else {
    localStorage.removeItem('nexus_user_token');
  }
}

export function getAdminToken(): string | null {
  return localStorage.getItem('nexus_admin_token');
}

export function setAdminToken(token: string | null) {
  if (token) {
    localStorage.setItem('nexus_admin_token', token);
  } else {
    localStorage.removeItem('nexus_admin_token');
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isAdmin: boolean = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (isAdmin) {
    const adminToken = getAdminToken();
    if (adminToken) {
      headers['x-admin-token'] = adminToken;
    }
  } else {
    const userToken = getUserToken();
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}
