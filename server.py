# server.py
import os
import subprocess
import logging
import flask.cli

# Suppress Flask development server startup messages and warnings
flask.cli.show_server_banner = lambda *args, **kwargs: None

# Suppress Flask request logs (e.g. 127.0.0.1 - - ...)
logging.getLogger('werkzeug').setLevel(logging.ERROR)

from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

import json
import uuid
import datetime

# Import parsing modules
from education import (
    extract_branch,
    extract_cgpa,
    extract_degree,
    extract_percentage,
    education_level,
)
from experience import current_role, extract_experience, internship_found, extract_work_history
from jd_parser import extract_jd_text
from matcher import calculate_match
from personal_info import (
    extract_name,
    extract_email,
    extract_phone,
    extract_linkedin,
    extract_github,
    extract_location,
)
from resume_parser import extract_resume_text
from skill_gap import find_missing_skills
from skills import extract_skills
from utils import clean_text

app = Flask(__name__, static_folder='static', static_url_path='')

# Enable Cross-Origin Resource Sharing (CORS) so frontend running on any host/port can connect
try:
    from flask_cors import CORS
    CORS(app, resources={r"/*": {"origins": "*"}})
except ImportError:
    @app.after_request
    def apply_cors_fallback(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        return response

RESUMES_DIR = "resumes"
JD_DIR = "jd"
HISTORY_FILE = "match_history.json"

# Make sure directories exist
os.makedirs(RESUMES_DIR, exist_ok=True)
os.makedirs(JD_DIR, exist_ok=True)

def load_match_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading match history: {e}")
            return []
    return []

def save_match_history(history):
    for path in [HISTORY_FILE, os.path.join(app.static_folder, HISTORY_FILE)]:
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(history, f, indent=2)
        except Exception as e:
            print(f"Error writing match history to {path}: {e}")

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health_check():
    """Health check endpoint to test connection between frontend and backend."""
    return jsonify({
        "success": True,
        "status": "online",
        "service": "SkillSync Resume & JD Matcher API",
        "timestamp": datetime.datetime.now().isoformat()
    })

@app.route('/api/history', methods=['GET'])
def get_match_history():
    """Returns list of past match evaluations."""
    history = load_match_history()
    return jsonify({"success": True, "history": history})

@app.route('/api/history', methods=['DELETE'])
def clear_all_history():
    """Clears all stored match history."""
    save_match_history([])
    return jsonify({"success": True, "message": "All match history cleared."})

@app.route('/api/history/<item_id>', methods=['DELETE'])
def delete_single_history(item_id):
    """Deletes a specific match history record."""
    history = load_match_history()
    filtered = [item for item in history if item.get('id') != item_id]
    save_match_history(filtered)
    return jsonify({"success": True, "message": "Record deleted from history."})

@app.route('/api/match', methods=['POST'])
def match_resume_to_jd():
    """
    Accepts files for matching. Saves them to workspace folders,
    runs the CLI app.py as a subprocess, prints CLI output, and returns analysis.
    Handles multipart/form-data with fields:
    - resume_file: file upload (required)
    - jd_file: file upload (optional)
    - jd_text: text input (optional)
    """
    try:
        # 1. Save Resume File directly in resumes/ folder
        if 'resume_file' in request.files and request.files['resume_file'].filename:
            file = request.files['resume_file']
            filename = secure_filename(file.filename)
            resume_path = os.path.join(RESUMES_DIR, filename)
            file.save(resume_path)
            resume_text = extract_resume_text(resume_path)
        else:
            return jsonify({"success": False, "error": "Please upload a resume file (PDF or DOCX)."}), 400

        # 2. Save Job Description File directly in jd/ folder
        jd_path = ""
        jd_text = ""
        if 'jd_file' in request.files and request.files['jd_file'].filename:
            file = request.files['jd_file']
            filename = secure_filename(file.filename)
            jd_path = os.path.join(JD_DIR, filename)
            file.save(jd_path)
            jd_text = extract_jd_text(jd_path)
        elif 'jd_text' in request.form and request.form['jd_text'].strip():
            jd_text = request.form['jd_text']
            # Save raw pasted text as pasted_job_description.txt
            jd_path = os.path.join(JD_DIR, "pasted_job_description.txt")
            with open(jd_path, "w", encoding="utf-8") as f:
                f.write(jd_text)
        else:
            return jsonify({"success": False, "error": "Please upload a Job Description file or paste the text directly."}), 400

        # Check if text extraction worked
        if not resume_text.strip():
            return jsonify({"success": False, "error": "Could not extract text from the resume. Please ensure it is a valid PDF or DOCX file."}), 400
        if not jd_text.strip():
            return jsonify({"success": False, "error": "Could not extract text from the Job Description. Please ensure it is a valid PDF or DOCX file."}), 400

        # Write/update config file
        import json
        config_path = "latest_config.json"
        try:
            with open(config_path, "w", encoding="utf-8") as f:
                json.dump({
                    "resume": resume_path,
                    "jd": jd_path
                }, f, indent=2)
        except Exception as ce:
            print(f"Error writing configuration: {ce}")

        # 3. Execute CLI script app.py as a subprocess with custom files
        # We now rely entirely on the watcher.py filesystem observer to print the terminal output exactly once.
        terminal_output = ""

        # 4. Process matching and parsing (for the rich UI)
        clean_resume = clean_text(resume_text)
        clean_jd = clean_text(jd_text)

        # Match Score
        score = calculate_match(clean_resume, clean_jd)

        # Skills and Skill Gap
        import importlib
        import skills
        import skill_gap
        importlib.reload(skills)
        importlib.reload(skill_gap)
        resume_skills = skills.extract_skills(clean_resume)
        jd_skills = skills.extract_skills(clean_jd)
        missing_skills = skill_gap.find_missing_skills(resume_skills, jd_skills)

        # Experience
        resume_exp = extract_experience(clean_resume)
        jd_exp = extract_experience(clean_jd)
        internship = internship_found(clean_resume)
        role = current_role(clean_resume)
        work_history = extract_work_history(resume_text)

        # Education
        degree = extract_degree(clean_resume)
        branch = extract_branch(clean_resume)
        cgpa = extract_cgpa(clean_resume)
        percentage = extract_percentage(clean_resume)
        school_levels = education_level(clean_resume)

        # Personal Details
        name = extract_name(resume_text)
        email = extract_email(resume_text)
        phone = extract_phone(resume_text)
        linkedin = extract_linkedin(resume_text)
        github = extract_github(resume_text)
        location = extract_location(resume_text)

        # 5. Build detailed result payload
        analysis_result = {
            "success": True,
            "match_score": score,
            "resume_skills": resume_skills,
            "jd_skills": jd_skills,
            "missing_skills": missing_skills,
            "experience": {
                "resume": resume_exp,
                "jd": jd_exp,
                "internship": internship,
                "current_role": role
            },
            "work_history": work_history,
            "education": {
                "degree": degree,
                "branch": branch,
                "cgpa": cgpa,
                "percentage": percentage,
                "school_levels": school_levels
            },
            "personal_details": {
                "name": name,
                "email": email,
                "phone": phone,
                "linkedin": linkedin,
                "github": github,
                "location": location
            },
            "terminal_output": terminal_output
        }

        # 6. Save automatically to persistent match history
        try:
            now = datetime.datetime.now()
            cand_display = name if (name and name != "Not Found") else os.path.basename(resume_path)
            jd_display = os.path.basename(jd_path) if jd_path else "Pasted Job Description"
            hist_id = str(uuid.uuid4())[:8]

            history_entry = {
                "id": hist_id,
                "timestamp": now.strftime("%b %d, %Y • %I:%M %p"),
                "iso_time": now.isoformat(),
                "candidate_name": cand_display,
                "role": role if role != "Not Found" else "Candidate",
                "score": score,
                "resume_file": os.path.basename(resume_path),
                "jd_title": jd_display,
                "analysis": analysis_result
            }

            history = load_match_history()
            history.insert(0, history_entry)
            save_match_history(history[:100])
            analysis_result["history_id"] = hist_id
        except Exception as he:
            print(f"Error appending match history: {he}")

        return jsonify(analysis_result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"An unexpected error occurred during analysis: {str(e)}"}), 500

if __name__ == '__main__':
    print("Starting Resume & JD Matcher Server on http://127.0.0.1:5000 ...")
    app.run(host='127.0.0.1', port=5000, debug=True)
