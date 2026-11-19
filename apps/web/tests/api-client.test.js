import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setAccessToken,
  getAccessToken,
  ApiError,
  request,
  apiClient
} from '../src/lib/api-client.js';

describe('Frontend API Client and State Management', () => {
  beforeEach(() => {
    setAccessToken(null);
    vi.restoreAllMocks();
  });

  it('manages current access token in memory', () => {
    expect(getAccessToken()).toBeNull();
    setAccessToken('mock-jwt-token-123');
    expect(getAccessToken()).toBe('mock-jwt-token-123');
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });

  it('creates ApiError with status, code, and details', () => {
    const error = new ApiError(400, 'VALIDATION_ERROR', 'Invalid inputs', [
      { field: 'email', message: 'Invalid email' }
    ]);
    expect(error.status).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid inputs');
    expect(error.details).toHaveLength(1);
    expect(error.name).toBe('ApiError');
  });

  it('attaches Authorization header when access token is present', async () => {
    setAccessToken('active-student-token');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { status: 'healthy' } })
    });
    global.fetch = mockFetch;

    await request('/health');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = mockFetch.mock.calls[0];
    expect(calledUrl).toContain('/health');
    expect(calledOptions.headers.Authorization).toBe(
      'Bearer active-student-token'
    );
    expect(calledOptions.credentials).toBe('include');
  });

  it('throws structured ApiError when server returns non-2xx status', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        error: {
          code: 'DUPLICATE_APPLICATION',
          message: 'An active application for this internship already exists',
          details: []
        }
      })
    });
    global.fetch = mockFetch;

    await expect(
      request('/applications', { method: 'POST' })
    ).rejects.toThrowError(
      'An active application for this internship already exists'
    );
  });

  it('exposes all required API domain methods', () => {
    expect(typeof apiClient.getHealth).toBe('function');
    expect(typeof apiClient.auth.login).toBe('function');
    expect(typeof apiClient.auth.register).toBe('function');
    expect(typeof apiClient.auth.me).toBe('function');
    expect(typeof apiClient.auth.logout).toBe('function');
    expect(typeof apiClient.profile.get).toBe('function');
    expect(typeof apiClient.profile.update).toBe('function');
    expect(typeof apiClient.resumes.upload).toBe('function');
    expect(typeof apiClient.resumes.analyze).toBe('function');
    expect(typeof apiClient.matching.analyze).toBe('function');
    expect(typeof apiClient.matching.getHistory).toBe('function');
    expect(typeof apiClient.roadmaps.generate).toBe('function');
    expect(typeof apiClient.roadmaps.updateTask).toBe('function');
    expect(typeof apiClient.applications.list).toBe('function');
    expect(typeof apiClient.applications.create).toBe('function');
    expect(typeof apiClient.applications.update).toBe('function');
    expect(typeof apiClient.dashboard.getOverview).toBe('function');
  });

  it('submits the GitHub authorization response with the signed-in session', async () => {
    setAccessToken('student-token');
    const fetchCallback = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: { username: 'octocat' } })
    });

    await expect(
      apiClient.github.completeConnection({
        code: 'provider-code',
        state: 'oauth-state'
      })
    ).resolves.toEqual({ data: { username: 'octocat' } });

    expect(fetchCallback).toHaveBeenCalledWith(
      expect.stringMatching(/\/github\/callback$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ code: 'provider-code', state: 'oauth-state' }),
        headers: expect.objectContaining({
          Authorization: 'Bearer student-token'
        })
      })
    );
  });
});
