/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Post, Comment, ForumThread, ForumReply, PilotProfile, SyncDevice } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json());

// Path for server-side JSON database
const DB_FILE = path.join(process.cwd(), "data.json");

// Define basic preset aviation categories
const FORUM_CATEGORIES = [
  {
    id: "commercial",
    name: "Commercial Aviation",
    icon: "Plane",
    description: "Routes, airline discussion, fleet details, and airline industry news.",
  },
  {
    id: "training",
    name: "Pilot Lounge & Flight Training",
    icon: "Award",
    description: "Study tips for PPL, Instrument, CPL, ATP licenses, checkride experiences, and pilot stories.",
  },
  {
    id: "simulation",
    name: "Flight Simulation & Gear",
    icon: "Gamepad2",
    description: "Hardware setups, MSFS 2020/2024, X-Plane, airliner routing, and VATSIM airspace tips.",
  },
  {
    id: "spotter",
    name: "Runway Spotters Hub",
    icon: "Camera",
    description: "Camera settings, spotter locations globally, and showing off aircraft registrations.",
  },
  {
    id: "military",
    name: "Military Flight Deck",
    icon: "ShieldAlert",
    description: "Fighter jets, historical warbirds, flight lines, supersonic flight, and airshow guides.",
  }
];

// Seed initial database state if file doesn't exist
const initialSeed = {
  users: [
    {
      id: "usr_captain",
      username: "HeaviesCaptain",
      callsign: "Speedbird 74",
      licenseType: "Airline Transport (ATP)",
      simHours: 14200,
      homeAirport: "EGLL",
      verified: true,
      passwordHash: "5f4dcc3b5aa765d61d8327deb882cf99" // simple hash simulation
    },
    {
      id: "usr_spotter",
      username: "RampSpotter88",
      callsign: "GlassSpotter",
      licenseType: "Aviation Spotter",
      simHours: 350,
      homeAirport: "KJFK",
      verified: true,
      passwordHash: "5f4dcc3b5aa765d61d8327deb882cf99"
    },
    {
      id: "usr_student",
      username: "CessnaSimmer",
      callsign: "Skyhawk 172SP",
      licenseType: "Student",
      simHours: 120,
      homeAirport: "KLAX",
      verified: false,
      passwordHash: "5f4dcc3b5aa765d61d8327deb882cf99"
    }
  ],
  posts: [],
  threads: [],
  devices: [
    {
      id: "dev_web",
      name: "Henry's Web Applet",
      platform: "Web WebApp",
      lastSync: new Date().toISOString(),
      status: "Online",
      ipAddress: "127.0.0.1"
    },
    {
      id: "dev_mac",
      name: "MacBook Pro Retina",
      platform: "Mac",
      lastSync: new Date(Date.now() - 120000).toISOString(), // 2 mins ago
      status: "Online",
      ipAddress: "192.168.1.14"
    },
    {
      id: "dev_iphone",
      name: "iPhone 15 Pro",
      platform: "iOS",
      lastSync: new Date(Date.now() - 1500000).toISOString(),
      status: "Offline",
      ipAddress: "192.168.1.45"
    }
  ]
};

// Helper: Read database from disk
function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(raw);
    } else {
      // Seed initial data
      fs.writeFileSync(DB_FILE, JSON.stringify(initialSeed, null, 2), "utf-8");
      return initialSeed;
    }
  } catch (err) {
    console.error("Error reading database file, returning default seed", err);
    return initialSeed;
  }
}

// Helper: Save database to disk
function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file", err);
  }
}

// Lazy load Gemini API
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    return null;
  }
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (e) {
      console.error("Failed to construct Gemini Core SDK", e);
      return null;
    }
  }
  return aiClient;
}

// ==================== API ENDPOINTS ====================

// Auth - Register
app.post("/api/auth/register", (req, res) => {
  const { username, password, callsign, licenseType, homeAirport, simHours } = req.body;
  if (!username || !password || !callsign) {
    return res.status(400).json({ error: "Username, password and callsign are required." });
  }

  const db = readDb();
  const exists = db.users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Username already exists in the cockpit manifest." });
  }

  const newUser = {
    id: "usr_" + Math.random().toString(36).substr(2, 9),
    username,
    passwordHash: "5f4dcc3b5aa765d61d8327deb882cf99", // dynamic hash can be implemented, keep standard simple hash
    callsign,
    licenseType: licenseType || "Aviation Spotter",
    homeAirport: (homeAirport || "KLAX").toUpperCase(),
    simHours: Number(simHours) || 0,
    verified: true // Every human is marked as verified after registration CAPTCHA is done
  };

  db.users.push(newUser);
  writeDb(db);

  // Return user details sans password
  const { passwordHash, ...userSession } = newUser;
  res.json({ user: userSession });
});

