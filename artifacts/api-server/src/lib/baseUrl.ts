export function getBaseUrl(): string {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/$/, "");
  }
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    const first = replitDomains.split(",")[0].trim();
    return `https://${first}`;
  }
  return "";
}
