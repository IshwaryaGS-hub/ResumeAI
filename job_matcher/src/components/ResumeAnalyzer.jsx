import { useState } from "react";
import axios from "axios";
import "./ResumeAnalyzer.css";

function ResumeAnalyzer() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) return alert("Please upload a file");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5000/analyze", formData);

      setResult(JSON.parse(res.data.analysis)); // assuming JSON response
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-lg p-4 main-card">
        <h2 className="text-center mb-4"> AI Resume Analyzer</h2>

        {/* Upload Section */}
        <div className="mb-3">
          <input
            type="file"
            className="form-control"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        <div className="text-center">
          <button className="btn btn-primary px-4" onClick={handleUpload}>
            Analyze Resume
          </button>
        </div>

        {/* Loader */}
        {loading && (
          <div className="text-center mt-4">
            <div className="spinner-border text-primary"></div>
            <p>Analyzing...</p>
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="mt-5">
            <h4>ATS Score</h4>
            <div className="progress mb-3">
              <div
                className="progress-bar bg-success"
                style={{ width: `${result.ats_score}%` }}
              >
                {result.ats_score}%
              </div>
            </div>

            <h5> Skills</h5>
            <div className="mb-3">
              {result.skills.map((skill, index) => (
                <span key={index} className="badge bg-primary me-2 mb-2">
                  {skill}
                </span>
              ))}
            </div>

            <h5>Missing Keywords</h5>
            <div className="mb-3">
              {result.missing_keywords.map((item, index) => (
                <span key={index} className="badge bg-warning text-dark me-2 mb-2">
                  {item}
                </span>
              ))}
            </div>

            <h5>Suggestions</h5>
            <ul>
              {result.suggestions.map((sug, index) => (
                <li key={index}>{sug}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeAnalyzer;