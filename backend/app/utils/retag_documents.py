from app import db
from app.models import Document
from .tagging_utils import rule_based_tag, extract_global_tfid_tags

def retag_documents(top_n: int = 5):
    documents = Document.query.all()
    contents = [d.content or "" for d in documents]

    tfidf_tag_all_docs = extract_global_tfid_tags(contents, top_n=top_n)

    for i, doc in enumerate(documents):
        rb_tags = rule_based_tag(doc.content or "")
        tfidf_tags = set(tfidf_tag_all_docs[i])
        final_tags = list(rb_tags.union(tfidf_tags))
        doc.tags = final_tags

    db.session.commit()
    print(f"[INFO] Batch re-tagging complete: {len(documents)} documents updated.")

    