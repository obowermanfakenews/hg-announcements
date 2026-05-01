import { Router, type Request, type Response } from "express";
import { db, type Announcement } from "../lib/db";
import { getBaseUrl } from "../lib/baseUrl";

const router = Router();

const CATEGORIES = ["Sales", "Compliance", "Payroll", "Jobs", "Internal News"];

function isAuthenticated(req: Request): boolean {
  return (req.session as { authenticated?: boolean }).authenticated === true;
}

function adminPage(content: string, baseUrl: string, flash = ""): string {
  const baseUrlWarning =
    !baseUrl
      ? `<div class="warning">⚠️ <strong>BASE_URL is not set.</strong> Set the <code>BASE_URL</code> environment variable to your public Replit URL (e.g. <code>https://your-app.replit.app</code>) before using the RSS feed in Bullhorn Analytics.</div>`
      : "";
  const feedUrl = baseUrl ? `${baseUrl}/rss.xml` : "/rss.xml (BASE_URL not set)";
  const flashHtml = flash ? `<div class="flash">${flash}</div>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin — HG Mental Health Announcements</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #f4f6f9; color: #1a1a2e; min-height: 100vh; }
    header { background: #1a1a2e; color: #fff; padding: 1rem 2rem; display: flex; align-items: center; gap: 1rem; }
    header h1 { font-size: 1.25rem; font-weight: 600; }
    header span { opacity: .6; font-size: .85rem; }
    main { max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
    .card { background: #fff; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    h2 { font-size: 1.05rem; font-weight: 600; margin-bottom: 1rem; color: #333; }
    label { display: block; font-size: .85rem; font-weight: 500; margin-bottom: .3rem; color: #444; }
    input[type=text], input[type=url], input[type=datetime-local], textarea, select {
      width: 100%; padding: .55rem .75rem; border: 1px solid #d1d5db; border-radius: 6px;
      font-size: .9rem; background: #fafafa; margin-bottom: .9rem;
    }
    textarea { min-height: 80px; resize: vertical; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .btn { display: inline-block; padding: .5rem 1.1rem; border: none; border-radius: 6px; font-size: .9rem; cursor: pointer; font-weight: 500; }
    .btn-primary { background: #4f46e5; color: #fff; }
    .btn-primary:hover { background: #4338ca; }
    .btn-danger { background: #ef4444; color: #fff; }
    .btn-danger:hover { background: #dc2626; }
    .btn-sm { padding: .3rem .7rem; font-size: .8rem; }
    .btn-ghost { background: transparent; border: 1px solid #d1d5db; color: #444; }
    .btn-ghost:hover { background: #f3f4f6; }
    .flash { background: #dcfce7; border: 1px solid #86efac; color: #166534; padding: .7rem 1rem; border-radius: 6px; margin-bottom: 1rem; }
    .warning { background: #fef9c3; border: 1px solid #fde047; color: #854d0e; padding: .7rem 1rem; border-radius: 6px; margin-bottom: 1rem; font-size: .9rem; }
    .rss-box { display: flex; gap: .5rem; align-items: center; }
    .rss-url { flex: 1; padding: .5rem .75rem; border: 1px solid #d1d5db; border-radius: 6px; background: #f9fafb; font-family: monospace; font-size: .85rem; color: #1a1a2e; }
    table { width: 100%; border-collapse: collapse; font-size: .88rem; }
    th { text-align: left; padding: .5rem .75rem; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600; }
    td { padding: .55rem .75rem; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: .15rem .5rem; border-radius: 99px; font-size: .75rem; font-weight: 600; }
    .badge-active { background: #dcfce7; color: #166534; }
    .badge-inactive { background: #f3f4f6; color: #6b7280; }
    .actions { display: flex; gap: .4rem; flex-wrap: wrap; }
    .toggle-form, .delete-form { display: inline; }
    a { color: #4f46e5; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .logout { margin-left: auto; }
    .no-items { color: #9ca3af; font-size: .9rem; padding: .5rem 0; }
  </style>
</head>
<body>
  <header>
    <h1>HG Mental Health — Announcements Admin</h1>
    <span>Manage your RSS feed</span>
    <form class="logout" method="POST" action="/admin/logout">
      <button class="btn btn-ghost btn-sm" style="color:#fff;border-color:rgba(255,255,255,.4)">Logout</button>
    </form>
  </header>
  <main>
    ${baseUrlWarning}
    ${flashHtml}
    <div class="card">
      <h2>RSS Feed URL</h2>
      <div class="rss-box">
        <input class="rss-url" id="rssUrl" value="${feedUrl}" readonly />
        <button class="btn btn-primary" onclick="copyUrl()">Copy URL</button>
        <a class="btn btn-ghost" href="/rss.xml" target="_blank">Open feed ↗</a>
      </div>
    </div>
    ${content}
  </main>
  <script>
    function copyUrl() {
      const el = document.getElementById('rssUrl');
      navigator.clipboard.writeText(el.value).then(() => {
        const btn = event.target;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy URL', 2000);
      });
    }
  </script>
</body>
</html>`;
}