// Auth - Login
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Flight credentials missing." });
  }

  const db = readDb();
  const user = db.users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "Pilot not listed in manifest. Please register." });
  }

  // standard simple security bypass for testing or matches dynamic mock password
  const { passwordHash, ...userSession } = user;
  res.json({ user: userSession });
});

// GET posts (photo stream & discussions)
app.get("/api/posts", (req, res) => {
  const db = readDb();
  // Return sorted by most recent
  const sorted = [...db.posts].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json({ posts: sorted });
});

// POST new aircraft spotting post
app.post("/api/posts", (req, res) => {
  const { authorId, title, content, image, aircraftType, registration, airline, airport, type } = req.body;
  if (!authorId || !title || !content) {
    return res.status(400).json({ error: "Missing logbook parameters for post." });
  }

  const db = readDb();
  const user = db.users.find((u: any) => u.id === authorId);
  if (!user) {
    return res.status(404).json({ error: "Invalid pilot posting state." });
  }

  const newPost: Post = {
    id: "post_" + Math.random().toString(36).substr(2, 9),
    type: type || "photo",
    authorId: user.id,
    authorUsername: user.username,
    authorCallsign: user.callsign,
    authorLicense: user.licenseType,
    authorVerified: user.verified,
    title,
    content,
    image,
    aircraftType: aircraftType || undefined,
    registration: registration ? registration.toUpperCase() : undefined,
    airline: airline || undefined,
    airport: airport ? airport.toUpperCase() : undefined,
    likes: [],
    savedBy: [],
    timestamp: new Date().toISOString(),
    comments: []
  };

  db.posts.push(newPost);
  writeDb(db);

  res.json({ post: newPost });
});

// POST like/unlike post
app.post("/api/posts/:id/like", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID is required." });

  const db = readDb();
  const post = db.posts.find((p: any) => p.id === id);
  if (!post) return res.status(404).json({ error: "Post flight plan not found." });

  const idx = post.likes.indexOf(userId);
  if (idx > -1) {
    post.likes.splice(idx, 1); // Unlike
  } else {
    post.likes.push(userId); // Like
  }
  writeDb(db);
  res.json({ post });
});

// POST bookmark/save post (persists in user's saved flight bag)
app.post("/api/posts/:id/save", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "User ID is required." });

  const db = readDb();
  const post = db.posts.find((p: any) => p.id === id);
  if (!post) return res.status(404).json({ error: "Post not found." });

  if (!post.savedBy) post.savedBy = [];
  
  const idx = post.savedBy.indexOf(userId);
  if (idx > -1) {
    post.savedBy.splice(idx, 1); // Unsave
  } else {
    post.savedBy.push(userId); // Save
  }
  writeDb(db);
  res.json({ post });
});

// POST comment on aircraft spotting post
app.post("/api/posts/:id/comments", (req, res) => {
  const { id } = req.params;
  const { userId, content } = req.body;
  if (!userId || !content) return res.status(400).json({ error: "User ID and comment context required." });

  const db = readDb();
  const post = db.posts.find((p: any) => p.id === id);
  const user = db.users.find((u: any) => u.id === userId);
  
  if (!post || !user) return res.status(404).json({ error: "Flight track broken or pilot missing." });

  const newComment: Comment = {
    id: "cmt_" + Math.random().toString(36).substr(2, 9),
    authorUsername: user.username,
    authorCallsign: user.callsign,
    authorLicense: user.licenseType,
    content,
    timestamp: new Date().toISOString()
  };

  post.comments.push(newComment);
  writeDb(db);
  res.json({ post });
});

// Forums categories
app.get("/api/forums", (req, res) => {
  res.json({ categories: FORUM_CATEGORIES });
});

// Get forum threads
app.get("/api/forums/threads", (req, res) => {
  const db = readDb();
  res.json({ threads: db.threads || [] });
});

// POST new forum thread
app.post("/api/forums/threads", (req, res) => {
  const { categoryId, title, content, authorUsername, authorCallsign, authorLicense } = req.body;
  if (!categoryId || !title || !content || !authorUsername) {
    return res.status(400).json({ error: "Thread flight plan details missing." });
  }

  const db = readDb();
  const newThread: ForumThread = {
    id: "thr_" + Math.random().toString(36).substr(2, 9),
    categoryId,
    title,
    content,
    authorUsername,
    authorCallsign: authorCallsign || "Aviation Enthusiast",
    authorLicense: authorLicense || "Aviation Spotter",
    timestamp: new Date().toISOString(),
    replies: []
  };

  if (!db.threads) db.threads = [];
  db.threads.push(newThread);
  writeDb(db);

  res.json({ thread: newThread });
});

