const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

let currentAccessToken = null;

export function setAccessToken(token) {
  currentAccessToken = token;
}

export function getAccessToken() {
  return currentAccessToken;
}

export class ApiError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function request(path, options = {}) {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = { ...options.headers };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (currentAccessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${currentAccessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorData = payload?.error || {
      code: 'UNKNOWN_ERROR',
      message: `Request failed with status ${response.status}`,
      details: []
    };
    throw new ApiError(
      response.status,
      errorData.code,
      errorData.message,
      errorData.details
    );
  }

  return payload;
}

export const apiClient = {
  getHealth: () => request('/health'),

  auth: {
    register: (data) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: async (data) => {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res.data?.accessToken) {
        setAccessToken(res.data.accessToken);
      }
      return res;
    },
    logout: async () => {
      try {
        await request('/auth/logout', { method: 'POST' });
      } finally {
        setAccessToken(null);
      }
    },
    refresh: async () => {
      const res = await request('/auth/refresh', { method: 'POST' });
      if (res.data?.accessToken) {
        setAccessToken(res.data.accessToken);
      }
      return res;
    },
    me: () => request('/auth/me'),
    verifyOtp: async (data) => {
      const res = await request('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res.data?.accessToken) {
        setAccessToken(res.data.accessToken);
      }
      return res;
    },
    resendOtp: (data) =>
      request('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    verifyEmail: (token) =>
      request('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token })
      }),
    forgotPassword: (email) =>
      request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),
    resetPassword: (token, newPassword) =>
      request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword })
      })
  },

  profile: {
    get: () => request('/profile'),
    update: (data) =>
      request('/profile', { method: 'PATCH', body: JSON.stringify(data) }),
    addEducation: (data) =>
      request('/profile/educations', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateEducation: (id, data) =>
      request(`/profile/educations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    deleteEducation: (id) =>
      request(`/profile/educations/${id}`, { method: 'DELETE' }),
    syncSkills: (skills) =>
      request('/profile/skills', {
        method: 'POST',
        body: JSON.stringify({ skills })
      })
  },

  resumes: {
    upload: (formData) =>
      request('/resumes/upload', { method: 'POST', body: formData }),
    list: () => request('/resumes'),
    get: (id) => request(`/resumes/${id}`),
    analyze: (id) => request(`/resumes/${id}/analyze`, { method: 'POST' }),
    confirm: (id, data) =>
      request(`/resumes/${id}/confirm`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  github: {
    connect: () => request('/github/connect'),
    getAccount: () => request('/github/account'),
    sync: () => request('/github/sync', { method: 'POST' }),
    disconnect: () => request('/github/connection', { method: 'DELETE' })
  },

  evidence: {
    list: () => request('/evidence'),
    confirm: (id, data) =>
      request(`/evidence/${id}/confirm`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    delete: (id) => request(`/evidence/${id}`, { method: 'DELETE' })
  },

  internships: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.workMode) query.set('workMode', params.workMode);
      if (params.location) query.set('location', params.location);
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      const qs = query.toString();
      return request(`/internships${qs ? `?${qs}` : ''}`);
    },
    get: (id) => request(`/internships/${id}`),
    save: (id) => request(`/internships/${id}/save`, { method: 'POST' }),
    unsave: (id) => request(`/internships/${id}/save`, { method: 'DELETE' }),
    listSaved: () => request('/internships/saved')
  },

  matching: {
    analyze: (internshipId) =>
      request('/matching/analyze', {
        method: 'POST',
        body: JSON.stringify({ internshipId })
      }),
    getResult: (id) => request(`/matching/results/${id}`),
    getHistory: (internshipId) => {
      const qs = internshipId ? `?internshipId=${internshipId}` : '';
      return request(`/matching/history${qs}`);
    }
  },

  roadmaps: {
    generate: (data) =>
      request('/roadmaps/generate', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    list: () => request('/roadmaps'),
    get: (id) => request(`/roadmaps/${id}`),
    update: (id, data) =>
      request(`/roadmaps/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    updateTask: (roadmapId, taskId, data) =>
      request(`/roadmaps/${roadmapId}/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    listBridgeProjects: (skill) => {
      const qs = skill ? `?skill=${encodeURIComponent(skill)}` : '';
      return request(`/roadmaps/bridge-projects${qs}`);
    }
  },

  applications: {
    list: (status) => {
      const qs = status ? `?status=${encodeURIComponent(status)}` : '';
      return request(`/applications${qs}`);
    },
    create: (data) =>
      request('/applications', { method: 'POST', body: JSON.stringify(data) }),
    get: (id) => request(`/applications/${id}`),
    update: (id, data) =>
      request(`/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    delete: (id) => request(`/applications/${id}`, { method: 'DELETE' })
  },

  dashboard: {
    getOverview: () => request('/dashboard/overview')
  }
};
