
from app.models import Area, Subarea, Criteria, AreaBlueprint, SubareaBlueprint, CriteriaBlueprint
from app import db

def reapply_template(templateID, applied_template):
    """    
    This function archives current applied Areas/Subareas/Criteria for that appliedTemplate
    then copies all current AreaBlueprint/SubareaBlueprint/CriteriaBlueprint for templateID
    into the Area/Subarea/Criteria tables for the given applied_template.
    """
    # Archive old applied areas/subs/crits
    old_areas = Area.query.filter_by(appliedTemplateID=applied_template.appliedTemplateID, archived=False).all()
    for a in old_areas:
        a.archived = True
        for s in a.subareas:
            s.archived = True
            for c in s.criteria:
                c.archived = True

    # Copy blueprints -> applied tables
    area_blueprints = AreaBlueprint.query.filter_by(templateID=templateID).order_by(AreaBlueprint.areaBlueprintID.asc()).all()
    for ab in area_blueprints:
        new_area = Area(
            appliedTemplateID=applied_template.appliedTemplateID,
            programID=applied_template.programID,
            areaBlueprintID=ab.areaBlueprintID,   # keep provenance
            areaName=ab.areaName,
            areaNum=ab.areaNum,
            archived=False
        )
        db.session.add(new_area)
        db.session.flush()  # get new_area.areaID

        subarea_blueprints = SubareaBlueprint.query.filter_by(areaBlueprintID=ab.areaBlueprintID).order_by(SubareaBlueprint.subareaBlueprintID.asc()).all()
        for sb in subarea_blueprints:
            new_sub = Subarea(
                areaID=new_area.areaID,
                subareaBlueprintID=sb.subareaBlueprintID,  # provenance
                subareaName=sb.subareaName,
                archived=False
            )
            db.session.add(new_sub)
            db.session.flush()

            crit_blueprints = CriteriaBlueprint.query.filter_by(subareaBlueprintID=sb.subareaBlueprintID).order_by(CriteriaBlueprint.criteriaBlueprintID.asc()).all()
            for cb in crit_blueprints:
                new_crit = Criteria(
                    subareaID=new_sub.subareaID,
                    criteriaBlueprintID=cb.criteriaBlueprintID,  # provenance
                    criteriaContent=cb.criteriaContent,
                    criteriaType=cb.criteriaType,
                    archived=False
                )
                db.session.add(new_crit)
