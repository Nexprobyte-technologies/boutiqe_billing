import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken, AuthenticatedRequest, authenticate } from '../auth.js';

const router = Router();

router.post('/login', (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const users = db.getUsers();
  const loginName = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === loginName || u.name.toLowerCase() === loginName);

  if (!user || !user.active) {
    return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
  }

  const matches = bcrypt.compareSync(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = generateToken(user);
  db.logAudit(user.name, 'USER_LOGIN', 'User', user.id, `User logged in from ${req.ip || '127.0.0.1'}`);

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
  });
});

router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not logged in' });
  }

  const users = db.getUsers();
  const current = users.find((u) => u.id === req.user?.id) || users[2];
  return res.json({
    success: true,
    user: {
      id: current.id,
      name: current.name,
      email: current.email,
      role: current.role,
      phone: current.phone,
    },
  });
});

// Demo switch role for quick preview
router.post('/switch-demo', (req: AuthenticatedRequest, res: Response) => {
  const { role } = req.body;
  const users = db.getUsers();
  const target = users.find((u) => u.role === role) || users[0];
  const token = generateToken(target);
  return res.json({
    success: true,
    token,
    user: {
      id: target.id,
      name: target.name,
      email: target.email,
      role: target.role,
      phone: target.phone,
    },
  });
});

router.get('/users', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const users = db.getUsers().map(({ passwordHash, ...rest }) => rest);
  return res.json({ success: true, users });
});

export default router;
