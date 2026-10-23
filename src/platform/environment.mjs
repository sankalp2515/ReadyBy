import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
// Node's parser preserves values already provided by the launching shell.
if (existsSync(".env")) loadEnvFile(".env");
