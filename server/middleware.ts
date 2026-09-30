import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { AdminRole, AdminUser, User } from './types';

// In-memory session stores mapping tokens to IDs (backed by db singleton)
export const userSessions = db.userSessions;
export const adminSessions = db.adminSessions;

export interface AuthenticatedUserRequest extends Request {
  user?: User;
}

export interface AuthenticatedAdminRequest extends Request {
  admin?: AdminUser;
}

export function requireUser(req: AuthenticatedUserRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const userId = db.userSessions.get(token);

  if (!userId) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }

  const user = db.users.get(userId);
  if (!user || !user.isActive) {
    return res.status(403).json({ error: 'User account is inactive or suspended.' });
  }

  req.user = user;
  next();
}

export function requireAdmin(allowedRoles?: AdminRole[]) {
  return (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['x-admin-token'] || req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Admin authentication required.' });
    }

    const token = String(authHeader).replace('Bearer ', '').trim();
    const adminId = db.adminSessions.get(token);

    if (!adminId) {
      return res.status(401).json({ error: 'Invalid or expired admin session.' });
    }

    const admin = db.admins.get(adminId);
    if (!admin || !admin.isActive) {
      return res.status(403).json({ error: 'Admin account is deactivated.' });
    }

    if (allowedRoles && allowedRoles.length > 0) {
      // super_admin always has access
      if (admin.role !== 'super_admin' && !allowedRoles.includes(admin.role)) {
        return res.status(403).json({
          error: `Access Denied: Requires role [${allowedRoles.join(', ')}]. Your role is ${admin.role}.`,
        });
      }
    }

    req.admin = admin;
    next();
  };
}
