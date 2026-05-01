import { Router } from "express";
import { db, type Announcement } from "../lib/db";
import { getBaseUrl } from "../lib/baseUrl";

const router = Router();

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRssDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toUTCString();
}

router.get("/rss.xml", (req, res) => {
  const baseUrl = getBaseUrl();

  const announcements = db
    .prepare(
      `SELECT * FROM announcements WHERE active = 1 AND datetime('now') < expires_at ORDER BY publish_date DESC`
    )
    .all() as Announcement[];

  const items = announcements
    .map((a) => {
      const link = a.link ? escapeXml(a.link) : escapeXml(baseUrl || "https://example.com");
      const categoryTag = a.category
        ? `\n      <category>${escapeXml(a.category)}</category>`
        : "";
      return `
    <item>
      <title>${escapeXml(a.headline)}</title>
      <description>${escapeXml(a.description)}</description>
      <link>${link}</link>
      <guid isPermaLink="false">announcement-${a.id}</guid>
      <pubDate>${toRssDate(a.publish_date)}</pubDate>${categoryTag}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Hunter Gatherer Mental Health Announcements</title>
    <description>Internal company announcements and headline updates</description>
    <link>${escapeXml(baseUrl || "https://example.com")}</link>
    <language>en-gb</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;

  res.set("Content-Type", "application/rss+xml; charset=utf-8");
  res.send(xml);
});

export default router;
