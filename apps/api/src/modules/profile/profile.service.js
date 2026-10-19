import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { profiles, educations, skills, userSkills } from '../../db/schema/index.js';
import { ApiError } from '../../utils/api-error.js';
import { calculateProfileCompletion } from '../../utils/profile-calculator.js';

export class ProfileService {
  async getProfile(userId) {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!profile) {
      throw ApiError.notFound('Profile not found');
    }

    const educationList = await db
      .select()
      .from(educations)
      .where(eq(educations.userId, userId))
      .orderBy(desc(educations.startDate));

    const skillRows = await db
      .select({
        id: userSkills.id,
        skillId: skills.id,
        name: skills.name,
        category: skills.category,
        proficiencyLevel: userSkills.proficiencyLevel,
        createdAt: userSkills.createdAt
      })
      .from(userSkills)
      .innerJoin(skills, eq(userSkills.skillId, skills.id))
      .where(eq(userSkills.userId, userId));

    const completionPercentage = calculateProfileCompletion(profile, educationList, skillRows);

    if (completionPercentage !== profile.completionPercentage) {
      await db
        .update(profiles)
        .set({
          completionPercentage,
          updatedAt: new Date()
        })
        .where(eq(profiles.userId, userId));
      profile.completionPercentage = completionPercentage;
    }

    return {
      profile,
      educations: educationList,
      skills: skillRows
    };
  }

  async updateProfile(userId, updateData) {
    const [existing] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!existing) {
      throw ApiError.notFound('Profile not found');
    }

    const [updated] = await db
      .update(profiles)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(profiles.userId, userId))
      .returning();

    const educationList = await db
      .select()
      .from(educations)
      .where(eq(educations.userId, userId));

    const skillList = await db
      .select()
      .from(userSkills)
      .where(eq(userSkills.userId, userId));

    const completionPercentage = calculateProfileCompletion(updated, educationList, skillList);

    if (completionPercentage !== updated.completionPercentage) {
      const [finalProfile] = await db
        .update(profiles)
        .set({
          completionPercentage,
          updatedAt: new Date()
        })
        .where(eq(profiles.userId, userId))
        .returning();
      return finalProfile;
    }

    return updated;
  }

  async addEducation(userId, data) {
    const [created] = await db
      .insert(educations)
      .values({
        userId,
        institution: data.institution,
        degree: data.degree,
        fieldOfStudy: data.fieldOfStudy,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isCurrent: Boolean(data.isCurrent),
        gpa: data.gpa || null
      })
      .returning();

    await this.refreshCompletionPercentage(userId);

    return created;
  }

  async updateEducation(userId, educationId, data) {
    const [existing] = await db
      .select()
      .from(educations)
      .where(and(eq(educations.id, educationId), eq(educations.userId, userId)))
      .limit(1);

    if (!existing) {
      throw ApiError.notFound('Education entry not found or unauthorized');
    }

    const [updated] = await db
      .update(educations)
      .set({
        institution: data.institution ?? existing.institution,
        degree: data.degree ?? existing.degree,
        fieldOfStudy: data.fieldOfStudy ?? existing.fieldOfStudy,
        startDate: data.startDate ? new Date(data.startDate) : existing.startDate,
        endDate: data.endDate ? new Date(data.endDate) : (data.endDate === null ? null : existing.endDate),
        isCurrent: data.isCurrent !== undefined ? Boolean(data.isCurrent) : existing.isCurrent,
        gpa: data.gpa !== undefined ? data.gpa : existing.gpa,
        updatedAt: new Date()
      })
      .where(and(eq(educations.id, educationId), eq(educations.userId, userId)))
      .returning();

    await this.refreshCompletionPercentage(userId);

    return updated;
  }

  async deleteEducation(userId, educationId) {
    const [existing] = await db
      .select()
      .from(educations)
      .where(and(eq(educations.id, educationId), eq(educations.userId, userId)))
      .limit(1);

    if (!existing) {
      throw ApiError.notFound('Education entry not found or unauthorized');
    }

    await db
      .delete(educations)
      .where(and(eq(educations.id, educationId), eq(educations.userId, userId)));

    await this.refreshCompletionPercentage(userId);

    return { success: true };
  }

  async syncSkills(userId, skillsToSync) {
    await db.delete(userSkills).where(eq(userSkills.userId, userId));

    const syncedList = [];

    for (const item of skillsToSync) {
      const normalizedName = item.name.trim();

      let [skillRecord] = await db
        .select()
        .from(skills)
        .where(eq(skills.name, normalizedName))
        .limit(1);

      if (!skillRecord) {
        [skillRecord] = await db
          .insert(skills)
          .values({
            name: normalizedName,
            category: item.category || 'general'
          })
          .returning();
      }

      const [userSkillRecord] = await db
        .insert(userSkills)
        .values({
          userId,
          skillId: skillRecord.id,
          proficiencyLevel: item.proficiencyLevel || 'intermediate'
        })
        .returning();

      syncedList.push({
        id: userSkillRecord.id,
        skillId: skillRecord.id,
        name: skillRecord.name,
        category: skillRecord.category,
        proficiencyLevel: userSkillRecord.proficiencyLevel
      });
    }

    await this.refreshCompletionPercentage(userId);

    return syncedList;
  }

  async refreshCompletionPercentage(userId) {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!profile) return;

    const educationList = await db
      .select()
      .from(educations)
      .where(eq(educations.userId, userId));

    const skillList = await db
      .select()
      .from(userSkills)
      .where(eq(userSkills.userId, userId));

    const completionPercentage = calculateProfileCompletion(profile, educationList, skillList);

    await db
      .update(profiles)
      .set({
        completionPercentage,
        updatedAt: new Date()
      })
      .where(eq(profiles.userId, userId));
  }
}

export const profileService = new ProfileService();

