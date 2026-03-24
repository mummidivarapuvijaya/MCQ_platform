const { z } = require('zod');
const examService = require('../services/exam.service');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

async function startExam(req, res) {
  const parsed = z
    .object({
      courseId: z.string().optional(),
      courseCode: z.number().int().positive().optional(),
      languageIds: z.array(objectId).min(1).max(6).optional(),
      languageCodes: z.array(z.number().int().positive()).min(1).max(6).optional()
    })
    .refine((v) => v.courseId || v.courseCode !== undefined, { message: 'courseId or courseCode is required' })
    .refine((v) => v.languageIds || v.languageCodes, { message: 'languageIds or languageCodes is required' })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const result = await examService.startExam({
    userId: req.user.userId,
    courseId: parsed.data.courseId,
    courseCode: parsed.data.courseCode,
    languageIds: parsed.data.languageIds,
    languageCodes: parsed.data.languageCodes
  });
  if (result.error) return res.status(result.error.code).json({ error: result.error.message });
  return res.json(result);
}

async function submitExam(req, res) {
  const parsed = z
    .object({
      examId: objectId.optional(),
      examCode: z.number().int().positive().optional(),
      answers: z.array(
        z.object({
          examQuestionId: objectId,
          selectedIndex: z.number().int().min(0).max(3).nullable()
        })
      )
    })
    .refine((v) => v.examId || v.examCode !== undefined, { message: 'examId or examCode is required' })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const result = await examService.submitExam({
    userId: req.user.userId,
    examId: parsed.data.examId,
    examCode: parsed.data.examCode,
    answers: parsed.data.answers
  });
  if (result.error) return res.status(result.error.code).json({ error: result.error.message });
  return res.json(result);
}

async function reportCheat(req, res) {
  const parsed = z
    .object({
      examId: objectId.optional(),
      examCode: z.number().int().positive().optional(),
      event: z.enum(['tab_switch', 'window_blur', 'back_navigation', 'screenshot', 'devtools', 'screenshare', 'no_camera'])
    })
    .refine((v) => v.examId || v.examCode !== undefined, { message: 'examId or examCode is required' })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const result = await examService.reportCheat({
    userId: req.user.userId,
    examId: parsed.data.examId,
    examCode: parsed.data.examCode,
    event: parsed.data.event
  });
  if (result.error) return res.status(result.error.code).json({ error: result.error.message });
  return res.json(result);
}

module.exports = { startExam, submitExam, reportCheat };

