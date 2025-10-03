import { useState } from "react";
import {
  faChevronDown,
  faChevronUp,
  faPlus,
  faFloppyDisk,
  faTrash,
  faCircleExclamation,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { apiPost } from "../utils/api_utils";

export default function TemplateBuilder({ program, onClose }) {


  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [showBuilder, setShowBuilder] = useState(false); // Controls whether to show the builder
  const [areas, setAreas] = useState([]);
  const [expandedAreas, setExpandedAreas] = useState({});
  const [expandedSubareas, setExpandedSubareas] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  
  const [showStatusModal, setShowStatusModal] = useState(false); // shows the status modal
  const [statusMessage, setStatusMessage] = useState(null); // status message
  const [statusType, setStatusType] = useState("success"); // status type (success/error)


  // Generates a temporary ID for the areas/subareas/criteria
  const generateID = () => Date.now().toString(36) + Math.random().toString(36);

  // Step 1: Just validate and proceed to builder (no DB call)
  const handleProceedToBuilder = () => {
    if (!templateName.trim()) {
      setError("Template name is required");
      return;
    }
    setError(null);
    setShowBuilder(true);
  };

  const addArea = () => {
    const newArea = {            
      areaID: generateID(),
      areaName: "",
      areaNum: "",
      subareas: []
    };
    setAreas(prev => [...prev, newArea]);
    setExpandedAreas(prev => ({ ...prev, [newArea.areaID]: true }));
    setHasUnsavedChanges(true);
  };

  const updateArea = (areaID, field, value) => {
    setAreas(prev => prev.map(a => a.areaID === areaID ? { ...a, [field]: value } : a));
    setHasUnsavedChanges(true);
  };

  const deleteArea = (areaID) => {
    if (confirm("Delete this area and all its subareas?")) {
      setAreas(prev => prev.filter(a => a.areaID !== areaID));
      setHasUnsavedChanges(true);
    }
  };

  const addSubarea = (areaID) => {
    const newSubarea = {      
      subareaID: generateID(),
      subareaName: "",
      criteria: { inputs: [], processes: [], outcomes: [] }
    };
    setAreas(prev => prev.map(a => 
      a.areaID === areaID ? { ...a, subareas: [...a.subareas, newSubarea] } : a
    ));
    setExpandedSubareas(prev => ({ ...prev, [newSubarea.subareaID]: true }));
    setHasUnsavedChanges(true);
  };

  const updateSubarea = (areaID, subareaID, value) => {
    setAreas(prev => prev.map(a => 
      a.areaID === areaID ? {
        ...a,
        subareas: a.subareas.map(s => 
          s.subareaID === subareaID ? { ...s, subareaName: value } : s
        )
      } : a
    ));
    setHasUnsavedChanges(true);
  };

  const deleteSubarea = (areaID, subareaID) => {
    if (confirm("Delete this subarea and all its criteria?")) {
      setAreas(prev => prev.map(a => 
        a.areaID === areaID ? {
          ...a,
          subareas: a.subareas.filter(s => s.subareaID !== subareaID)
        } : a
      ));
      setHasUnsavedChanges(true);
    }
  };

  const addCriteria = (areaID, subareaID, type) => {
    const newCriteria = {    
      criteriaID: generateID(),  
      criteriaContent: "",
      criteriaType: type
    };
    
    setAreas(prev => prev.map(a => 
      a.areaID === areaID ? {
        ...a,
        subareas: a.subareas.map(s => 
          s.subareaID === subareaID ? {
            ...s,
            criteria: {
              ...s.criteria,
              [type.toLowerCase()]: [...s.criteria[type.toLowerCase()], newCriteria]
            }
          } : s
        )
      } : a
    ));
    setHasUnsavedChanges(true);
  };

  const updateCriteria = (areaID, subareaID, type, criteriaID, value) => {
    setAreas(prev => prev.map(a => 
      a.areaID === areaID ? {
        ...a,
        subareas: a.subareas.map(s => 
          s.subareaID === subareaID ? {
            ...s,
            criteria: {
              ...s.criteria,
              [type.toLowerCase()]: s.criteria[type.toLowerCase()].map(c => 
                c.criteriaID === criteriaID ? { ...c, criteriaContent: value } : c
              )
            }
          } : s
        )
      } : a
    ));
    setHasUnsavedChanges(true);
  };

  const deleteCriteria = (areaID, subareaID, type, criteriaID) => {
    setAreas(prev => prev.map(a => 
      a.areaID === areaID ? {
        ...a,
        subareas: a.subareas.map(s => 
          s.subareaID === subareaID ? {
            ...s,
            criteria: {
              ...s.criteria,
              [type.toLowerCase()]: s.criteria[type.toLowerCase()].filter(c => c.criteriaID !== criteriaID)
            }
          } : s
        )
      } : a
    ));
    setHasUnsavedChanges(true);
  };

  const toggleArea = (areaID) => {
    setExpandedAreas(prev => ({ ...prev, [areaID]: !prev[areaID] }));
  };

  const toggleSubarea = (subareaID) => {
    setExpandedSubareas(prev => ({ ...prev, [subareaID]: !prev[subareaID] }));
  };

  // Step 2: Save everything to DB (only called when user clicks "Save Template")
  const handleSaveAll = async () => {
    // Validate all areas have names
    const invalidAreas = areas.filter(a => !a.areaName.trim());
    if (invalidAreas.length > 0) {
      setError("Please provide names for all areas");
      return;
    }

    // Validate all subareas have names
    for (const area of areas) {
      const invalidSubareas = area.subareas.filter(s => !s.subareaName.trim());
      if (invalidSubareas.length > 0) {
        setError(`Please provide names for all subareas in "${area.areaName}"`);
        return;
      }
    }

    // Validate all criteria have content
    for (const area of areas) {
      for (const subarea of area.subareas) {
        const allCriteria = [
          ...subarea.criteria.inputs,
          ...subarea.criteria.processes,
          ...subarea.criteria.outcomes
        ];
        const emptyCriteria = allCriteria.filter(c => !c.criteriaContent.trim());
        if (emptyCriteria.length > 0) {
          setError(`Please provide content for all criteria in "${subarea.subareaName}"`);
          return;
        }
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      // Send entire template structure to backend in one call
      const data = {
        programID: program.programID,
        templateName,
        description,
        areas: areas.map(area => ({
          areaName: area.areaName,
          areaNum: area.areaNum,
          subareas: area.subareas.map(subarea => ({
            subareaName: subarea.subareaName,
            criteria: [
              ...subarea.criteria.inputs.map(c => ({
                criteriaContent: c.criteriaContent,
                criteriaType: "Inputs",
              })),
              ...subarea.criteria.processes.map(c => ({
                criteriaContent: c.criteriaContent,
                criteriaType: "Processes",
              })),
              ...subarea.criteria.outcomes.map(c => ({
                criteriaContent: c.criteriaContent,
                criteriaType: "Outcomes",
              }))
            ]
          }))
        }))
      };      

      const res = await apiPost("/api/templates/create", data);
      
      if (res?.success || res?.data?.success) {
        setShowStatusModal(true)
        setStatusMessage(res.data.message)
        setStatusType("success")
        setHasUnsavedChanges(false);
        onClose();
      } else {
        throw new Error(res?.message || res?.data?.message || "Failed to save template");
      }
    } catch (err) {
      console.error("Failed to create template", err)
      setStatusMessage("Failed to create template")
      setShowStatusModal(true)
      setStatusType("error")
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="p-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
          {error}
        </div>
      )}
      
      <div className="relative w-full h-full p-4 border border-gray-300 shadow-2xl rounded-xl dark:border-gray-700 dark:shadow-md dark:shadow-zuccini-800"> 
        <div className="absolute flex items-center justify-between top-3 right-3">    
          {hasUnsavedChanges && (
            <span className="px-3 py-1 text-sm text-orange-700 bg-orange-100 border border-orange-300 rounded-2xl dark:text-orange-700/80 dark:bg-orange-300/80">
              <FontAwesomeIcon icon={faCircleExclamation} className="mr-2"/>
              Unsaved changes
            </span>
          )}
        </div>
        
        <h3 className="mb-5 text-2xl font-semibold text-gray-700 dark:text-gray-100">Create Template</h3>

        {/* Step 1: Template Info (no DB save) */}
        {!showBuilder ? (
          <div className="space-y-4">          
            <input
              className="w-full p-3 text-gray-800 bg-gray-300 border border-gray-300 rounded-2xl inset-shadow-sm inset-shadow-gray-400 focus:outline-none focus:ring-2 focus:ring-zuccini-500 dark:border-gray-700 dark:text-gray-200 dark:bg-gray-800"
              placeholder="Template Name"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
            />
            <textarea
              className="w-full p-3 text-gray-800 bg-gray-300 border border-gray-300 rounded-2xl inset-shadow-sm inset-shadow-gray-400 h-28 focus:outline-none focus:ring-2 focus:ring-zuccini-500 dark:border-gray-700 dark:text-gray-200 dark:bg-gray-800"
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <div className="flex gap-3 place-self-end">
              <button
                className="px-6 py-2 transition bg-gray-400 rounded-full shadow-lg cursor-pointer hover:bg-gray-500"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 text-white transition duration-300 rounded-full shadow-lg cursor-pointer bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 disabled:bg-gray-400"
                onClick={handleProceedToBuilder}
              >
                Next: Add Areas
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Build Template Structure */
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-200 border border-gray-400 shadow-xl rounded-xl dark:bg-gray-800 dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-100">Template: <span className="font-semibold dark:text-gray-100">{templateName}</span></p>
                {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
              </div>
              <button
                onClick={addArea}
                className="flex items-center gap-2 px-4 py-2 text-white transition bg-green-600 border border-gray-400 rounded shadow-xl cursor-pointer hover:bg-green-700 dark:border-gray-700 dark:shadow-none"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Area
              </button>
            </div>

            {/* Areas List */}
            <div className="space-y-3">
              {areas.map((area) => (
                <div key={area.areaID} className="rounded-xl">
                  {/* Area Header */}
                  <div className="flex items-start gap-3 p-4 bg-gray-200 border border-gray-300 shadow-md rounded-xl dark:bg-gray-800 dark:border-gray-700">
                    <button
                      onClick={() => toggleArea(area.areaID)}
                      className="mt-3 text-gray-600 cursor-pointer hover:text-gray-800">
                      <FontAwesomeIcon icon={expandedAreas[area.areaID] ? faChevronUp : faChevronDown} className="dark:text-gray-100"/>
                    </button>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <input
                          className="p-2 px-3 text-lg text-gray-800 bg-gray-200 border border-gray-400 inset-shadow-sm inset-shadow-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100 dark:bg-gray-900 dark:border-gray-700"
                          placeholder="Area Num (e.g., Area I)"
                          value={area.areaNum}
                          onChange={e => updateArea(area.areaID, 'areaNum', e.target.value)}
                        />
                        <input
                          className="flex-1 p-2 px-3 text-lg text-gray-800 bg-gray-200 border border-gray-400 inset-shadow-sm inset-shadow-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                          placeholder="Area Name (e.g., Governance and Organization)"
                          value={area.areaName}
                          onChange={e => updateArea(area.areaID, 'areaName', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => addSubarea(area.areaID)}
                        className="px-3 py-2 text-white transition bg-indigo-600 rounded cursor-pointer hover:bg-indigo-700"
                        title="Add Subarea"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                      <button
                        onClick={() => deleteArea(area.areaID)}
                        className="px-3 py-2 text-white transition bg-red-600 rounded cursor-pointer hover:bg-red-700"
                        title="Delete Area"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>

                  {/* Subareas (expandable) */}
                  {expandedAreas[area.areaID] && (
                    <div className="p-4 space-y-3 rounded-xl">
                      {area.subareas.map((subarea) => (
                        <div key={subarea.subareaID} className="rounded-lg">
                          {/* Subarea Header */}
                          <div className="flex items-start gap-3 p-4 mb-2 text-gray-800 bg-gray-200 border border-gray-300 shadow-md rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                            <button
                              onClick={() => toggleSubarea(subarea.subareaID)}
                              className="mt-3 text-gray-600 cursor-pointer hover:text-gray-800"
                            >
                               <FontAwesomeIcon icon={expandedSubareas[subarea.subareaID] ? faChevronUp : faChevronDown} className="dark:text-gray-100"/>
                            </button>

                            <input
                              className="flex-1 p-2 text-lg bg-gray-200 border border-gray-400 rounded-xl inset-shadow-sm inset-shadow-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                              placeholder="Subarea Name"
                              value={subarea.subareaName}
                              onChange={e => updateSubarea(area.areaID, subarea.subareaID, e.target.value)}
                            />

                            <button
                              onClick={() => deleteSubarea(area.areaID, subarea.subareaID)} 
                              className="px-3 py-2 text-white transition bg-red-600 rounded cursor-pointer hover:bg-red-700"
                              title="Delete Subarea"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>

                          {/* Criteria (expandable) */}
                          {expandedSubareas[subarea.subareaID] && (
                            <div className="p-3">
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                {['Inputs', 'Processes', 'Outcomes'].map(type => {
                                  const colorMap = {
                                    'Inputs': { bg: 'bg-green-600', hover: 'hover:bg-green-700', border: 'border-green-300', text: 'text-green-700' },
                                    'Processes': { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', border: 'border-blue-300', text: 'text-blue-700' },
                                    'Outcomes': { bg: 'bg-purple-600', hover: 'hover:bg-purple-700', border: 'border-purple-300', text: 'text-purple-700' }
                                  };
                                  const colors = colorMap[type];
                                  const items = subarea.criteria[type.toLowerCase()] || [];
                                  
                                  return (
                                    <div key={type} className={`border-2 bg-gray-200 ${colors.border} rounded-lg p-3 shadow-md dark:bg-gray-800 dark:border-gray-700 min-h-40`}>
                                      <div className="flex items-center justify-between mb-3">
                                        <h5 className={`font-semibold ${colors.text}`}>{type}</h5>
                                        <button
                                          onClick={() => addCriteria(area.areaID, subarea.subareaID, type)}
                                          className={`px-2 py-1 text-white text-sm transition ${colors.bg} ${colors.hover} rounded cursor-pointer`}
                                        >
                                          <FontAwesomeIcon icon={faPlus} />
                                        </button>
                                      </div>

                                      <div className="space-y-2">
                                        {items.map(criteria => (
                                          <div key={criteria.criteriaID} className={`p-2 bg-gray-200 rounded ${colors.border} border inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-900 dark:border-gray-700 `}>
                                            <textarea
                                              className="w-full p-2 mb-2 text-sm text-gray-800 border border-gray-400 rounded resize-none dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                              placeholder={`Enter ${type.toLowerCase()} criteria`}
                                              value={criteria.criteriaContent}
                                              onChange={e => updateCriteria(area.areaID, subarea.subareaID, type, criteria.criteriaID, e.target.value)}
                                              rows={2}
                                            />
                                            <div className="flex justify-end">
                                              <button
                                                onClick={() => deleteCriteria(area.areaID, subarea.subareaID, type, criteria.criteriaID)}
                                                className="px-2 py-1 text-xs text-white transition bg-red-600 rounded cursor-pointer hover:bg-red-700"
                                              >
                                                <FontAwesomeIcon icon={faTrash} />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                        {items.length === 0 && (
                                          <p className="text-xs text-center text-gray-400">No {type.toLowerCase()} yet</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {area.subareas.length === 0 && (
                        <p className="text-sm text-center text-gray-500">No subareas yet. Click <FontAwesomeIcon icon={faPlus} /> to add one.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {areas.length === 0 && (
                <div className="p-8 text-center border-2 border-gray-400 border-dashed rounded-lg">
                  <p className="mb-3 text-gray-500">No areas yet. Click "Add Area" to get started.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 ">
              <button
                onClick={onClose}
                className="px-6 py-2 transition bg-gray-400 rounded cursor-pointer hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAll}
                className="flex items-center gap-2 px-6 py-2 text-white transition rounded cursor-pointer bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 disabled:bg-gray-400"
                disabled={loading || areas.length === 0}
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className={`${loading ? "animate-spin": ""}`} />
                    Saving...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faFloppyDisk} />
                    Save Template
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}