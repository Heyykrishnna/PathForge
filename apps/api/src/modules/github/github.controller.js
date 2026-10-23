import { HTTP_STATUS, createSuccessEnvelope } from '@pathforge/shared';
import { githubService } from './github.service.js';

export class GitHubController {
  constructor(service = githubService) {
    this.service = service;
  }

  connect = async (req, res, next) => {
    try {
      const result = await this.service.generateConnectUrl(req.user.id);
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };

  callback = async (req, res, next) => {
    try {
      const { code, state } = req.query;
      const result = await this.service.handleCallback(req.user.id, { code, state });
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };

  sync = async (req, res, next) => {
    try {
      const result = await this.service.syncRepositories(req.user.id);
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };

  getAccount = async (req, res, next) => {
    try {
      const result = await this.service.getAccount(req.user.id);
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };

  disconnect = async (req, res, next) => {
    try {
      const result = await this.service.disconnect(req.user.id);
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };
}

export const githubController = new GitHubController();

