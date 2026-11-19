import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import ProfilePage from '../src/app/profile/page';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('../src/lib/auth-context', () => ({
  useAuth: () => ({
    user: { email: 'student@example.invalid', isEmailVerified: true },
    profile: { completionPercentage: 0 },
    isLoading: false,
    logout: vi.fn(),
    refreshProfile: vi.fn()
  })
}));

describe('Unified student profile', () => {
  it('renders every profile area together without switching tabs', () => {
    const markup = renderToStaticMarkup(<ProfilePage />);

    for (const area of [
      'personal',
      'education',
      'skills',
      'resumes',
      'github',
      'evidence'
    ]) {
      expect(markup).toContain(`aria-labelledby="${area}-title"`);
    }
    expect(markup).toContain('Save Personal Details');
    expect(markup).toContain('Save Education');
    expect(markup).toContain('Select PDF File');
    expect(markup).toContain('Connect GitHub');
    expect(markup).not.toContain('role="tab"');
  });

  it('keeps personal details, education, and skills in separate forms', () => {
    const markup = renderToStaticMarkup(<ProfilePage />);

    expect(markup.match(/<form\b/g)).toHaveLength(3);
    expect(markup).toContain('for="profile-firstName"');
    expect(markup).toContain('for="education-institution"');
    expect(markup).toContain('for="skill-name"');
  });

  it('represents an empty profile without assigning a default completion score', () => {
    const markup = renderToStaticMarkup(<ProfilePage />);

    expect(markup).toMatch(/<progress[^>]*value="0"/);
    expect(markup).toContain('No education added yet.');
    expect(markup).toContain('No skills added yet.');
    expect(markup).toContain('No resumes uploaded yet.');
  });
});
