'use strict';

// Gera um DOI (Digital Object Identifier) falso.
// Formato: 10.NNNN/XXXXXX
exports.generateDOI = () => {
  const prefix = Math.floor(1000 + Math.random() * 9000);
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `10.${prefix}/${suffix}`;
};

// Gera um ISBN-13 (International Standard Book Number) falso.
// Formato: 978-XX-XXXX-XXXX-X
exports.generateISBN = () => {
  let isbn = '978-';
  isbn += Math.floor(10 + Math.random() * 90) + '-'; // Group
  isbn += Math.floor(1000 + Math.random() * 9000) + '-'; // Publisher
  isbn += Math.floor(1000 + Math.random() * 9000) + '-'; // Title

  // Calcula o dígito verificador
  const digits = isbn.replace(/-/g, '').split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  isbn += checkDigit;
  return isbn;
};
