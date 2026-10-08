import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest, authenticate, authorize } from '../auth.js';

const router = Router();

router.get('/', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { entity, user } = req.query;
  let logs = db.getAuditLogs();

  if (entity) {
    logs = logs.filter((l) => l.entity === entity);
  }

  if (user) {
    logs = logs.filter((l) => l.user.toLowerCase().includes(String(user).toLowerCase()));
  }

  return res.json({ success: true, logs });
});

export default router;