function loginPage(error = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Login</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #f4f6f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .box { background: #fff; padding: 2.5rem; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,.1); width: 100%; max-width: 360px; }
    h1 { font-size: 1.3rem; font-weight: 700; margin-bottom: .3rem; color: #1a1a2e; }
    p { font-size: .85rem; color: #6b7280; margin-bottom: 1.5rem; }
    label { display: block; font-size: .85rem; font-weight: 500; margin-bottom: .4rem; }
    input { width: 100%; padding: .6rem .8rem; border: 1px solid #d1d5db; border-radius: 7px; font-size: .9rem; margin-bottom: 1rem; }
    button { width: 100%; padding: .65rem; background: #4f46e5; color: #fff; border: none; border-radius: 7px; font-size: .95rem; font-weight: 600; cursor: pointer; }
    button:hover { background: #4338ca; }
    .error { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: .6rem .9rem; border-radius: 6px; margin-bottom: 1rem; font-size: .85rem; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Admin Login</h1>
    <p>HG Mental Health Announcements</p>
    ${error ? `<div class="error">${error}</div>` : ""}
    <form method="POST" action="/admin/login">
      <label for="password">Password</label>
      <input type="password" id="password" name="password" autofocus required />
      <button type="submit">Sign in</button>
    </form>
  </div>
</body>
</html>`;
}

function announcementForm(a?: Announcement, editMode = false): string {
  const now = new Date().toISOString().slice(0, 16);
  const catOptions = CATEGORIES.map(
    (c) => `<option value="${c}"${a?.category === c ? " selected" : ""}>${c}</option>`
  ).join("");

  return `
  <div class="card">
    <h2>${editMode ? "Edit Announcement" : "Add Announcement"}</h2>
    <form method="POST" action="${editMode ? `/admin/edit/${a!.id}` : "/admin/add"}">
      <label>Headline *</label>
      <input type="text" name="headline" value="${a ? a.headline.replace(/"/g, "&quot;") : ""}" required />
      <label>Description *</label>
      <textarea name="description" required>${a ? a.description : ""}</textarea>
      <div class="row">
        <div>
          <label>Link (optional)</label>
          <input type="url" name="link" value="${a?.link ?? ""}" placeholder="https://..." />
        </div>
        <div>
          <label>Category (optional)</label>
          <select name="category">
            <option value="">— none —</option>
            ${catOptions}
          </select>
        </div>
      </div>
      <label>Publish Date &amp; Time *</label>
      <input type="datetime-local" name="publish_date" value="${a ? a.publish_date.slice(0, 16) : now}" required />
      ${editMode ? `<label style="display:flex;align-items:center;gap:.5rem;margin-bottom:.9rem"><input type="checkbox" name="active" value="1"${a?.active ? " checked" : ""} /> Active</label>` : ""}
      <button class="btn btn-primary" type="submit">${editMode ? "Save Changes" : "Add Announcement"}</button>
      ${editMode ? `<a class="btn btn-ghost" href="/admin" style="margin-left:.5rem">Cancel</a>` : ""}
    </form>
  </div>`;
}

function announcementsTable(announcements: Announcement[]): string {
  if (announcements.length === 0) {
    return `<div class="card"><p class="no-items">No announcements yet. Add one above.</p></div>`;
  }

  const rows = announcements
    .map((a) => {
      const status = a.active
        ? `<span class="badge badge-active">Active</span>`
        : `<span class="badge badge-inactive">Inactive</span>`;
      const toggleLabel = a.active ? "Deactivate" : "Activate";
      const date = new Date(a.publish_date).toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
      return `<tr>
        <td><strong>${a.headline}</strong><br/><span style="color:#6b7280;font-size:.8rem">${a.description.slice(0, 80)}${a.description.length > 80 ? "…" : ""}</span></td>
        <td>${a.category ?? "—"}</td>
        <td>${date}</td>
        <td>${status}</td>
        <td class="actions">
          <a class="btn btn-ghost btn-sm" href="/admin/edit/${a.id}">Edit</a>
          <form class="toggle-form" method="POST" action="/admin/toggle/${a.id}">
            <button class="btn btn-ghost btn-sm" type="submit">${toggleLabel}</button>
          </form>
          <form class="delete-form" method="POST" action="/admin/delete/${a.id}" onsubmit="return confirm('Delete this announcement?')">
            <button class="btn btn-danger btn-sm" type="submit">Delete</button>
          </form>
        </td>
      </tr>`;
    })
    .join("");

  return `<div class="card">
    <h2>All Announcements</h2>
    <table>
      <thead><tr><th>Headline</th><th>Category</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

router.get("/admin/login", (_req, res) => {
  res.send(loginPage());
});

router.post("/admin/login", (req, res) => {
  const { password } = req.body as { password: string };
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.send(loginPage("ADMIN_PASSWORD environment variable is not set."));
    return;
  }
  if (password === adminPassword) {
    (req.session as { authenticated?: boolean }).authenticated = true;
    res.redirect("/admin");
  } else {
    res.send(loginPage("Incorrect password. Please try again."));
  }
});

router.post("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

router.use("/admin", (req, res, next) => {
  if (!isAuthenticated(req)) {
    res.redirect("/admin/login");
    return;
  }
  next();
});

router.get("/admin", (req, res) => {
  const baseUrl = getBaseUrl();
  const flash = (req.session as { flash?: string }).flash ?? "";
  if (flash) delete (req.session as { flash?: string }).flash;

  const announcements = db
    .prepare(`SELECT * FROM announcements ORDER BY publish_date DESC`)
    .all() as Announcement[];

  const content = announcementForm() + announcementsTable(announcements);
  res.send(adminPage(content, baseUrl, flash));
});

router.get("/admin/edit/:id", (req, res) => {
  const baseUrl = getBaseUrl();
  const a = db
    .prepare(`SELECT * FROM announcements WHERE id = ?`)
    .get(req.params.id) as Announcement | undefined;

  if (!a) {
    res.redirect("/admin");
    return;
  }

  const content = announcementForm(a, true);
  res.send(adminPage(content, baseUrl));
});

router.post("/admin/add", (req, res) => {
  const { headline, description, link, category, publish_date } = req.body as {
    headline: string; description: string; link?: string; category?: string; publish_date: string;
  };

  db.prepare(
    `INSERT INTO announcements (headline, description, link, category, publish_date, active) VALUES (?, ?, ?, ?, ?, 1)`
  ).run(
    headline.trim(),
    description.trim(),
    link?.trim() || null,
    category?.trim() || null,
    publish_date,
  );

  (req.session as { flash?: string }).flash = "Announcement added successfully.";
  res.redirect("/admin");
});

router.post("/admin/edit/:id", (req, res) => {
  const { headline, description, link, category, publish_date, active } = req.body as {
    headline: string; description: string; link?: string; category?: string;
    publish_date: string; active?: string;
  };

  db.prepare(
    `UPDATE announcements SET headline=?, description=?, link=?, category=?, publish_date=?, active=? WHERE id=?`
  ).run(
    headline.trim(),
    description.trim(),
    link?.trim() || null,
    category?.trim() || null,
    publish_date,
    active === "1" ? 1 : 0,
    req.params.id,
  );

  (req.session as { flash?: string }).flash = "Announcement updated.";
  res.redirect("/admin");
});

router.post("/admin/toggle/:id", (req, res) => {
  db.prepare(
    `UPDATE announcements SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END WHERE id = ?`
  ).run(req.params.id);
  res.redirect("/admin");
});

router.post("/admin/delete/:id", (req, res) => {
  db.prepare(`DELETE FROM announcements WHERE id = ?`).run(req.params.id);
  (req.session as { flash?: string }).flash = "Announcement deleted.";
  res.redirect("/admin");
});

export default router;
