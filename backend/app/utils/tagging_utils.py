from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer

TAGS = {
    # 🔹 Accreditation & Compliance
    "accreditation": [
        "CHED", "PAASCU", "ISO", "compliance", "evaluation",
        "quality assurance", "audit", "standards", "certification"
    ],
    "policies": [
        "guidelines", "regulations", "policies", "manual", "handbook",
        "memorandum", "rules", "standards", "framework"
    ],

    # 🔹 Curriculum & Programs
    "curriculum": [
        "syllabus", "course outline", "program of study", "subject description",
        "learning outcomes", "curricular map", "program curriculum", "academic plan"
    ],
    "courses": [
        "subject", "module", "lecture", "unit", "lesson plan", "training", "class schedule"
    ],
    "assessment": [
        "rubric", "grading", "evaluation form", "test", "quiz",
        "exam", "assessment", "score sheet"
    ],

    # 🔹 Faculty & Staff
    "faculty": [
        "professor", "instructor", "lecturer", "faculty list", "teaching staff",
        "adviser", "mentor", "educator"
    ],
    "administration": [
        "dean", "chairperson", "department head", "principal", "coordinator",
        "officer", "staff", "administrator"
    ],
    "training": [
        "seminar", "workshop", "orientation", "training program", "faculty development"
    ],

    # 🔹 Students & Records
    "students": [
        "student list", "enrollment", "class record", "attendance",
        "grade report", "registration", "learner"
    ],
    "activities": [
        "extracurricular", "student activity", "organization", "event", "competition",
        "club", "council"
    ],

    # 🔹 Research & Extension
    "research": [
        "thesis", "capstone", "dissertation", "journal", "publication",
        "research output", "paper", "study"
    ],
    "extension": [
        "community service", "outreach", "extension program", "service learning"
    ],

    # 🔹 Facilities & Resources
    "facilities": [
        "laboratory", "library", "classroom", "equipment", "infrastructure",
        "building", "facility", "room", "workshop"
    ],
    "resources": [
        "learning materials", "references", "textbook", "handouts",
        "multimedia", "digital library"
    ],

    # 🔹 Reports & Admin Docs
    "reports": [
        "annual report", "progress report", "evaluation report", "audit report",
        "narrative report", "summary", "documentation"
    ],
    "finance": [
        "budget", "financial report", "funding", "expenses", "audit", "statement of accounts"
    ]
}


# Depends on the list of tags
def rule_based_tag(text: str) -> List[str]:
    if not text:
        return []

    found_tags = set()
    for tag, keywords in TAGS.items():
        for kw in keywords: 
            if kw.lower() in text.lower():
                found_tags.add(tag)
            break

    return list(found_tags)



def extract_global_tfid_tags(docs: List[str], doc_index: int, top_n: int = 5) -> List[List[str]]:
    if not docs or not docs[doc_index]:
        return []

    vectorizer = TfidfVectorizer(stop_words='english', max_features=50)
    X = vectorizer.fit_transform([doc or "" for doc in docs])
    features = vectorizer.get_feature_names_out()

    tags_per_doc = []
    for row in X.toarray():
        top_indices = row.argsort()[-top_n:][::-1]
        tags = [features[i] for i in top_indices if row[i] > 0]
        tags_per_doc.append(tags)

    return tags_per_doc


