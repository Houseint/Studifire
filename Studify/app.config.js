require('dotenv').config();

// app.config.js tem precedência sobre o app.json.
// Observação: aqui `config` já é o conteúdo da chave "expo" do app.json —
// repassamos tudo com spread e só sobrescrevemos o necessário.
module.exports = ({ config }) => ({
  ...config,
  name: 'Studify',
  slug: 'studify',
  version: '1.0.0',
  orientation: 'portrait',
  platforms: ['android', 'ios', 'web'],
  android: {
    ...(config.android || {}),
    package: 'com.studify.app',
    versionCode: 1,
  },
});
