import { db } from '../server/db';
import { users } from '../shared/schema';
import { hashPassword } from '../server/auth';
import { eq } from 'drizzle-orm';

async function addCoordinator() {
  try {
    // Verificar se o usuário já existe
    const userExists = await db.select().from(users).where(eq(users.username, 'coord')).limit(1);
    
    if (userExists.length > 0) {
      console.log('Usuário coord já existe!');
      return;
    }
    
    // Gerar hash da senha
    const hashedPassword = await hashPassword('coord123');
    
    // Inserir o novo usuário
    const newUser = await db.insert(users).values({
      username: 'coord',
      password: hashedPassword,
      displayName: 'Coordenador Pedagógico',
      role: 'coordinator',
      assignedClass: null
    }).returning();
    
    console.log('Usuário coordenador criado com sucesso:', newUser);
    
  } catch (error) {
    console.error('Erro ao criar usuário coordenador:', error);
  } finally {
    process.exit(0);
  }
}

addCoordinator();