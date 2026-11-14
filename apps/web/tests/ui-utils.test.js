import { describe, it, expect } from 'vitest';

function formatDeadlineStatus(deadlineStr) {
  if (!deadlineStr) return { label: 'No deadline set', isUrgent: false };
  const deadlineDate = new Date(deadlineStr);
  const now = new Date();
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Expired', isUrgent: true };
  if (diffDays === 0) return { label: 'Due today', isUrgent: true };
  if (diffDays <= 3) return { label: `Due in ${diffDays} days`, isUrgent: true };
  return { label: `Due in ${diffDays} days`, isUrgent: false };
}

function calculateProgress(completedTasks, totalTasks) {
  if (!totalTasks || totalTasks <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((completedTasks / totalTasks) * 100)));
}

function getStatusBadgeClass(status) {
  const map = {
    saved: 'bg-zinc-800 text-zinc-300',
    preparing: 'bg-amber-950 text-amber-300',
    ready: 'bg-sky-950 text-sky-300',
    applied: 'bg-emerald-950 text-emerald-300',
    interviewing: 'bg-purple-950 text-purple-300',
    offered: 'bg-green-950 text-green-300',
    rejected: 'bg-rose-950 text-rose-300'
  };
  return map[status] || 'bg-zinc-800 text-zinc-300';
}

describe('Frontend UI Formatting and Calculations', () => {
  it('formats deadline urgency based on remaining days', () => {
    expect(formatDeadlineStatus(null).label).toBe('No deadline set');
    expect(formatDeadlineStatus(null).isUrgent).toBe(false);

    const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatDeadlineStatus(pastDate).label).toBe('Expired');
    expect(formatDeadlineStatus(pastDate).isUrgent).toBe(true);

    const nearDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatDeadlineStatus(nearDate).label).toBe('Due in 2 days');
    expect(formatDeadlineStatus(nearDate).isUrgent).toBe(true);

    const farDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatDeadlineStatus(farDate).isUrgent).toBe(false);
  });

  it('calculates progress percentage clamped between 0 and 100', () => {
    expect(calculateProgress(0, 7)).toBe(0);
    expect(calculateProgress(1, 7)).toBe(14);
    expect(calculateProgress(7, 7)).toBe(100);
    expect(calculateProgress(10, 7)).toBe(100);
    expect(calculateProgress(-1, 7)).toBe(0);
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it('maps application status to appropriate badge classes', () => {
    expect(getStatusBadgeClass('saved')).toContain('text-zinc-300');
    expect(getStatusBadgeClass('applied')).toContain('text-emerald-300');
    expect(getStatusBadgeClass('interviewing')).toContain('text-purple-300');
    expect(getStatusBadgeClass('unknown')).toContain('text-zinc-300');
  });
});

