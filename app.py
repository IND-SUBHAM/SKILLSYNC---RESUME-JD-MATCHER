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
from personal_info import *
from resume_parser import extract_resume_text
from skill_gap import find_missing_skills
from skills import extract_skills
from utils import clean_text


import os
import sys
import json

# Fallback values
default_resume = "resumes/BISWAGAT_M_BAIRAGI_Resume.pdf"
default_jd = "jd/Software_Engineer_Trainee_JD.pdf"

# Load latest uploaded configuration if it exists
config_path = "latest_config.json"
if os.path.exists(config_path):
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
            cfg_resume = config.get("resume")
            cfg_jd = config.get("jd")
            if cfg_resume and os.path.exists(cfg_resume):
                default_resume = cfg_resume
            if cfg_jd and os.path.exists(cfg_jd):
                default_jd = cfg_jd
    except Exception:
        pass

resume_file = sys.argv[1] if len(sys.argv) > 1 else default_resume
jd_file = sys.argv[2] if len(sys.argv) > 2 else default_jd

resume_text = extract_resume_text(resume_file)
jd_text = extract_jd_text(jd_file)

clean_resume = clean_text(resume_text)
clean_jd = clean_text(jd_text)

score = calculate_match(clean_resume, clean_jd)

resume_skills = extract_skills(clean_resume)
jd_skills = extract_skills(clean_jd)
missing_skills = find_missing_skills(resume_skills, jd_skills)

resume_exp = extract_experience(clean_resume)
jd_exp = extract_experience(clean_jd)

print("\nMatch Score:", score, "%")

print("\nResume Skills:")
print(resume_skills)

print("\nJD Skills:")
print(jd_skills)

print("\nMissing Skills:")
print(missing_skills)

print("\nResume Experience:")
print(resume_exp)

print("\nJD Required Experience:")
print(jd_exp)

print("\nInternship:")
print(internship_found(clean_resume))

print("\nCurrent Role:")
print(current_role(clean_resume))

work_history = extract_work_history(resume_text)
print("\nWork History:")
if work_history:
    for item in work_history:
        print(f" - {item['role']} at {item['company']} ({item['duration']})")
        if item.get('description'):
            print(f"   Details: {item['description']}")
else:
    print("No formal work history detected (Fresher / Trainee)")

print("\nEducation Details")

print("Degree:", extract_degree(clean_resume))

print("Branch:", extract_branch(clean_resume))

print("CGPA:", extract_cgpa(clean_resume))

print("Percentage:", extract_percentage(clean_resume))

print("School Levels:", education_level(clean_resume))

print("\nPERSONAL DETAILS")

print("Name:", extract_name(resume_text))

print("Email:", extract_email(resume_text))

print("Phone:", extract_phone(resume_text))

print("LinkedIn:", extract_linkedin(resume_text))

print("GitHub:", extract_github(resume_text))

print("Location:", extract_location(resume_text))

