import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./ResumeAnalyzerExperience.css";

const processingTasks = [
  "Scanning document structure and formatting",
  "Extracting skills and experience signals",
  "Analyzing keyword alignment with job market",
  "Checking ATS compatibility and scoring",
  "Generating personalized improvement tips",
];

function getActiveTask(progress) {
  if (progress < 20) return 0;
  if (progress < 40) return 1;
  if (progress < 60) return 2;
  if (progress < 80) return 3;
  return 4;
}

function ScoreColor(score) {
  if (score >= 80) return "#36d399";
  if (score >= 60) return "#ffc857";
  return "#ff6b6b";
}

function ResumeAnalyzerExperience() {
  const [step, setStep] = useState("landing"); // landing | upload | processing | results
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    return () => clearInterval(progressIntervalRef.current);
  }, []);

  useEffect(() => {
    if (step !== "processing") return;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        const inc = prev < 30 ? 8 : prev < 60 ? 5 : 2;
        return Math.min(prev + inc, 92);
      });
    }, 480);

    return () => clearInterval(progressIntervalRef.current);
  }, [step]);

  const normalizeResult = (payload) => {
    const data = typeof payload === "string" ? JSON.parse(payload) : payload;
    return {
      ats_score: Number(data?.ats_score ?? 0),
      skills: Array.isArray(data?.skills) ? data.skills : [],
      missing_keywords: Array.isArray(data?.missing_keywords) ? data.missing_keywords : [],
      suggestions: Array.isArray(data?.suggestions) ? data.suggestions : [],
    };
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select a resume file before analyzing.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    setError("");
    setResult(null);
    setProgress(5);
    setStep("processing");

    try {
      const res = await axios.post("http://localhost:5000/analyze", formData);
      clearInterval(progressIntervalRef.current);
      setProgress(100);
      setTimeout(() => {
        setResult(normalizeResult(res.data.analysis ?? res.data));
        setStep("results");
      }, 600);
    } catch (err) {
      console.error(err);
      clearInterval(progressIntervalRef.current);
      const serverMessage =
        err?.response?.data?.error ||
        err?.message ||
        "Analysis failed. Please try again.";
      setError(serverMessage);
      setStep("upload");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setError("");
    }
  };

  const resetFlow = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    setError("");
    setStep("landing");
  };

  const activeTask = getActiveTask(progress);

  //Landing 
  if (step === "landing") {
    return (
      <div className="ux-shell">
        <div className="glow glow-a" />
        <div className="glow glow-b" />

        <header className="nav">
          <div className="brand">
            <span className="brand-icon">AI</span>
            <span className="brand-name">ResumeAI</span>
          </div>
          <button className="nav-cta" onClick={() => setStep("upload")}>
            Get Started
          </button>
        </header>

        <section className="landing-hero">
          <span className="badge">Free · Private · Instant</span>
          <h1 className="hero-title">
            Make your resume<br />
            <span className="gradient-text">ATS-proof.</span>
          </h1>
          <p className="hero-sub">
            Upload your resume and get an AI-powered score, keyword gaps, and
            targeted improvements — in under 10 seconds.
          </p>
          <button className="cta-btn" onClick={() => setStep("upload")}>
            Start Resume Review
            <span className="cta-arrow">→</span>
          </button>

          <div className="hero-stats">
            <div className="stat">
              <strong>10 sec</strong>
              <span>Average analysis time</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <strong>ATS + Skills</strong>
              <span>Multi-layer analysis</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <strong>100% Private</strong>
              <span>No data stored</span>
            </div>
          </div>
        </section>

      </div>
    );
  }

  //Upload
  if (step === "upload") {
    return (
      <div className="ux-shell">
        <div className="glow glow-a" />
        <div className="glow glow-b" />

        <header className="nav">
          <div className="brand">
            <span className="brand-icon">AI</span>
            <span className="brand-name">ResumeAI</span>
          </div>
          <button className="back-btn" onClick={() => setStep("landing")}>
            ← Back
          </button>
        </header>

        <div className="center-layout">
          <div className="upload-card">
            <div className="upload-card-header">
              <div className="upload-step-badge">Step 1 of 1</div>
              <h2>Upload Your Resume</h2>
              <p>Supports PDF, DOC, and DOCX files</p>
            </div>

            <label
              className={`dropzone ${dragOver ? "dropzone--over" : ""} ${file ? "dropzone--filled" : ""}`}
              htmlFor="resume-file"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                id="resume-file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setError("");
                }}
              />
              <div className="dropzone-content">
                <div className="dropzone-icon">
                  {file ? "✓" : "↑"}
                </div>
                {file ? (
                  <>
                    <p className="dropzone-filename">{file.name}</p>
                    <p className="dropzone-hint">Click to change file</p>
                  </>
                ) : (
                  <>
                    <p className="dropzone-title">Drop your resume here</p>
                    <p className="dropzone-hint">or click to browse</p>
                  </>
                )}
              </div>
            </label>

            {error && <p className="upload-error">{error}</p>}

            <button
              className={`analyze-btn ${file ? "analyze-btn--ready" : ""}`}
              onClick={handleAnalyze}
              disabled={!file}
            >
              {file ? "Analyze Resume →" : "Select a file to continue"}
            </button>

            <p className="upload-note">Your file is analyzed locally and never stored.</p>
          </div>
        </div>
      </div>
    );
  }

  //Processing 
  if (step === "processing") {
    return (
      <div className="ux-shell processing-shell">
        <div className="glow glow-a" />
        <div className="glow glow-b" />

        <div className="processing-card">
          <div className="processing-orbit" aria-hidden="true">
            <div className="processing-core">
              <span>{progress}%</span>
            </div>
          </div>

          <h2 className="processing-title">Analyzing with AI</h2>
          <p className="processing-sub">Our AI is reviewing your resume across multiple dimensions</p>

          <div className="processing-bar-wrap">
            <div className="processing-bar-track">
              <div
                className="processing-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="processing-pct">{progress}%</span>
          </div>

          <ul className="task-list">
            {processingTasks.map((task, i) => {
              const isDone = i < activeTask;
              const isActive = i === activeTask;
              return (
                <li
                  key={task}
                  className={`task-item ${isDone ? "task-item--done" : ""} ${isActive ? "task-item--active" : ""}`}
                >
                  <span className="task-dot">
                    {isDone ? "✓" : isActive ? "⟳" : "○"}
                  </span>
                  <span className="task-label">{task}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  // Results 
  const scoreColor = ScoreColor(result?.ats_score ?? 0);

  return (
    <div className="ux-shell">
      <div className="glow glow-a" />
      <div className="glow glow-b" />

      <header className="nav">
        <div className="brand">
          <span className="brand-icon">AI</span>
          <span className="brand-name">ResumeAI</span>
        </div>
        <button className="nav-cta" onClick={resetFlow}>
          Analyze Another
        </button>
      </header>

      <div className="results-shell">
        <div className="results-header">
          <span className="badge">Analysis Complete</span>
          <h2>Your Resume Report</h2>
          <p>Here's how your resume performs against ATS and recruiter expectations.</p>
        </div>

        <div className="results-grid">
          {/* Score card */}
          <div className="res-card score-card">
            <p className="res-label">ATS Match Score</p>
            <div
              className="score-ring"
              style={{ "--score": result?.ats_score ?? 0, "--color": scoreColor }}
            >
              <div className="score-ring-inner">
                <strong style={{ color: scoreColor }}>{result?.ats_score ?? 0}</strong>
                <span>/100</span>
              </div>
            </div>
            <p className="score-verdict">
              {result?.ats_score >= 80
                ? "Strong match — your resume is competitive."
                : result?.ats_score >= 60
                ? "Good start — a few tweaks will boost visibility."
                : "Needs work — follow the suggestions below."}
            </p>
          </div>

          {/* Skills */}
          <div className="res-card">
            <p className="res-label">Detected Skills</p>
            <h3>Your Strengths</h3>
            <div className="tag-row">
              {result?.skills?.length ? (
                result.skills.map((s) => (
                  <span key={s} className="tag tag-green">{s}</span>
                ))
              ) : (
                <p className="res-empty">No skills detected.</p>
              )}
            </div>
          </div>

          {/* Missing keywords */}
          <div className="res-card">
            <p className="res-label">Keyword Gaps</p>
            <h3>Missing Terms</h3>
            <div className="tag-row">
              {result?.missing_keywords?.length ? (
                result.missing_keywords.map((k) => (
                  <span key={k} className="tag tag-amber">{k}</span>
                ))
              ) : (
                <p className="res-empty">No keyword gaps found.</p>
              )}
            </div>
          </div>

          {/* Suggestions */}
          <div className="res-card suggestion-card">
            <p className="res-label">AI Recommendations</p>
            <h3>How to Improve</h3>
            {result?.suggestions?.length ? (
              <ol className="suggestion-ol">
                {result.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            ) : (
              <p className="res-empty">No suggestions at this time.</p>
            )}
          </div>
        </div>

        <div className="results-actions">
          <button className="cta-btn" onClick={resetFlow}>
            Analyze Another Resume
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResumeAnalyzerExperience;
