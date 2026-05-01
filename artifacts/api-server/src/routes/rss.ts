import { Router } from "express";
import { db, type Announcement } from "../lib/db";
import { getBaseUrl } from "../lib/baseUrl";

const router = Router();

function cdata(str: string): string {
  return `<![CDATA[${str.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

function toRssDate(dateStr: string): string {
  const d = new Date(dateStr.endsWith("Z") ? dateStr : dateStr + "Z");
  return d.toUTCString();
}

router.get("/rss.xml", (req, res) => {
  const baseUrl = getBaseUrl();
  const feedUrl = `${baseUrl}/rss.xml`;

  const announcements = db
    .prepare(
      `SELECT * FROM announcements WHERE active = 1 AND datetime('now') < expires_at ORDER BY publish_date DESC`
    )
    .all() as Announcement[];

  const items = announcements
    .map((a) => {
      const link = a.link ? a.link : baseUrl || "";
      const categoryTag = a.category
        ? `\n      <category>${cdata(a.category)}</category>`
        : "";
      return `
    <item>
      <title>${cdata(a.headline)}</title>
      <description>${cdata(a.description)}</description>
      <link>${link}</link>
      <guid isPermaLink="false">announcement-${a.id}</guid>
      <pubDate>${toRssDate(a.publish_date)}</pubDate>${categoryTag}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${cdata("Hunter Gatherer Mental Health Announcements")}</title>
    <description>${cdata("Internal company announcements and headline updates")}</description>
    <link>${baseUrl || ""}</link>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <language>en-gb</language>
    <ttl>5</ttl>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;

  res.set("Content-Type", "text/xml; charset=utf-8");
  res.set("Cache-Control", "public, max-age=60");
  res.send(xml);
});

export default router;
