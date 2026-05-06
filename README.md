
## ResumeAI – AI Resume Analyzer ##

ResumeAI is a smart AI-powered resume analysis web application that helps users evaluate and improve their resumes using ATS-based scoring and intelligent suggestions.

It consists of a modern React frontend and a Node.js backend, integrated with Google Gemini AI for advanced resume analysis.

## Features ##

- Resume Upload (PDF, DOC, DOCX)
- ATS Match Score
- AI-Powered Analysis using Google Gemini
- Skill Extraction
- Missing Keywords Detection
- Improvement Suggestions
- Fallback Local Analysis (No AI dependency)
- Frontend–Backend API Integration
- Backend Health Check Endpoint
  
## Project Architecture ##

Frontend (React + Vite)
        ↓
   API Request
        ↓
Backend (Node.js + Express)
        ↓
Text Extraction → Gemini AI → Response
        ↓
   JSON Output → Frontend UI
   
##  Tech Stack
* Frontend - React, Vite, Axios, Bootstrap
* Backend - Node.js, Express
* Multer (File Upload Handling)
* AI Integration - Google Gemini
* File Parsing - PDF Parser, DOC/DOCX Parser

## How It Works ##
  -> Backend Flow -> Accept resume upload -> Validate file type & size -> Extract resume text
  -> Send text to Gemini AI with ATS prompt -> Return structured JSON response
  If AI fails → fallback to local rule-based analysis


## Folder Structure ##
resume-ai/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── utils/
│
└── README.md

## Future Enhancements ##

* User Authentication
* Resume History Tracking
* Downloadable Reports (PDF)
* Job-specific Resume Optimization
* Multi-language support

## License ##

This project is licensed under the MIT License.

## ⭐ Support ##

If you like this project, give it a ⭐ on GitHub!
Check out - https://resumeatsai.netlify.app/

