import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, registerUserSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Gerar um secret seguro se não fornecido no ambiente
const generateSessionSecret = () => {
  return randomBytes(32).toString('hex');
};

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || generateSessionSecret(),
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 dias
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Usuário ou senha incorretos" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Rota de registro
  app.post("/api/register", async (req, res, next) => {
    try {
      // Verificar se os dados são válidos com o schema que inclui confirmPassword
      const validation = registerUserSchema.safeParse(req.body);
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Depois de validar, remover o campo confirmPassword para salvar no banco
      const { confirmPassword, ...userData } = req.body;

      // Verificar se o usuário já existe
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }

      // Criar o usuário
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        // Não retornar a senha
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Rota de login
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: any, info: { message?: string }) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Usuário ou senha incorretos" });
      
      req.login(user, (err: Error | null) => {
        if (err) return next(err);
        // Não retornar a senha
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Rota de logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Rota para obter o usuário atual
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Não autenticado" });
    // Não retornar a senha
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
}

// Middleware para verificar se o usuário está autenticado
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Não autenticado" });
}

// Middleware para verificar se o usuário é um PROATI (administrador)
export function isProati(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user.role === 'proati') {
    return next();
  }
  res.status(403).json({ message: "Acesso negado" });
}

// Middleware para verificar se o usuário é um professor da turma específica
export function isTeacherOfClass(gradeClass: string) {
  return (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      // PROATI pode acessar qualquer turma
      if (req.user.role === 'proati') {
        return next();
      }
      // Professor só pode acessar sua própria turma
      if (req.user.role === 'teacher' && req.user.assignedClass === gradeClass) {
        return next();
      }
    }
    res.status(403).json({ message: "Acesso negado" });
  };
}