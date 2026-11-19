import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const KNOWN_SKILLS = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'Go',
  'Rust',
  'Ruby',
  'PHP',
  'SQL',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Redis',
  'React',
  'Next.js',
  'Node.js',
  'Express',
  'Vue',
  'Angular',
  'Django',
  'FastAPI',
  'Flask',
  'Spring Boot',
  'Docker',
  'Kubernetes',
  'AWS',
  'GCP',
  'Azure',
  'Git',
  'Linux',
  'GraphQL',
  'Tailwind CSS',
  'CI/CD',
  'Terraform'
];

export async function extractTextFromPdf(buffer) {
  let parsedText = '';
  try {
    const { PDFParse } = require('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    parsedText = (result.text || '').replace(/-- \d+ of \d+ --/g, '').trim();
  } catch {
    parsedText = '';
  }

  if (parsedText.length > 20) {
    return parsedText;
  }

  const rawString = buffer.toString('utf8');
  const matches = [];
  const textRegex = /\(([^()]+)\)\s*Tj/g;
  let match;
  while ((match = textRegex.exec(rawString)) !== null) {
    matches.push(match[1].trim());
  }
  if (matches.length > 0) {
    return matches.join(' ');
  }

  const cleaned = rawString.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
  return parsedText ? `${parsedText}\n${cleaned}` : cleaned;
}

export function parseResumeText(rawText) {
  const normalized = rawText || '';

  const foundSkills = [];
  for (const skill of KNOWN_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(normalized)) {
      foundSkills.push({
        name: skill,
        confidence: 0.9,
        context: `Mentioned in resume text`
      });
    }
  }

  const lines = normalized.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const projects = [];
  const educations = [];
  let currentSection = 'general';

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    if (/^(education|academic background)/i.test(lowerLine)) {
      currentSection = 'education';
      continue;
    } else if (/^(projects|technical projects|personal projects)/i.test(lowerLine)) {
      currentSection = 'projects';
      continue;
    } else if (/^(experience|work experience|employment)/i.test(lowerLine)) {
      currentSection = 'experience';
      continue;
    } else if (/^(skills|technical skills)/i.test(lowerLine)) {
      currentSection = 'skills';
      continue;
    }

    if (currentSection === 'education' && line.length > 4) {
      if (/bachelor|master|degree|university|college|institute|gpa/i.test(line)) {
        educations.push(line);
      }
    } else if (currentSection === 'projects' && line.length > 5) {
      projects.push(line);
    }
  }

  return {
    skills: foundSkills,
    educations: educations.slice(0, 5),
    projects: projects.slice(0, 10),
    summary: lines.slice(0, 3).join(' ')
  };
}
