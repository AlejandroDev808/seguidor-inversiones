import express, { Request, Response, NextFunction } from "express";
import path from "path";
import YahooFinance from 'yahoo-finance2';
import './src/server/firebase-admin.js'; // inicializa admin al arrancar
import { requireAuth } from './src/server/auth.middleware.js';
import { rateLimit } from './src/server/rate-limit.middleware.js';
import { getPriceWithFallbacks } from './src/server/prices.service.js';
import { resolveIsin, searchSymbols } from './src/server/search.service.js';

const yf: any = (YahooFinance as any).default || YahooFinance;

async function startServer() {
  const app = express();

  // Request logger
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`[VISITA] ${new Date().toISOString()} | IP: ${ip} | ${req.method} ${req.path}`);
    next();
  });

  app.use(express.json());

  // Health check — público
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // Precios — autenticado + rate limited
  app.get("/api/prices", requireAuth, rateLimit, async (req: Request, res: Response) => {
    const symbolsQuery = req.query.symbols as string;
    if (!symbolsQuery) return res.json({});

    const symbolList = symbolsQuery.split(',').map(s => s.trim().toUpperCase());
    const results: Record<string, number> = {};

    for (const sym of symbolList) {
      let resolvedSym = sym;
      if (sym.length === 12 && /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(sym)) {
        resolvedSym = (await resolveIsin(sym, yf)) || sym;
      }
      const price = await getPriceWithFallbacks(resolvedSym);
      if (price !== null) results[sym] = price;
    }

    res.json(results);
  });

  // Búsqueda — autenticada + rate limited
  app.get("/api/search", requireAuth, rateLimit, async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q || q.length < 2) return res.json([]);
    const results = await searchSymbols(q, yf);
    res.json(results);
  });

  // Frontend
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(3000, "0.0.0.0", () => console.log("Server running on http://localhost:3000"));
}

startServer();
