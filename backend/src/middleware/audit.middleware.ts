import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import AuditLog from '../models/AuditLog';

export const auditLog = (action: string, targetType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = (data: any) => {
      // Only log on successful operations
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const targetId = req.params.id || req.body?.id || 'N/A';

        AuditLog.create({
          actor: req.user._id,
          action,
          target_type: targetType,
          target_id: targetId,
          details: {
            method: req.method,
            path: req.originalUrl,
            body: req.body,
            statusCode: res.statusCode,
          },
          ip: req.ip || req.socket.remoteAddress || 'unknown',
        }).catch((err) => console.error('Audit log error:', err));
      }

      return originalJson(data);
    };

    next();
  };
};
