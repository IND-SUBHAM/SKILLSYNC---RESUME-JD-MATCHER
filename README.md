# SkillSync | AI-Powered Resume & Job Description Matcher

SkillSync is an intelligent candidate evaluation platform designed to bridge the gap between job seekers and job descriptions (JDs). Utilizing Natural Language Processing (NLP), TF-IDF vectorization, and rule-based entity extraction, SkillSync parses resumes and job descriptions (PDF, DOCX, or text), evaluates candidate compatibility, highlights critical skill gaps, and extracts comprehensive work and educational histories.

---

## 🌟 Key Features

- **Automated Resume & JD Parsing**: Extracts text seamlessly from PDF, DOCX, and raw text inputs using `PyMuPDF` and `python-docx`.
- **TF-IDF & Cosine Similarity Match Engine**: Computes realistic match percentages between candidate profiles and job requirements.
- **Skill Gap & Compatibility Analysis**:
  - Automatically identifies matching technical skills.
  - Highlights missing skills needed for the target role.
  - Suggests actionable learning recommendations.
- **Entity & Profile Extraction**:
  - **Personal Details**: Candidate Name, Email, Phone Number, LinkedIn, GitHub, and Location.
  - **Experience & Role**: Current job title, years of experience, internship flags, and full chronological work history.
  - **Education**: Degree, engineering branch/major, CGPA, percentage, and secondary schooling milestones.
- **Interactive Modern UI**:
  - Animated dynamic hexagonal background and dark glassmorphic interface.
  - Drag-and-drop file uploaders with file validation.
  - Real-time **Backend Connection Status indicator** (`Connected` / `Offline`).
  - Slide-out **Match History Drawer** with search, record re-loading, and deletion.
  - One-click PDF report printing / export.
- **File Watcher (CLI Mode)**: Automatic folder watcher (`watcher.py`) that executes command-line parsing whenever new resumes or job descriptions are placed into the `resumes/` or `jd/` directories.

---

## 🏗️ Architecture

```
                        +---------------------------+
                        |   SkillSync Web UI        |
                        | (HTML5 / CSS3 / ES6 JS)   |
                        +-------------+-------------+
                                      |
                     REST API Calls   |  Dynamic Base URL
                     (JSON / Form)    |  CORS Enabled
                                      v
                        +---------------------------+
                        |    Flask Backend Server   |
                        |        (server.py)        |
                        +-------------+-------------+
                                      |
         +----------------------------+----------------------------+
         |                            |                            |
         v                            v                            v
+------------------+         +------------------+         +------------------+
|  Text Extraction |         |   Match Engine   |         | Entity & History |
| (PyMuPDF / docx) |         | (TF-IDF / Cosine)|         |   Persistence    |
+------------------+         +------------------+         +------------------+
```

---

## 📁 Project Structure

```
SkillSync Folder/
├── app.py                  # Standalone CLI matcher script
├── server.py               # Flask REST API server and static file host
├── watcher.py              # File system watcher for automated CLI runs
├── matcher.py              # TF-IDF cosine similarity calculation
├── skills.py               # Technical skill dictionary and extractor
├── skill_gap.py            # Skill comparison and gap detector
├── personal_info.py        # Regex & NLP entity extraction (email, phone, links)
├── experience.py           # Experience duration and work history parser
├── education.py            # Degree, CGPA, and branch parser
├── jd_parser.py            # Job description file reader
├── resume_parser.py        # Resume document reader
├── utils.py                # Text normalization and preprocessing
├── match_history.json      # Persistent record of evaluations
├── run_server.bat          # 1-Click launcher for Windows (Batch)
├── run_server.ps1          # 1-Click launcher for Windows (PowerShell)
├── resumes/                # Uploaded and sample resumes (.pdf, .docx)
├── jd/                     # Uploaded and sample job descriptions
└── static/                 # Frontend Web Application
    ├── index.html          # Main application page
    ├── style.css           # Glassmorphism styling and theme
    ├── app.js              # State management and API client
    ├── hex-background.js   # Canvas hexagonal background animation
    └── skillsync-logo-*.png# Branding assets and icons
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Python 3.10+** (Python 3.13 or 3.14 recommended)
- Required Python libraries:
  ```bash
  pip install flask flask-cors pymupdf python-docx scikit-learn
  ```
  *(Optional for watcher file observer)*:
  ```bash
  pip install watchdog
  ```

---

### 2. Running the Application

#### Option A: One-Click Startup (Windows)
Double-click [`run_server.bat`](file:///c:/Users/ASUS/Desktop/SkillSync%20Folder/run_server.bat).  
It will automatically locate Python, start the backend server, and open `http://127.0.0.1:5000` in your default browser.

#### Option B: Terminal / Command Prompt
Start the Flask backend server:
```bash
python server.py
```
Or with explicit Python path:
```powershell
& "$env:LOCALAPPDATA\Programs\Python\Python314\python.exe" server.py
```

Then open your browser at:
```
http://127.0.0.1:5000
```

---

### 3. Running in CLI Mode

You can also run analysis directly on individual files from the command line:

```bash
python app.py "resumes/sample_resume.pdf" "jd/sample_jd.pdf"
```

Or start the automatic directory observer:
```bash
python watcher.py
```
Any file dropped into `resumes/` or `jd/` will instantly trigger analysis in your terminal.

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Serves the SkillSync web application (`index.html`). |
| `/api/health` | `GET` | Health check endpoint returning backend status and timestamp. |
| `/api/match` | `POST` | Uploads resume and JD files (multipart form) and returns complete analysis. |
| `/api/history` | `GET` | Retrieves saved candidate match evaluations. |
| `/api/history` | `DELETE` | Clears all stored match history records. |
| `/api/history/<id>` | `DELETE` | Removes a specific evaluation record by its unique ID. |

### `/api/match` Request Format:
- `resume_file`: (File, required) PDF or DOCX resume document.
- `jd_file`: (File, optional) PDF or DOCX job description.
- `jd_text`: (String, optional) Raw job description text (if `jd_file` not provided).

---

## 🛡️ License

This project is created for candidate matching and skill analysis. Feel free to customize and extend for your talent acquisition workflows.

