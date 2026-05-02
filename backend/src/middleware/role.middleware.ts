import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const hasRole = req.user.role.some((r) => roles.includes(r));
    if (!hasRole) {
      res.status(403).json({
        message: 'Insufficient permissions',
        required: roles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
};
