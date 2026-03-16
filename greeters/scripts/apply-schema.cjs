require("dotenv/config");

const { execFileSync } = require("node:child_process");
const { Client } = require("pg");

async function main() {
  const directUrl = process.env.DIRECT_URL;

  if (!directUrl) {
    throw new Error("DIRECT_URL est manquante.");
  }

  const sql = execFileSync(
    "./node_modules/.bin/prisma",
    ["migrate", "diff", "--from-config-datasource", "--to-schema", "prisma/schema.prisma", "--script"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        DATABASE_URL: directUrl,
      },
    },
  );

  if (!sql.trim()) {
    console.log("Aucune différence de schéma à appliquer.");
    return;
  }

  const client = new Client({ connectionString: directUrl, connectionTimeoutMillis: 15000 });

  try {
    await client.connect();
    await client.query(sql);
    console.log("Schéma PostgreSQL appliqué avec succès.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Échec de l'application du schéma", error);
  process.exit(1);
});