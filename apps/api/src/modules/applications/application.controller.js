import { applicationService } from './application.service.js';

export class ApplicationController {
  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const appRecord = await applicationService.createApplication(userId, req.body);

      return res.status(201).json({
        success: true,
        data: appRecord
      });
    } catch (error) {
      return next(error);
    }
  }

  async list(req, res, next) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const list = await applicationService.listApplications(userId, { status });

      return res.status(200).json({
        success: true,
        data: list
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const appRecord = await applicationService.getApplicationById(userId, id);

      return res.status(200).json({
        success: true,
        data: appRecord
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const updated = await applicationService.updateApplication(userId, id, req.body);

      return res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await applicationService.deleteApplication(userId, id);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const applicationController = new ApplicationController();

