export type GreetingLocale = "zh" | "en";
export type ShanghaiDayPart = "morning" | "afternoon" | "evening";

export function shanghaiHour(date: Date) {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date).find(part => part.type === "hour")?.value;
  return Number(hour ?? 0);
}

export function getShanghaiDayPart(date: Date): ShanghaiDayPart {
  const hour = shanghaiHour(date);
  if (hour >= 6 && hour < 14) return "morning";
  if (hour >= 14 && hour < 18) return "afternoon";
  return "evening";
}

export function getShanghaiGreeting(locale: GreetingLocale, date: Date) {
  const dayPart = getShanghaiDayPart(date);
  const labels = {
    zh: { morning: "早上好", afternoon: "下午好", evening: "晚上好" },
    en: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening" }
  } as const;
  return labels[locale][dayPart];
}
