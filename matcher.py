# matcher.py

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def calculate_match(resume_text, jd_text):

    documents = [
        resume_text,
        jd_text
    ]

    tfidf = TfidfVectorizer()

    matrix = tfidf.fit_transform(documents)

    score = cosine_similarity(
        matrix[0:1],
        matrix[1:2]
    )

    return round(score[0][0] * 100, 2)