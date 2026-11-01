# experience.py

import re

def extract_experience(text):

    text = text.lower()

    experience = []

    patterns = [

        r'(\d+)\+?\s+years?',
        r'(\d+)\+?\s+yrs?',
        r'(\d+)\+?\s+months?',
        r'(\d+)\+?\s+mos?'

    ]

    for pattern in patterns:

        matches = re.findall(pattern, text)

        for match in matches:
            if "month" in pattern or "mo" in pattern:
                experience.append(match + " Months")
            else:
                experience.append(match + " Years")

    text = text.replace("p roject", "project")

    if not experience and "project experience" in text:
        experience.append("Project Experience")

    if not experience and "experience" in text and "software development" in text:
        experience.append("Software Development Experience")

    if not experience and "trainee" in text:
        experience.append("Fresher / Trainee")

    if not experience:
        experience.append("Not Mentioned")

    return sorted(set(experience))

def internship_found(text):

    keywords = [

        "internship",
        "intern",
        "trainee"

    ]

    text = text.lower()

    for word in keywords:

        if word in text:
            return True

    return False

def current_role(text):

    roles = [

        "software engineer",
        "python developer",
        "java developer",
        "full stack developer",
        "web developer",
        "backend developer",
        "frontend developer",
        "data analyst",
        "data scientist",
        "machine learning engineer"
    ]

    text = text.lower()

    for role in roles:

        if role in text:
            return role

    return "Not Found"


MONTHS_REGEX = r'(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'
DATE_RANGE_PATTERN = re.compile(
    rf'({MONTHS_REGEX}\.?\s+\d{{4}}|\b\d{{4}})\s*(?:-|–|—|to)\s*({MONTHS_REGEX}\.?\s+\d{{4}}|\b\d{{4}}|Present|Current|Ongoing)',
    re.IGNORECASE
)

EDUCATION_KEYWORDS = [
    'b.tech', 'btech', 'bachelor', 'master', 'm.tech', 'mtech', 'b.sc', 'm.sc',
    'bca', 'mca', 'university', 'college', 'school', 'academy', 'institute of technology',
    'cgpa', 'graduation', 'matriculation', 'cbse', 'icse', 'chse', 'class xii', 'class x'
]

COMMON_ROLES = [
    'software engineer', 'python developer', 'java developer', 'full stack developer',
    'web developer', 'backend developer', 'frontend developer', 'data analyst',
    'data scientist', 'machine learning engineer', 'web development intern', 'intern',
    'software engineer trainee', 'trainee', 'software developer', 'associate',
    'consultant', 'cybersecurity & ethical hacking', 'python with aiml', 'research intern',
    'graduate trainee', 'qa engineer', 'devops engineer', 'cloud engineer'
]

def extract_work_history(text):
    """
    Extracts structured work and employment history (roles, organizations, dates, descriptions)
    from resume text.
    """
    # Clean concatenated uppercase/lowercase words from PDF extraction
    text_clean = text.replace('\r', '').replace('p roject', 'project').replace('d evelopment', 'development')
    text_clean = re.sub(r'([a-z])([A-Z])', r'\1 \2', text_clean)
    lines = [l.strip() for l in text_clean.split('\n') if l.strip()]
    history = []

    for i, line in enumerate(lines):
        match = DATE_RANGE_PATTERN.search(line)
        if match:
            duration = match.group(0).strip()
            
            # Check context lines around this date
            surrounding = " ".join(lines[max(0, i-1):min(len(lines), i+3)]).lower()
            
            # Check if this date belongs strictly to an academic degree/schooling
            if any(edu in surrounding for edu in EDUCATION_KEYWORDS):
                if not any(w in surrounding for w in ['intern', 'internship', 'developer', 'work experience', 'experience']):
                    continue
                if any(deg in surrounding for deg in ['b.tech', 'bachelor', 'university', 'cgpa', 'class xii']):
                    continue

            remaining = line.replace(duration, '').strip()
            role = ""
            company = ""
            
            if remaining:
                parts = [p.strip() for p in re.split(r'[,|–—\-@]', remaining) if p.strip()]
                if len(parts) >= 2:
                    company = parts[0]
                    role = parts[1]
                elif len(parts) == 1:
                    company = parts[0]

            for offset in [1, 2, -1]:
                idx = i + offset
                if 0 <= idx < len(lines):
                    l_text = lines[idx]
                    if DATE_RANGE_PATTERN.search(l_text) or re.match(r'^(education|skills|projects|technical|certifications)', l_text, re.IGNORECASE):
                        continue
                    l_lower = l_text.lower()
                    for r in COMMON_ROLES:
                        if r in l_lower and not role:
                            role = l_text
                            break
                    if not company and not role:
                        if len(l_text.split()) <= 4 and not any(ch in l_text for ch in ['@', 'http', ':', '%', '|']):
                            company = l_text

            if role:
                role = re.sub(r'^(role|position|title)\s*:\s*', '', role, flags=re.I).strip()
                # Split any concatenated action verbs
                role = re.split(r'\b(?:developed|built|conducted|created|performed|worked|collaborated)\b', role, flags=re.I)[0].strip()
                if len(role) > 50:
                    role = role[:50].strip()
            else:
                role = "Software Developer / Intern"

            if company:
                company = re.sub(r'^(company|organization|at)\s*:\s*', '', company, flags=re.I).strip()
                if len(company) > 50:
                    company = company[:50].strip()
            else:
                company = "Tech Organization"

            bullets = []
            for offset in range(1, 6):
                idx = i + offset
                if idx < len(lines):
                    desc_l = lines[idx]
                    if DATE_RANGE_PATTERN.search(desc_l) or re.match(r'^(education|skills|projects|technical|certifications|strengths|hobbies|work experience|profile)', desc_l, re.IGNORECASE):
                        break
                    if desc_l != role and desc_l != company:
                        clean_desc = re.sub(r'^[•\-\*–\uf0b7\s]+', '', desc_l).strip()
                        if clean_desc and len(clean_desc) > 10:
                            bullets.append(clean_desc)

            desc_text = " ".join(bullets[:2]) if bullets else "Contributed to application development, testing, and team project deliverables."
            
            # Avoid duplicate durations
            if not any(h['duration'] == duration and h['company'] == company for h in history):
                history.append({
                    "role": role.title() if role.islower() else role,
                    "company": company,
                    "duration": duration,
                    "description": desc_text
                })

    if not history:
        # Fallback to general work or project experience
        exp_m = re.search(r'(?:experience|internship)[\s\S]{10,250}?(?:education|skills|projects|strengths|$)', text_clean, re.IGNORECASE)
        if exp_m:
            snippet = exp_m.group(0).strip()
            sentences = [s.strip() for s in re.split(r'[\n\.]+', snippet) if len(s.strip()) > 20]
            if sentences:
                history.append({
                    "role": "Project / Trainee Experience",
                    "company": "Independent / Academic Projects",
                    "duration": "Academic / Ongoing",
                    "description": sentences[0]
                })

    return history

