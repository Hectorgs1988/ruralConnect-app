import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { api } from "./routes/index.js";

// Swagger
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

// Necesario para obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Export directo (IMPORTANTÍSIMO)
export const app = express();

// --- Swagger ---
const swaggerCandidates = [
    path.join(__dirname, "doc", "APIruralconnect.yaml"),
    path.join(__dirname, "..", "src", "doc", "APIruralconnect.yaml"),
];

const swaggerPath = swaggerCandidates.find((candidate) => fs.existsSync(candidate));
const swaggerDocument = swaggerPath
    ? YAML.load(swaggerPath)
    : {
        openapi: "3.0.3",
        info: { title: "RuralConnect API", version: "1.0.0" },
        paths: {},
    };

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// -----------------

// CORS
const origins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim());

app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));
app.use(cors({ origin: origins, credentials: true }));

// Health check
app.get("/health", (_req, res) => {
    res.json({ ok: true, ts: new Date().toISOString() });
});

// Rutas de la API
app.use("/api", api);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(err?.status || 500).json({
        error: err?.message || "Internal Server Error",
    });
});
