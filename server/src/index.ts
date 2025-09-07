import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { db } from "./config/database.js";
import { sql } from "kysely";
import { authRouter } from "./api/auth/auth.router.js";
import { goalsRouter } from "./api/goals/goals.router.js";
import collabRouter from "./api/collab/collab.router.js";

const envFile =
  process.env.NODE_ENV === "development" ? ".env.development" : ".env";
dotenv.config({ path: envFile });

export const app = express();

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const corsOptions =
  process.env.NODE_ENV === "development"
    ? {
        origin: [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://192.168.1.226:5173",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      }
    : {};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/collab", collabRouter);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message:
      `Welcome to the GoalBuddy API! Environment: ${process.env.NODE_ENV || "production"}. ` +
      "The current time in Vilnius is " +
      new Date().toLocaleString("en-US", { timeZone: "Europe/Vilnius" }),
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    environment: process.env.NODE_ENV || "production",
    port: port,
  });
});

app.get("/api/health", async (req: Request, res: Response) => {
  try {
    const result = await sql`SELECT datname FROM pg_database`.execute(db);

    res.status(200).json({
      status: "ok",
      message: "Database connection is healthy.",
      environment: process.env.NODE_ENV || "production",
      databases: (result.rows as { datname: string }[]).map((db) => db.datname),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to connect to the database.",
      environment: process.env.NODE_ENV || "production",
    });
  }
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  const body: Record<string, unknown> = { message: "Internal Server Error" };
  if (
    process.env.NODE_ENV === "test" ||
    process.env.NODE_ENV === "development"
  ) {
    body.error = err instanceof Error ? err.message : String(err);
  }
  res.status(500).json(body);
});

const host = process.env.NODE_ENV === "development" ? "localhost" : "0.0.0.0";

if (process.env.NODE_ENV !== "test") {
  app.listen(port, host, () => {
    console.log(`🚀 Server is running at http://${host}:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || "production"}`);
    console.log(
      `Database: ${process.env.DATABASE_URL?.includes("localhost") ? "Local PostgreSQL" : "Neon Cloud"}`,
    );
  });
}
