import bcrypt from 'bcrypt';
import db from './src/config/db';

async function criarPrimeiroGerente() {
  try {
    console.log('Iniciando o seeding do banco de dados...');

    const [linhas] = await db.execute('SELECT * FROM usuarios');
    if (Array.isArray(linhas) && linhas.length > 0) {
      console.log('O banco já possui usuários. Seeding abortado por segurança.');
      process.exit(0);
    }

    const senhaHash = await bcrypt.hash('123', 10);

    await db.execute(
      'INSERT INTO usuarios (nome, email, senha, perfil, ativo) VALUES (?, ?, ?, ?, ?)',
      ['Matheus Master', 'master@ms2.com', senhaHash, 'GERENTE', true]
    );

    console.log('✅ Primeiro Gerente criado com sucesso! Email: master@ms2.com | Senha: 123');
    process.exit(0);
  } catch (erro) {
    console.error('❌ Erro ao criar o gerente:', erro);
    process.exit(1);
  }
}

criarPrimeiroGerente();
