/**
 * DARKX HUB — Server
 * Storage: MongoDB (Mongoose)
 * Web files: flat (single folder, no subfolders)
 * Owner identity: MrX Dev
 */
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json({ limit: "2mb" }));

// ================= MongoDB =================
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB imeunganishwa"))
  .catch((err) => console.error("❌ MongoDB imeshindikana kuunganishwa:", err.message));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: String, required: true, unique: true },
  salt: { type: String, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

const toolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: String, required: true },
  downloadLink: { type: String, required: true },
  previewLink: { type: String, required: true },
  coverImage: { type: String, default: "" },
  screenshots: { type: [String], default: [] },
  description: { type: String, default: "" },
  size: { type: String, default: "Haijulikani" },
  version: { type: String, default: "1.0" },
  category: { type: String, default: "Jumla" },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  downloads: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  uploadedBy: { type: String, required: true },
  uploaderName: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});
const Tool = mongoose.model("Tool", toolSchema);

function shapeTool(t) {
  const o = t.toObject ? t.toObject() : t;
  o.id = String(o._id);
  delete o._id;
  delete o.__v;
  return o;
}
function shapeUser(u) {
  const o = u.toObject ? u.toObject() : u;
  return { id: String(o._id), name: o.name, number: o.number, createdAt: o.createdAt };
}

function hashPassword(pw, salt) {
  return crypto.scryptSync(pw, salt, 32).toString("hex");
}
function newToken() {
  return crypto.randomBytes(24).toString("hex");
}

// ---------- in-memory sessions ----------
const userSessions = new Map(); // token -> userId
const adminSessions = new Set(); // valid admin tokens

async function getUserFromReq(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || !userSessions.has(token)) return null;
  const userId = userSessions.get(token);
  try {
    return await User.findById(userId);
  } catch (e) {
    return null;
  }
}
async function requireAuth(req, res, next) {
  const user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ error: "Tafadhali ingia (login) kwanza." });
  req.user = user;
  next();
}
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ error: "Admin session si sahihi. Ingia tena." });
  }
  next();
}

// ================= AUTH (users) =================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, number, password } = req.body || {};
    if (!name || !number || !password) {
      return res.status(400).json({ error: "Jaza jina, namba, na password." });
    }
    const existing = await User.findOne({ number });
    if (existing) return res.status(409).json({ error: "Namba hii tayari imesajiliwa. Ingia (login)." });

    const salt = crypto.randomBytes(16).toString("hex");
    const user = await User.create({
      name,
      number,
      salt,
      passwordHash: hashPassword(password, salt),
    });
    const token = newToken();
    userSessions.set(token, String(user._id));
    res.json({ token, user: shapeUser(user) });
  } catch (e) {
    res.status(500).json({ error: "Hitilafu ya server: " + e.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { number, password } = req.body || {};
    const user = await User.findOne({ number });
    if (!user || hashPassword(password, user.salt) !== user.passwordHash) {
      return res.status(401).json({ error: "Namba au password si sahihi." });
    }
    const token = newToken();
    userSessions.set(token, String(user._id));
    res.json({ token, user: shapeUser(user) });
  } catch (e) {
    res.status(500).json({ error: "Hitilafu ya server: " + e.message });
  }
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: shapeUser(req.user) });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  const token = (req.headers.authorization || "").slice(7);
  userSessions.delete(token);
  res.json({ ok: true });
});

// ================= TOOLS (public) =================
app.get("/api/tools", async (req, res) => {
  try {
    const { search = "", category = "", sort = "newest" } = req.query;
    const filter = { status: "approved" };
    if (category) filter.category = category;
    if (search) {
      const q = new RegExp(search, "i");
      filter.$or = [{ name: q }, { description: q }, { category: q }];
    }
    let sortSpec = { createdAt: -1 };
    if (sort === "downloads") sortSpec = { downloads: -1 };
    if (sort === "name") sortSpec = { name: 1 };

    const tools = await Tool.find(filter).sort(sortSpec);
    res.json({ tools: tools.map(shapeTool) });
  } catch (e) {
    res.status(500).json({ error: "Hitilafu ya server: " + e.message });
  }
});

app.get("/api/tools/categories", async (req, res) => {
  try {
    const cats = await Tool.distinct("category", { status: "approved" });
    res.json({ categories: cats.filter(Boolean) });
  } catch (e) {
    res.status(500).json({ error: "Hitilafu ya server: " + e.message });
  }
});

app.get("/api/tools/:id", async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) return res.status(404).json({ error: "Tool haipo." });
    res.json({ tool: shapeTool(tool) });
  } catch (e) {
    res.status(404).json({ error: "Tool haipo." });
  }
});

app.post("/api/tools/:id/view", async (req, res) => {
  try {
    await Tool.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ ok: true });
  } catch (e) {
    res.status(404).json({ error: "Tool haipo." });
  }
});

app.post("/api/tools/:id/download", async (req, res) => {
  try {
    const tool = await Tool.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true });
    if (!tool) return res.status(404).json({ error: "Tool haipo." });
    res.json({ ok: true, downloadLink: tool.downloadLink });
  } catch (e) {
    res.status(404).json({ error: "Tool haipo." });
  }
});

