const { z } = require('zod');
const authService = require('../services/auth.service');

async function register(req, res) {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['admin', 'student', 'proctor']).default('student'),
    education: z.string().min(1),
    courseId: z.string().optional(),
    courseCode: z.number().int().positive().optional(),
    termsAccepted: z.literal(true)
  }).refine((v) => v.courseId || v.courseCode !== undefined, { message: 'courseId or courseCode is required' });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const result = await authService.register(parsed.data);
  if (result.error) return res.status(result.error.code).json({ error: result.error.message });
  return res.status(201).json({ message: 'User created successfully', token: result.token });
}

async function login(req, res) {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(8) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const result = await authService.login(parsed.data);
  if (result.error) return res.status(result.error.code).json({ error: result.error.message });
  return res.json({ message: 'Login successful', token: result.token });
}

async function sendOtp(req, res) {
  const parsed = z.object({ email: z.string().email() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const result = await authService.sendOtp(parsed.data);
  if (result.error) return res.status(result.error.code).json({ error: result.error.message });
  return res.json(result);
}

async function verifyOtp(req, res) {
  const parsed = z.object({ email: z.string().email(), code: z.string().length(6) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const result = await authService.verifyOtp(parsed.data);
  if (result.error) return res.status(result.error.code).json({ error: result.error.message });
  return res.json(result);
}

module.exports = { register, login, sendOtp, verifyOtp };

