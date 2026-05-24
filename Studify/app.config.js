require('dotenv').config();

module.exports = {
  expo: {
    name: 'Studify',
    slug: 'studify',
    version: '1.0.0',
    orientation: 'portrait',
    platforms: ['android', 'ios', 'web'],
    extra: {
      GROQ_API_KEY: process.env.GROQ_API_KEY,
    },
  },
};