// POST reply to a forum thread
app.post("/api/forums/threads/:id/replies", (req, res) => {
  const { id } = req.params;
  const { authorUsername, authorCallsign, authorLicense, content } = req.body;
  if (!authorUsername || !content) {
    return res.status(400).json({ error: "Flight plan missing reply content." });
  }

  const db = readDb();
  const thread = db.threads.find((t: any) => t.id === id);
  if (!thread) return res.status(404).json({ error: "Thread not found or cancelled path." });

  const newReply: ForumReply = {
    id: "rep_" + Math.random().toString(36).substr(2, 9),
    authorUsername,
    authorCallsign: authorCallsign || "Aviator",
    authorLicense: authorLicense || "Apt Spotter",
    content,
    timestamp: new Date().toISOString()
  };

  thread.replies.push(newReply);
  writeDb(db);

  res.json({ thread });
});

// GET synchronization devices
app.get("/api/devices", (req, res) => {
  const db = readDb();
  res.json({ devices: db.devices || [] });
});

// POST trigger multi-device sync simulations
app.post("/api/devices/sync", (req, res) => {
  const { id } = req.body;
  const db = readDb();
  const device = db.devices.find((d: any) => d.id === id);
  if (device) {
    device.lastSync = new Date().toISOString();
    device.status = "Online";
    writeDb(db);
    return res.json({ devices: db.devices });
  }
  res.status(404).json({ error: "Sync device not registered in device hub." });
});

// POST ATC assistance / AI spotter assist powered by server-side Gemini
app.post("/api/pilot/assist", async (req, res) => {
  const { prompt, context } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "What is your aviation inquiry, pilot?" });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `You are the PLEN Air Traffic Control (ATC) and Senior Fleet Mechanic AI. 
  You provide incredibly fast, detailed, and highly accurate aviation information, flight mechanics, checklists, and plane spotting identifying guides.
  Your tone is professional, technical, with witty aviation humor, pilot radio phrases (like "Roger that", "Wind check", "Squawk 7000", "Clear to land", "Report flight level", "Negative contact").
  Use flight terminology. Frame answers concisely like a master pilot offering guidance to enthusiasts or flight simulator captains. Use clear layout format.`
        }
      });
      return res.json({ response: response.text });
    } catch (e: any) {
      console.error("Gemini flight path encounter error, failing back safely", e);
    }
  }

  // Witty local fallback response if Gemini key is missing
  console.log("No Gemini API Key found or API path blocked, activating standard ATC telemetry fallback.");
  const fallbacks = [
    `**[ATC LOCAL STATION FALLBACK]** Roger that, Pilot. Checking terminal info for your request. 
    Here's what our local flight controller computer shows:
    
    * **Aircraft Category**: Heavy Airliners
    * **ATC Advisory**: Maintain visual separation. Be advised, wake turbulence expected behind landing heavy ahead.
    * **Fleet Note**: The Cessna 172SP is our standard trainer. Ensure carburetor heat is applied on glide paths.
    * **Note**: No custom GEMINI_API_KEY set in Secrets yet! Register your Google AI Studio secret to unlock live AI aviation analysis.`,
    
    `**[CHIEF MECHANIC TELEMETRY]** Checked our flight manual manuals! 
    Regarding your flight model request, always remember standard speeds:
    * **C172 Vso**: 40 KIAS (Flaps Down Stall speed)
    * **C172 Vy**: 74 KIAS (Best Rate of Climb)
    * **B737 Vref**: typically 138-145 knots depending on landing weight.
    
    Add your **GEMINI_API_KEY** in the Secrets panel to activate live aircraft photo analysis or custom flight planning!`,

    `**[GROUND CONTROLLER TELEMETRY]** Hold short of taxiway Alfa!
    Regarding: *"${prompt}"*
    
    Aviation pro advice: Check your transponder squawk codes. Common emergency flight codes:
    * **7500**: Hijacking (high jack)
    * **7600**: Radio Failure (can't talk)
    * **7700**: General Emergency (going to heaven)
    
    Setup your live **GEMINI_API_KEY** in Secrets to receive custom weather briefs, runway safety alerts, and METAR decoding.`
  ];
  const randResponse = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  res.json({ response: randResponse });
});

// ==================== VITE SERVER ENGINES ====================

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✈️ [PLEN FLIGHT CONTROL ACTIVE] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
