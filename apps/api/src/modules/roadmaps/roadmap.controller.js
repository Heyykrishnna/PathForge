import { roadmapService } from './roadmap.service.js';

export class RoadmapController {
  async generate(req, res, next) {
    try {
      const userId = req.user.id;
      const { matchResultId, internshipId } = req.body;

      const roadmap = await roadmapService.generateRoadmap(userId, {
        matchResultId,
        internshipId
      });

      return res.status(201).json({
        success: true,
        data: roadmap
      });
    } catch (error) {
      return next(error);
    }
  }

  async list(req, res, next) {
    try {
      const userId = req.user.id;
      const roadmapsList = await roadmapService.listRoadmaps(userId);

      return res.status(200).json({
        success: true,
        data: roadmapsList
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const roadmap = await roadmapService.getRoadmapById(userId, id);

      return res.status(200).json({
        success: true,
        data: roadmap
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { title, status } = req.body;

      const updated = await roadmapService.updateRoadmap(userId, id, {
        title,
        status
      });

      return res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateTask(req, res, next) {
    try {
      const userId = req.user.id;
      const { id, taskId } = req.params;

      const result = await roadmapService.updateTask(userId, id, taskId, req.body);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }

  async listBridgeProjects(req, res, next) {
    try {
      const { skill } = req.query;
      const projects = await roadmapService.listBridgeProjects(skill);

      return res.status(200).json({
        success: true,
        data: projects
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const roadmapController = new RoadmapController();

