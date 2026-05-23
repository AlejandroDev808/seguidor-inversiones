import { Request, Response, NextFunction } from 'express';
import { admin } from './firebase-admin.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado: falta token.' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    (req as any).uid = decoded.uid;
    next();
  } catch {
    return res.status(401).json({ error: 'No autorizado: token inválido o expirado.' });
  }
}
