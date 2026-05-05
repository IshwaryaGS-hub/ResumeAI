require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error("Only PDF, DOC, and DOCX files are supported."));
  },
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) resume analyst with deep knowledge of hiring practices, job markets, and recruiter expectations across all industries.

Your job is to analyze resumes and return a structured JSON evaluation. You MUST respond with ONLY valid JSON, no markdown, no explanation, and no code fences.

Return exactly this shape:
{
  "ats_score": <integer 0-100>,
  "skills": [<list of skills detected in the resume>],
  "missing_keywords": [<important keywords/skills absent from the resume that recruiters commonly expect>],
  "suggestions": [<3 to 6 specific, actionable improvement tips>]
}

Scoring guide for ats_score:
- 80-100: Strong formatting, relevant keywords, clear experience, quantified achievements
- 60-79: Good foundation but missing some keywords or weak descriptions
- 40-59: Needs significant improvement in structure, keywords, or clarity
- 0-39: Major issues with formatting, relevance, or missing critical information

Keep suggestions concrete and specific. Avoid generic advice like "improve your resume".`;

const KNOWN_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "MongoDB",
  "MySQL",
  "PostgreSQL",
  "Python",
  "Java",
  "C++",
  "C#",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "Bootstrap",
  "Git",
  "GitHub",
  "REST API",
  "GraphQL",
  "Docker",
  "AWS",
  "Azure",
  "GCP",
  "Figma",
  "Redux",
  "Firebase",
  "SQL",
  "NoSQL",
  "Machine Learning",
  "Data Analysis",
  "Power BI",
  "Excel",
];

const ATS_KEYWORDS = [
  "leadership",
  "communication",
  "collaboration",
  "problem solving",
  "analytical",
  "stakeholder",
  "documentation",
  "testing",
  "deployment",
  "scalability",
  "performance",
  "optimization",
  "agile",
  "scrum",
  "ci/cd",
  "unit testing",
  "integration",
  "security",
  "automation",
  "api",
];

async function extractText(buffer, mimetype) {
  if (mimetype === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimetype === "application/msword" ||
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error("Unsupported file type.");
}

function extractJson(text) {
  const stripped = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(stripped);
  } catch (_err) {
    const start = stripped.indexOf("{");
    const end = stripped.lastIndexOf("}");

    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(stripped.slice(start, end + 1));
    }

    throw new Error("Failed to parse JSON from AI response.");
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasKeyword(text, keyword) {
  const normalized = keyword.replace(/\./g, "\\.");
  const pattern = new RegExp(`\\b${normalized.replace(/\s+/g, "\\s+")}\\b`, "i");
  return pattern.test(text);
}

function analyzeLocally(resumeText) {
  const normalizedText = resumeText.replace(/\s+/g, " ").trim();
  const loweredText = normalizedText.toLowerCase();

  const skills = KNOWN_SKILLS.filter((skill) => {
    const pattern = new RegExp(`\\b${escapeRegExp(skill).replace(/\s+/g, "\\s+")}\\b`, "i");
    return pattern.test(normalizedText);
  });

  const missingKeywords = ATS_KEYWORDS.filter((keyword) => !hasKeyword(loweredText, keyword))
    .slice(0, 8)
    .map((keyword) => keyword.replace(/\b\w/g, (char) => char.toUpperCase()));

  let score = 45;

  if (normalizedText.length > 1200) score += 10;
  if (normalizedText.length > 2200) score += 5;
  if (skills.length >= 4) score += 10;
  if (skills.length >= 8) score += 5;
  if (/\b\d+%|\b\d+\+|\b\d+\s?(years|yrs|months)\b/i.test(normalizedText)) score += 10;
  if (/\b(experience|projects|education|skills|summary)\b/i.test(normalizedText)) score += 10;
  if (/\b(led|built|developed|improved|optimized|implemented|designed)\b/i.test(normalizedText)) {
    score += 5;
  }

  score = Math.max(25, Math.min(92, score));

  const suggestions = [];

  if (!/\b\d+%|\b\d+\+|\b\d+\s?(years|yrs|months)\b/i.test(normalizedText)) {
    suggestions.push("Add measurable results like percentages, counts, or time saved to strengthen impact.");
  }

  if (!/\b(summary|profile|objective)\b/i.test(normalizedText)) {
    suggestions.push("Add a short professional summary at the top to clarify your target role and strengths.");
  }

  if (!/\b(projects?)\b/i.test(normalizedText)) {
    suggestions.push("Include a projects section with technologies used and the outcome of each project.");
  }

  if (missingKeywords.length >= 3) {
    suggestions.push(`Work relevant ATS keywords into your resume where they truthfully apply: ${missingKeywords.slice(0, 3).join(", ")}.`);
  }

  if (skills.length < 5) {
    suggestions.push("Make your technical skills section more explicit so recruiters and ATS tools can detect it quickly.");
  }

  if (!/\b(testing|unit testing|integration|qa)\b/i.test(normalizedText)) {
    suggestions.push("Mention testing, validation, or quality practices to show production readiness.");
  }

  return {
    ats_score: score,
    skills: skills.slice(0, 12),
    missing_keywords: missingKeywords,
    suggestions: suggestions.slice(0, 6),
  };
}

app.post("/analyze", upload.single("resume"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    const resumeText = await extractText(req.file.buffer, req.file.mimetype);

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(422).json({
        error:
          "Could not extract enough text from the file. If this is a scanned PDF or image-based resume, export it as a text-based PDF or DOCX and try again.",
      });
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const result = await model.generateContent(
          `${SYSTEM_PROMPT}\n\nAnalyze the following resume and return the JSON evaluation:\n\n${resumeText}`,
        );

        const rawText = result.response.text();
        const analysis = extractJson(rawText);

        return res.json({ analysis });
      } catch (aiErr) {
        console.error("[analyze] ai error, falling back to local analysis:", aiErr);
      }
    }

    return res.json({ analysis: analyzeLocally(resumeText) });
  } catch (err) {
    console.error("[analyze] error:", err);

    const message = err.message || "";
    const lowerMessage = message.toLowerCase();

    if (
      message.includes("API key") ||
      message.includes("API_KEY") ||
      lowerMessage.includes("permission")
    ) {
      return res.status(401).json({ error: "Invalid Gemini API key." });
    }

    if (message.includes("429") || lowerMessage.includes("quota")) {
      return res.status(429).json({ error: "Gemini rate limit reached. Please try again shortly." });
    }

    return res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({ error: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`Resume Analyzer server running on http://localhost:${PORT}`);
});
