const bcrypt = require('bcryptjs');

const hashNoBanco = '$2a$10$hRrJH/fz3qNN60ZaJvU0SupThOeoeJhfdu3wyf/jOQDxTc4Dii6sW';
const senhaDigitada = '@dm!n321';

const isValid = bcrypt.compareSync(senhaDigitada, hashNoBanco);
console.log('Senha válida?', isValid);