// ================= TOOLS (upload — auth required) =================
app.post("/api/tools", requireAuth, async (req, res) => {
  try {
    const {
      name,
      number,
      downloadLink,
      previewLink,
      coverImage,
      screenshots = [],
      description,
      size,
      version,
      category,
    } = req.body || {};

    if (!name || !number || !downloadLink || !previewLink) {
      return res.status(400).json({
        error: "Jaza jina la tool, namba, download link, na preview link (fields za lazima).",
      });
    }
    if (!Array.isArray(screenshots) || screenshots.length > 12) {
      return res.status(400).json({ error: "Screenshots/links za ziada ni upeo wa 12." });
    }

    const tool = await Tool.create({
      name,
      number,
      downloadLink,
      previewLink,
      coverImage: coverImage || "",
      screenshots: screenshots.filter(Boolean).slice(0, 12),
      description: description || "",
      size: size || "Haijulikani",
      version: version || "1.0",
      category: category || "Jumla",
      status: "pending",
      uploadedBy: String(req.user._id),
      uploaderName: req.user.name,
    });
    res.json({ tool: shapeTool(tool) });
  } catch (e) {
    res.status(500).json({ error: "Hitilafu ya server: " + e.message });
  }
});

app.get("/api/my-tools", requireAuth, async (req, res) => {
  const tools = await Tool.find({ uploadedBy: String(req.user._id) }).sort({ createdAt: -1 });
  res.json({ tools: tools.map(shapeTool) });
});

app.put("/api/my-tools/:id", requireAuth, async (req, res) => {
  const tool = await Tool.findOne({ _id: req.params.id, uploadedBy: String(req.user._id) });
  if (!tool) return res.status(404).json({ error: "Tool haipo au si yako." });
  const editable = [
    "name",
    "downloadLink",
    "previewLink",
    "coverImage",
    "screenshots",
    "description",
    "size",
    "version",
    "category",
    "number",
  ];
  editable.forEach((k) => {
    if (req.body[k] !== undefined) tool[k] = req.body[k];
  });
  tool.status = "pending"; // re-review after edit
  await tool.save();
  res.json({ tool: shapeTool(tool) });
});

app.delete("/api/my-tools/:id", requireAuth, async (req, res) => {
  const result = await Tool.deleteOne({ _id: req.params.id, uploadedBy: String(req.user._id) });
  if (!result.deletedCount) return res.status(404).json({ error: "Tool haipo au si yako." });
  res.json({ ok: true });
});

// ================= ADMIN =================
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Password si sahihi." });
  }
  const token = newToken();
  adminSessions.add(token);
  res.json({ token });
});

app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  const [totalTools, approved, pending, rejected, totalUsers, agg] = await Promise.all([
    Tool.countDocuments({}),
    Tool.countDocuments({ status: "approved" }),
    Tool.countDocuments({ status: "pending" }),
    Tool.countDocuments({ status: "rejected" }),
    User.countDocuments({}),
    Tool.aggregate([{ $group: { _id: null, downloads: { $sum: "$downloads" }, views: { $sum: "$views" } } }]),
  ]);
  res.json({
    totalTools,
    approved,
    pending,
    rejected,
    totalUsers,
    totalDownloads: agg[0]?.downloads || 0,
    totalViews: agg[0]?.views || 0,
  });
});

app.get("/api/admin/tools", requireAdmin, async (req, res) => {
  const { status = "" } = req.query;
  const filter = status ? { status } : {};
  const tools = await Tool.find(filter).sort({ createdAt: -1 });
  res.json({ tools: tools.map(shapeTool) });
});

app.put("/api/admin/tools/:id", requireAdmin, async (req, res) => {
  const tool = await Tool.findById(req.params.id);
  if (!tool) return res.status(404).json({ error: "Tool haipo." });
  Object.keys(req.body || {}).forEach((k) => {
    if (k !== "_id" && k !== "id") tool[k] = req.body[k];
  });
  await tool.save();
  res.json({ tool: shapeTool(tool) });
});

app.delete("/api/admin/tools/:id", requireAdmin, async (req, res) => {
  await Tool.deleteOne({ _id: req.params.id });
  res.json({ ok: true });
});

app.get("/api/admin/users", requireAdmin, async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 });
  res.json({ users: users.map(shapeUser) });
});

app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
  await User.deleteOne({ _id: req.params.id });
  res.json({ ok: true });
});

// ================= FLAT STATIC FILES =================
// Files live directly in the project root (flat, no subfolders).
// We whitelist exactly which files are servable so server.js / .env / package.json
// are never exposed publicly.
const ROOT = __dirname;
const pageFiles = {
  "/": "index.html",
  "/upload": "upload.html",
  "/login": "login.html",
  "/my-tools": "my-tools.html",
  "/admin": "admin.html",
  "/tool": "tool.html",
};
Object.entries(pageFiles).forEach(([route, file]) => {
  app.get(route, (req, res) => res.sendFile(path.join(ROOT, file)));
});
app.get("/tool/:id", (req, res) => res.sendFile(path.join(ROOT, "tool.html")));

const assetFiles = [
  "style.css",
  "api.js",
  "home.js",
  "upload.js",
  "login.js",
  "my-tools.js",
  "tool.js",
  "admin.js",
];
assetFiles.forEach((file) => {
  app.get("/" + file, (req, res) => res.sendFile(path.join(ROOT, file)));
});

app.listen(PORT, () => {
  console.log(`DARKX HUB inaendesha kwenye port ${PORT}`);
});
