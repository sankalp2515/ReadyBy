import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
if (!process.argv[2])
  throw Error("Usage: node scripts/restore-check.mjs <backup.sqlite>");
const file = resolve(process.argv[2]);
if (!existsSync(file)) throw Error("Backup does not exist.");
const db = new DatabaseSync(file, { readOnly: true });
try {
  const integrity = Object.values(
    db.prepare("PRAGMA integrity_check").get(),
  )[0];
  const foreignKeys = db.prepare("PRAGMA foreign_key_check").all();
  if (integrity !== "ok" || foreignKeys.length)
    throw Error("Database consistency verification failed.");
  const counts = {};
  for (const table of ["households", "accounts", "missions", "routines"])
    counts[table] = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
  console.log(
    JSON.stringify(
      { integrity, foreignKeyViolations: foreignKeys.length, counts },
      null,
      2,
    ),
  );
} finally {
  db.close();
}
