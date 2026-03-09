const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();
const multer = require("multer");
const { OpenAI } = require("openai");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

const openai =
  process.env.OPENAI_API_KEY || process.env.OPENAI_SECRET_KEY
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_SECRET_KEY,
      })
    : null;

if (!openai) {
  console.warn(
    "WARNING: OPENAI_API_KEY is missing. Voice search will not work.",
  );
}

// Setup multer for audio uploads
const upload = multer({ dest: "uploads/" });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("."));

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Handle form submission
app.post("/api/contact", async (req, res) => {
  const { name, contact, email, message } = req.body;

  // Validate input
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "Please fill in all required fields",
    });
  }

  try {
    // Save to Supabase database
    const { data: dbData, error: dbError } = await supabase
        .from('contact_submissions')
        .insert([
            {
                name: name,
                email: email,
                contact: contact || null,
                rating: req.body.rating ? parseInt(req.body.rating) : null,
                message: message
            }
        ]);

    if (dbError) {
        console.error("Supabase error:", dbError);
        // Continue with email even if database fails
    }

    // Configure Gmail transporter
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "New Contact Form Submission - I Love Quran",
      html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Contact Number:</strong> ${contact || "Not provided"}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Rating:</strong> ${req.body.rating ? req.body.rating + " / 5 Stars" : "Not Rated"}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
                <hr>
                <p><small>Sent from I Love Quran website</small></p>
            `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Thank you for your feedback! We'll get back to you soon.",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message. Please try again later.",
    });
  }
});

// Admin login endpoint
app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Validate credentials
        if (username !== process.env.ADMIN_USERNAME) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid credentials" 
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
        
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid credentials" 
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { username: username, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token: token,
            message: "Login successful"
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Login failed" 
        });
    }
});

// Get all contact submissions (protected route)
app.get("/api/admin/submissions", authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('contact_submissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            submissions: data
        });

    } catch (error) {
        console.error("Error fetching submissions:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to fetch submissions" 
        });
    }
});

// AI Search Assistant endpoint
app.post("/api/search/assist", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ success: false, message: "Query is required" });
  }

  if (!openai) {
    return res.status(500).json({
      success: false,
      message: "OpenAI API key is missing on the server.",
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful Quranic assistant. A user wants to find something in the Quran.
          Based on their input, provide:
          1. A concise explanation of what the Quran says about this topic.
          2. 2-3 specific search keywords (in English or Arabic) that would help them find relevant verses.
          3. Return the response in JSON format: { "explanation": "...", "keywords": ["...", "..."] }`
        },
        {
          role: "user",
          content: query,
        },
      ],
      response_format: { type: "json_object" }
    });

    const assistData = JSON.parse(response.choices[0].message.content);
    res.json({
      success: true,
      data: assistData
    });
  } catch (error) {
    console.error("AI Assist Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get AI search assistance."
    });
  }
});

// Voice to Quran endpoint
app.post("/api/voice-search", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No audio file uploaded" });
    }

    if (!openai) {
      return res.status(500).json({
        success: false,
        message:
          "OpenAI API key is missing on the server. Please check the .env file.",
      });
    }

    const audioPath = req.file.path;

    // 1. Transcribe audio using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
    });

    const text = transcription.text;
    console.log("Transcribed text:", text);

    // 2. Translate/Convert to Arabic text if not already Arabic
    // We'll use GPT to "Translate the following to Arabic and keep it as a search query for Quran"
    const translationResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a Quranic assistant. Translate the user's input into Arabic as it would appear in the Quran. Provide ONLY the Arabic text.",
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const arabicSearchQuery =
      translationResponse.choices[0].message.content.trim();
    console.log("Arabic search query:", arabicSearchQuery);

    // 3. Search Quran using the Arabic text
    // Using the alquran.cloud API
    const searchUrl = `http://api.alquran.cloud/v1/search/${encodeURIComponent(arabicSearchQuery)}/all/ar.uthmani`;
    const fetch = (await import("node-fetch")).default; // Use dynamic import for node-fetch if needed, or use native fetch if node 18+

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    // Clean up uploaded file
    fs.unlinkSync(audioPath);

    res.json({
      success: true,
      transcription: text,
      arabicQuery: arabicSearchQuery,
      results: searchData.data ? searchData.data.matches : [],
    });
  } catch (error) {
    console.error("Error in voice search:", error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({
      success: false,
      message: "Failed to process voice search. " + error.message,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
