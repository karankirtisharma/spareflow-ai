import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { CONFIG } from "./app/core/config.js";

// Import API Routers
import authRouter from "./app/api/v1/auth.js";
import branchesRouter from "./app/api/v1/branches.js";
import usersRouter from "./app/api/v1/users.js";
import spareflowRouter from "./app/api/v1/spareflow.js";
import productsRouter from "./app/api/v1/products.js";

async function startServer() {
  const app = express();

  // Standard Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Structured Logging Middleware
  const { logRequest } = await import("./app/core/logger.js");
  app.use(logRequest);

  // API Health Indicator
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "Spareflow AI - Phase 1 Foundation Engine System",
      apiVersion: "1.0.0",
    });
  });

  // Register Domain Modular REST APIs
  // Support both /api/v1/... and legacy /api/... to prevent any 404s
  app.use("/api/v1/auth", authRouter);
  app.use("/api/auth", authRouter);

  app.use("/api/v1/branches", branchesRouter);
  app.use("/api/branches", branchesRouter);

  app.use("/api/v1/users", usersRouter);
  app.use("/api/users", usersRouter);

  app.use("/api/v1/spareflow", spareflowRouter);
  app.use("/api/spareflow", spareflowRouter);
  
  // New standardized endpoints
  app.use("/api/v1/products", productsRouter); 
  app.use("/api/products", productsRouter); 

  // Global Express Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandle System Server Error:", err);
    res.status(err.status || 500).json({
      error: err.message || "An unexpected severe internal error occurred.",
    });
  });

  // Framework Asset Serving & Fallback Strategy
  if (CONFIG.NODE_ENV !== "production") {
    console.log("Mounting Dev Mode Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Mounting Production File Serves...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(CONFIG.PORT, "0.0.0.0", () => {
    console.log(`[Spareflow AI System Online] running on http://0.0.0.0:${CONFIG.PORT}`);
    console.log(`Development Applet Environment: ${CONFIG.NODE_ENV}`);
  });
}

startServer().catch((err) => {
  console.error("Startup Failure:", err);
});
