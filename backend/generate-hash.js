const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔐 GERADOR DE HASH PARA SENHA\n');

rl.question('Digite a senha: ', (senha) => {
  if (!senha) {
    console.log('❌ Senha não pode ser vazia!');
    rl.close();
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(senha, salt);
  
  console.log('\n✅ Hash gerado com sucesso!\n');
  console.log('Senha:', senha);
  console.log('Hash:', hash);
  console.log('\n📋 Copie este hash e cole no seu arquivo .env:\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
  
  rl.close();
});