import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
const source = resolve(
  process.env.READYBY_DATABASE || "data/readyby-platform.sqlite",
);
const destination = resolve(
  process.argv[2] ||
    resolve(
      process.env.READYBY_BACKUP_DIRECTORY || "backups",
      `readyby-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`,
    ),
);
if (!existsSync(source))
  throw Error("The configured ReadyBy database does not exist.");
if (source === destination || existsSync(destination))
  throw Error(
    "Choose a new backup filename. Existing files are never overwritten.",
  );
mkdirSync(dirname(destination), { recursive: true });
const db = new DatabaseSync(source);
try {
  db.prepare("VACUUM INTO ?").run(destination);
} finally {
  db.close();
}
const copy = new DatabaseSync(destination, { readOnly: true });
try {
  const result = copy.prepare("PRAGMA integrity_check").get();
  if (
    Object.values(result)[0] !== "ok" ||
    copy.prepare("PRAGMA foreign_key_check").all().length
  )
    throw Error("Backup verification failed.");
} finally {
  copy.close();
}
console.log(`Verified local database snapshot: ${destination}`);
console.log(
  "Contains household data and account secrets. Store privately; do not commit or upload it.",
);
