# skills.py

import re

SKILLS = [

    "python",
    "java",
    "c",
    "c++",
    "javascript",
    "html",
    "css",
    "react",
    "angular",
    "nodejs",
    "spring boot",
    "mysql",
    "postgresql",
    "mongodb",
    "sql",
    "git",
    "github",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "machine learning",
    "deep learning",
    "data science",
    "nlp",
    "flask",
    "django",
    "fastapi",
    "artificial intelligence",
    "ai",
    "ai/ml",
    "algorithms",
    "api",
    "apis",
    "data structures",
    "data structures and algorithms",
    "dsa",
    "database",
    "databases",
    "oracle sql",
    "problem solving",
    "web development"
]

def extract_skills(text):

    text = text.lower()
    normalized_text = re.sub(r'[^a-z0-9+#/]+', ' ', text)
    normalized_text = re.sub(r'\s+', ' ', normalized_text)
    normalized_text = normalized_text.replace("st ructures", "structures")

    found_skills = []

    for skill in SKILLS:
        normalized_skill = re.sub(r'[^a-z0-9+#/]+', ' ', skill.lower())
        pattern = r'(?<![a-z0-9+#/])' + re.escape(normalized_skill) + r'(?![a-z0-9+#/])'

        if re.search(pattern, normalized_text):
            found_skills.append(skill)

    skill_aliases = {
        "ai": "artificial intelligence",
        "ai/ml": "artificial intelligence",
        "apis": "api",
        "database": "databases",
        "dsa": "data structures and algorithms"
    }

    found_skills = [
        skill_aliases.get(skill, skill)
        for skill in found_skills
    ]

    # Deduplicate composite vs sub-skills:
    # If "data structures and algorithms" is found, remove redundant individual "algorithms" and "data structures"
    if "data structures and algorithms" in found_skills:
        found_skills = [s for s in found_skills if s not in ("algorithms", "data structures")]
    elif "algorithms" in found_skills and "data structures" in found_skills:
        found_skills = [s for s in found_skills if s not in ("algorithms", "data structures")]
        found_skills.append("data structures and algorithms")

    return sorted(set(found_skills))
