const { z } = require('zod');
const adminService = require('../services/admin.service');

async function createCourse(req, res) {
  const parsed = z.object({ name: z.string().min(2), courseCode: z.number().int().positive().optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const course = await adminService.createCourse(parsed.data);
  return res.status(201).json(course);
}

async function createLanguage(req, res) {
  const parsed = z
    .object({
      name: z.string().min(1),
      courseId: z.string().optional(),
      courseCode: z.number().int().positive().optional(),
      languageCode: z.number().int().positive().optional()
    })
    .refine((v) => v.courseId || v.courseCode !== undefined, { message: 'courseId or courseCode is required' })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const result = await adminService.createLanguage(parsed.data);
  if (result.error) return res.status(result.error.code).json({ error: result.error.message });
  return res.status(201).json(result);
}

async function createQuestion(req, res) {
  const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
  const parsed = z
    .object({
      languageId: objectId.optional(),
      languageCode: z.number().int().positive().optional(),
      text: z.string().min(5),
      options: z.array(z.string().min(1)).length(4),
      correctIndex: z.number().int().min(0).max(3)
    })
    .refine((v) => v.languageId || v.languageCode !== undefined, { message: 'languageId or languageCode is required' })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const result = await adminService.createQuestion(parsed.data);
  if (result.error) return res.status(result.error.code).json({ error: result.error.message });
  return res.status(201).json(result);
}

module.exports = { createCourse, createLanguage, createQuestion };

