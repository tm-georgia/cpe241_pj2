import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "",
  PGUSER: process.env.PGUSER || "postgres",
  PGHOST: process.env.PGHOST || "localhost",
  PGPASSWORD: process.env.PGPASSWORD || "",
  PGDATABASE: process.env.PGDATABASE || "bankcore",
  PGPORT: process.env.PGPORT || 5432,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || ""
};
