import "dotenv/config";

function parseOrigins(value: string | undefined): string[] {
  return (value ?? "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const env = {
  uri: process.env.COGNODB_URI ?? "bolt://localhost:7687",
  username: process.env.COGNODB_USERNAME ?? "neo4j",
  password: process.env.COGNODB_PASSWORD ?? "password",
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: parseOrigins(process.env.CLIENT_ORIGIN),
};
