
from app.models import Area, Subarea, Criteria, AreaBlueprint, SubareaBlueprint, CriteriaBlueprint
from app import db


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
