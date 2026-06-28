import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

export const jwtMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // For now, this is a placeholder
    // In production, verify JWT token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // TODO: Verify token and attach user to request
    req.user = { id: 'user-id', role: 'MEMBER' };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
