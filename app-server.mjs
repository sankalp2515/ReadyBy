import './src/platform/environment.mjs';
import { createPlatformServer } from "./src/platform/server.mjs";
const { server } = await createPlatformServer({
  dbFile: process.env.READYBY_DATABASE || undefined,
});
server.listen(Number(process.env.PORT) || 4173, "127.0.0.1", () =>
  console.log(`ReadyBy workspace: http://127.0.0.1:${server.address().port}`),
);
const stop = () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
