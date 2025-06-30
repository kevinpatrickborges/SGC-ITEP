const i18n = require('i18n');
const path = require('path');
module.exports = (app) => {
  i18n.configure({
    locales: ['pt-BR', 'en-US'],
    directory: path.join(__dirname, '../locales'),
    defaultLocale: process.env.DEFAULT_LANG || 'pt-BR',
    cookie: 'lang',
    queryParameter: 'lang',
    autoReload: true,
    updateFiles: false,
    objectNotation: true
  });
  app.use(i18n.init);
};
