const userService = require('../services/user.service');

async function getProfile(req, res) {
  const result = await userService.getProfile(req.user.userId);
  if (result.error) return res.status(result.error.code).json({ error: result.error.message });
  return res.json(result);
}

module.exports = { getProfile };

