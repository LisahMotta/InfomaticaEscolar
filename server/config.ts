import * as dotenv from 'dotenv';
import { join } from 'path';
import { existsSync } from 'fs';

// Determinando o caminho para o arquivo .env
const envPath = join(process.cwd(), '.env');

// Carregar variáveis de ambiente do arquivo .env se existir
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Variáveis de ambiente carregadas de ${envPath}`);
} else {
  console.warn('Arquivo .env não encontrado. Usando variáveis de ambiente do sistema.');
}

// Configurações de notificações push
export const pushConfig = {
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
  contactEmail: 'mailto:proati@example.com'
};

// Verificar configurações essenciais
if (!pushConfig.vapidPublicKey || !pushConfig.vapidPrivateKey) {
  console.warn('As chaves VAPID não foram configuradas. Notificações push não funcionarão corretamente.');
}

export default {
  pushConfig
};