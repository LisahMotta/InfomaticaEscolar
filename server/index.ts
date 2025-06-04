import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Adicionar endpoints de health check para Replit Deployments
// Health check primário (necessário para o deployment)
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ 
    status: "ok",
    message: "Sistema de Agendamento da Sala de Informática está funcionando"
  });
});

// Health check secundário na raiz para compatibilidade
app.get("/", (req: Request, res: Response, next: NextFunction) => {
  // Verificar se é uma solicitação de health check do Replit
  const userAgent = req.headers['user-agent'] || '';
  if (userAgent.includes('Replit') || userAgent.includes('health') || req.query.health === 'check') {
    return res.status(200).json({ 
      status: "ok",
      message: "Health check via root"
    });
  }
  
  // Caso contrário, passar para o próximo handler que servirá o frontend
  return next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Seed initial data to database if needed
  if (storage.seedInitialData) {
    try {
      await storage.seedInitialData();
      log("Database initialized with seed data");
    } catch (error) {
      log(`Error seeding database: ${error}`);
    }
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
