import { dashboardService } from './dashboard.service.js';

export class DashboardController {
  async getOverview(req, res, next) {
    try {
      const userId = req.user.id;
      const overview = await dashboardService.getOverview(userId);

      return res.status(200).json({
        success: true,
        data: overview
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const dashboardController = new DashboardController();

