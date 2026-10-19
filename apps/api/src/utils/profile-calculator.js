export function calculateProfileCompletion(profile, educations = [], userSkills = []) {
  let score = 0;

  if (profile.firstName && profile.lastName) {
    score += 20;
  }

  if (profile.bio && profile.bio.trim().length > 0) {
    score += 15;
  }

  if (profile.location && profile.location.trim().length > 0) {
    score += 15;
  }

  if (profile.phone || profile.website || profile.githubUrl || profile.linkedinUrl) {
    score += 10;
  }

  if (educations.length > 0) {
    score += 20;
  }

  if (userSkills.length > 0) {
    score += 20;
  }

  return Math.min(100, score);
}

