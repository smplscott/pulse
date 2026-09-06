import "dotenv/config";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { type Server } from "http";
import { registerRoutes } from "./routes";
import { log } from "./log";
import { pool } from "./db";

const PgSessionStore = connectPgSimple(session);

export async function createApp(): Promise<{ app: Express; server: Server }> {
  const app = express();
  // Required behind Railway / Vercel HTTPS proxies so secure cookies work.
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: false }));

  const sessionSecret = process.env.SESSION_SECRET || (
    process.env.NODE_ENV === "production"
      ? (() => { throw new Error("SESSION_SECRET environment variable is required in production"); })()
      : "pulse-dev-secret-key"
  );

  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new PgSessionStore({ pool, createTableIfMissing: true }),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  }));

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

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  return { app, server };
}
