# personal_info.py

import re

def extract_email(text):

    pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'

    result = re.findall(pattern, text)

    if result:
        return result[0]

    return "Not Found"

def extract_phone(text):

    pattern = r'(\+91[- ]?)?[6-9]\d{9}'

    result = re.findall(pattern, text)

    phone = re.search(
        r'(\+91[- ]?)?[6-9]\d{9}',
        text
    )

    if phone:
        return phone.group()

    return "Not Found"


def extract_linkedin(text):

    pattern = r'linkedin\.com\/[^\s]+'

    result = re.findall(pattern, text)

    if result:
        return result[0]

    return "Not Found"


def extract_github(text):

    pattern = r'github\.com\/[^\s]+'

    result = re.findall(pattern, text)

    if result:
        return result[0]

    return "Not Found"

CITIES = [

    "balasore",
    "bhubaneswar",
    "cuttack",
    "kolkata",
    "hyderabad",
    "bangalore",
    "chennai",
    "mumbai",
    "delhi",
    "pune"

]

def extract_location(text):

    text = text.lower()

    for city in CITIES:

        if city in text:
            return city.title()

    return "Not Found"


def extract_name(text):
    strength_keywords = [
        'collaboration', 'teamwork', 'quick learner', 'self-motivated',
        'project-oriented', 'problem solving', 'curious', 'leadership', 'adaptability'
    ]
    skip_keywords = [
        'resume', 'curriculum', 'vitae', 'contact', 'skills', 'profile',
        'education', 'experience', 'summary', 'india', 'odisha', 'javascript',
        'python', 'developer', 'engineer', 'html', 'css', 'java', 'languages'
    ]

    for line in text.split('\n')[:35]:
        line = line.strip()
        # Clean parenthetical sidebar text like 'French (Basic)BISWAGAT M BAIRAGI'
        if ')' in line:
            after = line.split(')')[-1].strip()
            if after:
                line = after

        lower = line.lower()
        if any(sk in lower for sk in strength_keywords):
            continue
        if any(sk in lower for sk in skip_keywords):
            continue
        if re.search(r'[\d@,/:|]', line):
            continue

        words = line.split()
        if 2 <= len(words) <= 4:
            return line

    return "Not Found"