
from app.models import Area, Subarea, Criteria, AreaBlueprint, SubareaBlueprint, CriteriaBlueprint
from app import db
import pandas as pd
import numpy as np
import math
import ast, json
from sklearn.metrics.pairwise import cosine_similarity



def reapply_template(templateID, applied_template):
    """
    Archives old applied Areas/Subareas/Criteria for the given AppliedTemplate,
    then copies all blueprints from the Template into the Program’s live tables.
    """

    # ===== 1️⃣ Archive old areas in bulk =====
    old_areas = Area.query.filter_by(appliedTemplateID=applied_template.appliedTemplateID, archived=False).all()
    old_area_ids = [a.areaID for a in old_areas]

    if old_area_ids:
        # Bulk archive all levels
        db.session.query(Criteria).filter(Criteria.subareaID.in_(
            db.session.query(Subarea.subareaID).filter(Subarea.areaID.in_(old_area_ids))
        )).update({"archived": True}, synchronize_session=False)

        db.session.query(Subarea).filter(Subarea.areaID.in_(old_area_ids)).update({"archived": True}, synchronize_session=False)
        db.session.query(Area).filter(Area.areaID.in_(old_area_ids)).update({"archived": True}, synchronize_session=False)

    # ===== 2️⃣ Copy all blueprints -> applied data =====
    area_blueprints = AreaBlueprint.query.filter_by(templateID=templateID).all()

    for ab in area_blueprints:
        new_area = Area(
            appliedTemplateID=applied_template.appliedTemplateID,
            programID=applied_template.programID,
            areaBlueprintID=ab.areaBlueprintID,
            areaName=ab.areaName,
            areaNum=ab.areaNum,
            archived=False
        )
        db.session.add(new_area)
        db.session.flush()

        subarea_blueprints = SubareaBlueprint.query.filter_by(areaBlueprintID=ab.areaBlueprintID).all()
        new_subareas = []
        for sb in subarea_blueprints:
            sub = Subarea(
                areaID=new_area.areaID,
                subareaBlueprintID=sb.subareaBlueprintID,
                subareaName=sb.subareaName,
                archived=False
            )
            new_subareas.append(sub)
        db.session.add_all(new_subareas)
        db.session.flush()

        # Preload criteria blueprints once (performance boost)
        all_criteria_bps = CriteriaBlueprint.query.filter(
            CriteriaBlueprint.subareaBlueprintID.in_([sb.subareaBlueprintID for sb in subarea_blueprints])
        ).all()
        criteria_map = {}
        for cb in all_criteria_bps:
            criteria_map.setdefault(cb.subareaBlueprintID, []).append(cb)

        for sub in new_subareas:
            if sub.subareaBlueprintID in criteria_map:
                db.session.add_all([
                    Criteria(
                        subareaID=sub.subareaID,
                        criteriaBlueprintID=cb.criteriaBlueprintID,
                        criteriaContent=cb.criteriaContent,
                        criteriaType=cb.criteriaType,
                        archived=False
                    ) for cb in criteria_map[sub.subareaBlueprintID]
                ])


def ensure_numeric_embeddings(df, column="embedding"):
    """Converts string embeddings to numeric NumPy arrays."""
    if isinstance(df[column].iloc[0], str):
        df[column] = df[column].apply(
            lambda x: np.array(ast.literal_eval(x.replace("np.str_(", "").replace(")", "")))
        )

    emb_df = pd.DataFrame(df[column].to_list(), index=df.index)
    emb_df.columns = [f"emb_{i}" for i in range(emb_df.shape[1])]
    return emb_df

