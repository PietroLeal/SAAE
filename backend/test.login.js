const bcrypt = require('bcryptjs');

const hashNoBanco = '$2a$10$vSeGVAeARTPnXFmhA47dN.FEqG3na2vU2tguND5zyFNnqFAiiv/pm';
const senhaDigitada = 'admin123';

const isValid = bcrypt.compareSync(senhaDigitada, hashNoBanco);
console.log('Senha válida?', isValid);