import { matchingService } from './matching.service.js';
import { ApiError } from '../../utils/api-error.js';

export class MatchingController {
  async analyze(req, res, next) {
    try {
      const { internshipId } = req.body;
      const userId = req.user.id;

      if (!internshipId) {
        throw ApiError.badRequest('internshipId is required');
      }

      const result = await matchingService.runMatchAnalysis(userId, internshipId);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }

  async getResult(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await matchingService.getMatchResult(userId, id);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      return next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const { internshipId } = req.query;
      const userId = req.user.id;

      const history = await matchingService.listMatchHistory(userId, internshipId);

      return res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const matchingController = new MatchingController();