def compare_documents(new_doc, past_docs, model, top_n=5):
    if getattr(past_docs, 'empty', True):
        return None, pd.DataFrame()

    # === Compute probability (if classifier) ===
    prob = None
    try:
        emb = pd.DataFrame([new_doc["embedding"]])
        emb.columns = [f"emb_{i}" for i in range(len(emb.columns))]

        input_df = pd.DataFrame([new_doc]).drop(columns=["embedding"], errors="ignore")
        input_df = pd.concat([input_df, emb], axis=1)

        # --- Align features with model expected inputs if available ---
        required_features = None
        try:
            print(f"[compare_documents] model type: {type(model)}")
            # sklearn Pipeline or estimator may expose feature_names_in_
            if hasattr(model, "feature_names_in_"):
                required_features = list(model.feature_names_in_)
                print(f"[compare_documents] model.feature_names_in_ found: {len(required_features)} features")
            # If pipeline, try to get feature_names_in_ from final estimator
            elif hasattr(model, "steps"):
                for name, step in reversed(model.steps):
                    if hasattr(step, "feature_names_in_"):
                        required_features = list(step.feature_names_in_)
                        print(f"[compare_documents] final pipeline step '{name}' feature_names_in_ found: {len(required_features)} features")
                        break
        except Exception as _ferr:
            print(f"[compare_documents] Error inspecting model features: {_ferr}")

        if required_features is not None:
            # add missing columns with zeros and drop extras
            for f in required_features:
                if f not in input_df.columns:
                    input_df[f] = 0.0
            # Keep only required order
            input_df = input_df[required_features]

        print(f"[compare_documents] Input for predict shape: {input_df.shape}, columns: {list(input_df.columns)[:10]}{'...' if len(input_df.columns)>10 else ''}")

        # Predict rating using regressor
        pred_raw = model.predict(input_df)
        pred = float(pred_raw[0])
        print(f"[compare_documents] Raw predicted rating: {pred}")
        # Convert predicted rating (1–5) → probability (0–1)
        prob = float(1 / (1 + math.exp(-2.0 * (pred - 3))))
        print(f"[compare_documents] Scaled probability: {prob}")
    except Exception as e:
        print(f"[compare_documents] Error computing probability: {e}")

    # === Parse and validate embeddings ===
    def parse_embedding(val):
        if val is None:
            return None
        if isinstance(val, (list, tuple, np.ndarray)):
            arr = np.array(val, dtype=float)
            return arr if arr.size > 0 else None
        if isinstance(val, (str, np.str_)):
            s = str(val)
            if s.startswith("np.str_(") and s.endswith(")"):
                s = s[len("np.str_("):-1].strip("'\"")
            try:
                return np.array(ast.literal_eval(s), dtype=float)
            except Exception:
                try:
                    return np.array(json.loads(s), dtype=float)
                except Exception:
                    try:
                        # last resort: strip brackets and split
                        s2 = s.strip("[]() ")
                        parts = [p.strip() for p in s2.split(",") if p.strip()]
                        return np.array([float(p) for p in parts], dtype=float)
                    except Exception:
                        return None
        return None

    parsed_embeddings = []
    valid_indices = []

    for idx, val in enumerate(past_docs["embedding"].values):
        arr = parse_embedding(val)
        if arr is not None and len(arr) == len(new_doc["embedding"]):
            parsed_embeddings.append(arr)
            valid_indices.append(idx)

    if not parsed_embeddings:
        print("[compare_documents] No valid past embeddings found.")
        return prob, pd.DataFrame()

    # === Compute cosine similarities ===
    try:
        past_embedding = np.vstack(parsed_embeddings)
        new_embedding = np.array(new_doc["embedding"], dtype=float).reshape(1, -1)

        if past_embedding.shape[1] != new_embedding.shape[1]:
            print(f"[compare_documents] Shape mismatch: {past_embedding.shape[1]} vs {new_embedding.shape[1]}")
            return prob, pd.DataFrame()

        similarities = cosine_similarity(new_embedding, past_embedding).flatten()
        past_docs = past_docs.iloc[valid_indices].copy()
        past_docs["similarity"] = similarities

        top_similar = past_docs.sort_values(by="similarity", ascending=False).head(top_n)
    except Exception as e:
        print(f"[compare_documents] Error computing cosine similarity: {e}")
        top_similar = pd.DataFrame()

    # === Return probability and top similar documents ===
    return prob, top_similar[["docName", "similarity", "isApproved"]] if not top_similar.empty else top_similar