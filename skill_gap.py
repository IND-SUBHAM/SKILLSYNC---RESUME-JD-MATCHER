# skill_gap.py

def find_missing_skills(
    resume_skills,
    jd_skills
):

    missing = []
    resume_skill_set = set(resume_skills)

    for skill in jd_skills:

        if skill == "data structures and algorithms":
            has_combined_skill = (
                skill in resume_skill_set
                or {"data structures", "algorithms"}.issubset(resume_skill_set)
                or "dsa" in resume_skill_set
            )

            if not has_combined_skill:
                missing.append(skill)
        elif skill not in resume_skill_set:
            missing.append(skill)

    # Prune redundant subsets if composite skill is present
    if "data structures and algorithms" in missing:
        missing = [s for s in missing if s not in ("algorithms", "data structures")]
    elif "algorithms" in missing and "data structures" in missing:
        missing = [s for s in missing if s not in ("algorithms", "data structures")]
        missing.append("data structures and algorithms")

    return sorted(list(dict.fromkeys(missing)))
