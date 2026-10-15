import { ApiError } from '../utils/api-error.js';

export function validateRequest(schemas = {}) {
  return (req, res, next) => {
    const targets = ['body', 'query', 'params'];

    for (const target of targets) {
      const schema = schemas[target];
      if (!schema) continue;

      const result = schema.safeParse(req[target]);
      if (!result.success) {
        const details = result.error.issues.map(issue => ({
          field: issue.path.length > 0 ? issue.path.join('.') : target,
          message: issue.message
        }));
        return next(ApiError.validation('The request could not be validated.', details));
      }

      req[target] = result.data;
    }

    return next();
  };
}

