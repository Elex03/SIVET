import { today } from "./domain";
export function monthKeys() {
  const current = today().slice(0, 7);
  const d = new Date(`${current}-01T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return { current, previous: d.toISOString().slice(0, 7) };
}
export const monthOf = (date: string) =>
  new Date(date.length === 10 ? `${date}T12:00:00-06:00` : date)
    .toLocaleDateString("en-CA", { timeZone: "America/Managua" })
    .slice(0, 7);
