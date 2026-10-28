import { eq, and, or, ilike, sql, desc, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  internships,
  internshipSkills,
  skills,
  savedInternships
} from '../../db/schema/index.js';
import { ApiError } from '../../utils/api-error.js';

export class InternshipService {
  async listInternships({
    search = '',
    workMode = 'all',
    location = '',
    page = 1,
    limit = 10,
    userId = null
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];

    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(internships.title, searchPattern),
          ilike(internships.company, searchPattern),
          ilike(internships.description, searchPattern)
        )
      );
    }

    if (workMode && workMode !== 'all') {
      conditions.push(eq(internships.workMode, workMode));
    }

    if (location && location.trim()) {
      conditions.push(ilike(internships.location, `%${location.trim()}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql`count(*)` })
      .from(internships)
      .where(whereClause);

    const total = parseInt(countResult?.count || 0, 10);

    const rows = await db
      .select()
      .from(internships)
      .where(whereClause)
      .orderBy(desc(internships.verifiedAt))
      .limit(limitNum)
      .offset(offset);

    if (rows.length === 0) {
      return {
        internships: [],
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 0
        }
      };
    }

    const internshipIds = rows.map(r => r.id);

    const skillLinks = await db
      .select({
        internshipId: internshipSkills.internshipId,
        skillId: skills.id,
        name: skills.name,
        category: skills.category,
        isRequired: internshipSkills.isRequired,
        importance: internshipSkills.importance
      })
      .from(internshipSkills)
      .innerJoin(skills, eq(internshipSkills.skillId, skills.id))
      .where(inArray(internshipSkills.internshipId, internshipIds));

    let savedIdsSet = new Set();
    if (userId) {
      const savedRows = await db
        .select({ internshipId: savedInternships.internshipId })
        .from(savedInternships)
        .where(
          and(
            eq(savedInternships.userId, userId),
            inArray(savedInternships.internshipId, internshipIds)
          )
        );
      savedIdsSet = new Set(savedRows.map(s => s.internshipId));
    }

    const enriched = rows.map(item => {
      const itemSkills = skillLinks.filter(s => s.internshipId === item.id);
      const requiredSkills = itemSkills.filter(s => s.isRequired);
      const preferredSkills = itemSkills.filter(s => !s.isRequired);
      const daysSinceVerified = Math.max(
        0,
        Math.floor((Date.now() - new Date(item.verifiedAt).getTime()) / (1000 * 60 * 60 * 24))
      );

      return {
        ...item,
        requiredSkills,
        preferredSkills,
        isSaved: savedIdsSet.has(item.id),
        freshness: {
          verifiedAt: item.verifiedAt,
          daysSinceVerified,
          isFresh: daysSinceVerified <= 14
        }
      };
    });

    return {
      internships: enriched,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  async getInternshipById(id, userId = null) {
    const [item] = await db
      .select()
      .from(internships)
      .where(eq(internships.id, id))
      .limit(1);

    if (!item) {
      throw ApiError.notFound('Internship not found');
    }

    const skillLinks = await db
      .select({
        skillId: skills.id,
        name: skills.name,
        category: skills.category,
        isRequired: internshipSkills.isRequired,
        importance: internshipSkills.importance
      })
      .from(internshipSkills)
      .innerJoin(skills, eq(internshipSkills.skillId, skills.id))
      .where(eq(internshipSkills.internshipId, id));

    let isSaved = false;
    if (userId) {
      const [saved] = await db
        .select({ id: savedInternships.id })
        .from(savedInternships)
        .where(
          and(
            eq(savedInternships.userId, userId),
            eq(savedInternships.internshipId, id)
          )
        )
        .limit(1);
      isSaved = !!saved;
    }

    const daysSinceVerified = Math.max(
      0,
      Math.floor((Date.now() - new Date(item.verifiedAt).getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      ...item,
      requiredSkills: skillLinks.filter(s => s.isRequired),
      preferredSkills: skillLinks.filter(s => !s.isRequired),
      isSaved,
      freshness: {
        verifiedAt: item.verifiedAt,
        daysSinceVerified,
        isFresh: daysSinceVerified <= 14
      }
    };
  }

  async saveInternship(userId, internshipId) {
    const [existingInternship] = await db
      .select({ id: internships.id })
      .from(internships)
      .where(eq(internships.id, internshipId))
      .limit(1);

    if (!existingInternship) {
      throw ApiError.notFound('Internship not found');
    }

    const [alreadySaved] = await db
      .select({ id: savedInternships.id })
      .from(savedInternships)
      .where(
        and(
          eq(savedInternships.userId, userId),
          eq(savedInternships.internshipId, internshipId)
        )
      )
      .limit(1);

    if (!alreadySaved) {
      await db.insert(savedInternships).values({
        userId,
        internshipId
      });
    }

    return { saved: true, internshipId };
  }

  async unsaveInternship(userId, internshipId) {
    await db
      .delete(savedInternships)
      .where(
        and(
          eq(savedInternships.userId, userId),
          eq(savedInternships.internshipId, internshipId)
        )
      );

    return { saved: false, internshipId };
  }

  async listSavedInternships(userId) {
    const saved = await db
      .select({
        savedId: savedInternships.id,
        savedAt: savedInternships.createdAt,
        internship: internships
      })
      .from(savedInternships)
      .innerJoin(internships, eq(savedInternships.internshipId, internships.id))
      .where(eq(savedInternships.userId, userId))
      .orderBy(desc(savedInternships.createdAt));

    if (saved.length === 0) {
      return [];
    }

    const internshipIds = saved.map(s => s.internship.id);

    const skillLinks = await db
      .select({
        internshipId: internshipSkills.internshipId,
        skillId: skills.id,
        name: skills.name,
        category: skills.category,
        isRequired: internshipSkills.isRequired,
        importance: internshipSkills.importance
      })
      .from(internshipSkills)
      .innerJoin(skills, eq(internshipSkills.skillId, skills.id))
      .where(inArray(internshipSkills.internshipId, internshipIds));

    return saved.map(row => {
      const item = row.internship;
      const itemSkills = skillLinks.filter(s => s.internshipId === item.id);
      const daysSinceVerified = Math.max(
        0,
        Math.floor((Date.now() - new Date(item.verifiedAt).getTime()) / (1000 * 60 * 60 * 24))
      );

      return {
        ...item,
        savedAt: row.savedAt,
        isSaved: true,
        requiredSkills: itemSkills.filter(s => s.isRequired),
        preferredSkills: itemSkills.filter(s => !s.isRequired),
        freshness: {
          verifiedAt: item.verifiedAt,
          daysSinceVerified,
          isFresh: daysSinceVerified <= 14
        }
      };
    });
  }

  async createInternship(data) {
    const {
      title,
      company,
      location,
      workMode = 'hybrid',
      description,
      sourceUrl = null,
      sourceName = 'Curated Direct',
      minGpa = null,
      eligibleGraduationYears = [],
      requiresWorkAuth = false,
      skillsList = []
    } = data;

    if (!title || !company || !location || !description) {
      throw ApiError.badRequest('Missing required internship fields');
    }

    const [created] = await db
      .insert(internships)
      .values({
        title,
        company,
        location,
        workMode,
        description,
        sourceUrl,
        sourceName,
        minGpa,
        eligibleGraduationYears,
        requiresWorkAuth,
        verifiedAt: new Date()
      })
      .returning();

    for (const skillReq of skillsList) {
      let [skillRecord] = await db
        .select()
        .from(skills)
        .where(eq(skills.name, skillReq.name))
        .limit(1);

      if (!skillRecord) {
        [skillRecord] = await db
          .insert(skills)
          .values({
            name: skillReq.name,
            category: skillReq.category || 'technical'
          })
          .returning();
      }

      await db.insert(internshipSkills).values({
        internshipId: created.id,
        skillId: skillRecord.id,
        isRequired: skillReq.isRequired !== false,
        importance: skillReq.importance || 1
      });
    }

    return this.getInternshipById(created.id);
  }
}

export const internshipService = new InternshipService();

