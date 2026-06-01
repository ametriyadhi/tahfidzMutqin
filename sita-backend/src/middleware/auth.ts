import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    name: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'sita_super_secret_jwt_key_2026';

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
      if (err) {
        res.status(403).json({ error: 'Token tidak valid' });
        return;
      }

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name
      };
      next();
    });
  } else {
    res.status(401).json({ error: 'Header otorisasi diperlukan' });
  }
};

export const authorizeRoles = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Tidak terautentikasi' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Akses ditolak: Peran tidak memiliki izin' });
      return;
    }

    next();
  };
};
