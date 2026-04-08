const bcrypt = require('bcryptjs');

const hashNoBanco = '$2a$10$xFeDe/C9qJWYOo5D7h7bb.htK1ChaG1tZ5329Jm/0jkwe5.8y4LIG ';
const senhaDigitada = 'admin123';

const isValid = bcrypt.compareSync(senhaDigitada, hashNoBanco);
console.log('Senha válida?', isValid);