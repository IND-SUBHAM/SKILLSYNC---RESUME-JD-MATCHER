# education.py

import re

DEGREES = [

    "b.tech",
    "b tech",
    "btech",
    "b.e",
    "be",
    "m.tech",
    "mtech",
    "mca",
    "bca",
    "b.sc",
    "msc",
    "mba",
    "diploma"

]

def extract_degree(text):

    text = text.lower()

    found = []

    for degree in DEGREES:

        if degree in text:
            found.append(degree)

    return found

BRANCHES = [

    "computer science",
    "cse",
    "information technology",
    "it",
    "electronics",
    "ece",
    "electrical",
    "eee",
    "mechanical",
    "civil"

]

def extract_branch(text):

    text = text.lower()

    found = []
    branch_aliases = {
        "computer science": "computer science engineering",
        "cse": "computer science engineering",
        "information technology": "information technology",
        "it": "information technology",
        "electronics": "electronics",
        "ece": "electronics",
        "electrical": "electrical",
        "eee": "electrical",
        "mechanical": "mechanical",
        "civil": "civil"
    }

    for branch in BRANCHES:
        pattern = r'(?<![a-z0-9])' + re.escape(branch) + r'(?![a-z0-9])'

        if re.search(pattern, text):
            found.append(branch_aliases[branch])

    return sorted(set(found))



def extract_cgpa(text):

    pattern = r'(\d\.\d{1,2})'

    result = re.findall(pattern, text)

    return result


def extract_percentage(text):

    pattern = r'(\d{2,3}\.?\d*)\s*%'

    result = re.findall(pattern, text)

    return result


def education_level(text):

    text = text.lower()

    levels = []

    if "10th" in text:
        levels.append("10th")

    if "12th" in text:
        levels.append("12th")

    if "intermediate" in text:
        levels.append("12th")

    return levels
