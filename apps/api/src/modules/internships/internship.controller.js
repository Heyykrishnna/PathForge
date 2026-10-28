import { internshipService } from './internship.service.js';

export class InternshipController {
  async list(req, res, next) {
    try {
      const { search, workMode, location, page, limit } = req.query;
      const userId = req.user?.id || null;

      const result = await internshipService.listInternships({
        search,
        workMode,
        location,
        page,
        limit,
        userId
      });

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || null;

      const internship = await internshipService.getInternshipById(id, userId);

      return res.status(200).json({
        success: true,
        data: internship
      });
    } catch (error) {
      return next(error);
    }
  }

  async save(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await internshipService.saveInternship(userId, id);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }

  async unsave(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await internshipService.unsaveInternship(userId, id);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }

  async listSaved(req, res, next) {
    try {
      const userId = req.user.id;

      const items = await internshipService.listSavedInternships(userId);

      return res.status(200).json({
        success: true,
        data: items
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const item = await internshipService.createInternship(req.body);

      return res.status(201).json({
        success: true,
        data: item
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const internshipController = new InternshipController();

