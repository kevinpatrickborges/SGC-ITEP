// Este ficheiro não é mais necessário, pois a proteção CSRF é gerida por middleware/csrf.js
// Este arquivo pode ser usado para lógica extra se necessário
module.exports = (req, res, next) => {
  // Custom logic if needed
  next();
};
