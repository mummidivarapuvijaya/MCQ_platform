const { User } = require('../models');

async function getProfile(userId) {
  const user = await User.findById(userId).populate('courseId', 'name courseCode');
  if (!user) return { error: { code: 404, message: 'User not found' } };

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    education: user.education,
    termsAccepted: user.termsAccepted,
    course: user.courseId
      ? { id: String(user.courseId._id), name: user.courseId.name, courseCode: user.courseId.courseCode }
      : null
  };
}

module.exports = { getProfile };

