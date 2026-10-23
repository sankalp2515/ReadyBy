import type { Mission, Task, Option } from "./types";
export type Route = "Today" | "Routines" | "Household" | "Settings" | "Review";
export type Dialog = { kind: string; task?: Task; option?: Option };
export type Run = (fn: () => Promise<void>) => Promise<boolean>;
export const fmt = (n: number | undefined, s?: Mission) =>
  n === undefined || !Number.isFinite(n)
    ? "—"
    : s?.clock.mode === "realtime"
      ? new Intl.DateTimeFormat("en-GB", {
          timeZone: s.clock.timezone,
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(n * 60000))
      : `${String(Math.floor(n / 60) % 24).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
