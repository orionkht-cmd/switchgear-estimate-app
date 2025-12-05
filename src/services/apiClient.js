const getStoredBaseUrl = () => {
  if (typeof window !== 'undefined') {
    try {
      if (window.__backend_base_url) return window.__backend_base_url;
    } catch (e) {
      // ignore errors
    }
  }

  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  // 기본값: 회사 공용 백엔드 주소 (Tailscale Funnel)
  return 'https://vm-p1m.tailac2d43.ts.net';
};

export const getApiBaseUrl = () => {
  const base = getStoredBaseUrl();
  if (!base) return '';
  return base.replace(/\/+$/, '');
};

export const apiRequest = async (path, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url =
    path.startsWith('http://') || path.startsWith('https://')
      ? path
      : `${baseUrl}${path}`;

  const headers = { ...(options.headers || {}) };

  let body = options.body;

  if (typeof window !== 'undefined') {
    try {
      const apiKey = window.localStorage.getItem('apiKey');
      if (apiKey && !headers['x-api-key']) {
        headers['x-api-key'] = apiKey;
      }
    } catch (e) {
      // ignore
    }
  }

  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    if (headers['Content-Type'].includes('application/json')) {
      body = JSON.stringify(body);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body,
  });

  if (!response.ok) {
    let errorPayload = null;
    try {
      errorPayload = await response.json();
    } catch (e) {
      try {
        errorPayload = await response.text();
      } catch (e2) {
        errorPayload = null;
      }
    }

    const error = new Error('API request failed');
    error.status = response.status;
    error.payload = errorPayload;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const projectApi = {
  health: () => apiRequest('/api/health'),
  verifyKey: () => apiRequest('/api/verify-key'),

  list: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        qs.append(key, String(value));
      }
    });
    const queryString = qs.toString();
    const path = queryString ? `/api/projects?${queryString}` : '/api/projects';
    return apiRequest(path);
  },

  get: (id) => apiRequest(`/api/projects/${id}`),

  create: (data) => apiRequest('/api/projects', {
    method: 'POST',
    body: data,
  }),

  update: (id, data) => apiRequest(`/api/projects/${id}`, {
    method: 'PUT',
    body: data,
  }),

  remove: (id) => apiRequest(`/api/projects/${id}`, {
    method: 'DELETE',
  }),

  addRevision: (projectId, data) => apiRequest(`/api/projects/${projectId}/revisions`, {
    method: 'POST',
    body: data,
  }),

  updateRevision: (projectId, revisionId, data) =>
    apiRequest(`/api/projects/${projectId}/revisions/${revisionId}`, {
      method: 'PUT',
      body: data,
    }),

  updateStatus: (projectId, status) => apiRequest(`/api/projects/${projectId}/status`, {
    method: 'PUT',
    body: { status },
  }),

  updateProgress: (projectId, stage) =>
    apiRequest(`/api/projects/${projectId}/progress`, {
      method: 'PUT',
      body: { stage },
    }),

  createMemo: (projectId, data) => apiRequest(`/api/projects/${projectId}/memos`, {
    method: 'POST',
    body: data,
  }),

  updateMemo: (projectId, memoId, data) =>
    apiRequest(`/api/projects/${projectId}/memos/${memoId}`, {
      method: 'PUT',
      body: data,
    }),

  deleteMemo: (projectId, memoId, data = {}) =>
    apiRequest(`/api/projects/${projectId}/memos/${memoId}`, {
      method: 'DELETE',
      body: Object.keys(data).length ? data : undefined,
    }),

  backupDownload: () => apiRequest('/api/backup/projects'),

  backupRestore: (projects) => apiRequest('/api/backup/projects', {
    method: 'POST',
    body: projects,
  }),
};
