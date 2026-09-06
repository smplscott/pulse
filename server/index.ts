import { createApp } from "./app";
import { setupVite, serveStatic } from "./vite";
import { log } from "./log";

(async () => {
  const { app, server } = await createApp();

  // Vercel serves the Vite build from dist/public and invokes api/index.ts
  // for /api/*. Do not listen or attach a static catch-all in that runtime.
  if (process.env.VERCEL) {
    return;
  }

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve API + client. Default 5000 (Replit); override with PORT locally
  // (macOS AirPlay often occupies 5000).
  const port = Number(process.env.PORT) || 5000;
  const listenOpts: { port: number; host: string; reusePort?: boolean } = {
    port,
    host: "0.0.0.0",
  };
  // reusePort is a Linux/Replit convenience; it can fail on macOS.
  if (process.platform === "linux") {
    listenOpts.reusePort = true;
  }
  server.listen(listenOpts, () => {
    log(`serving on port ${port}`);
  });
})();
