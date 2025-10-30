import TemplateCard from "../components/TemplateCard"
import{
    faPlus,
    faSearch,
    faSpinner,
    faEllipsis,
    faTrash,
    faPen,
    faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState, useRef } from "react"; 
import { apiGet, apiPut, apiDelete, apiPost } from "../utils/api_utils";
import TemplateBuilder from "../components/TemplateBuilder";
import Select from 'react-select';
import StatusModal from "../components/modals/StatusModal";

export default function Templates() {

    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showTemplateDetails, setShowTemplateDetails] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState([]);
    const [loading, setLoading] = useState(false);

    const [showProgramSelect, setShowProgramSelect] = useState(false);
    const [programOptions, setProgramOptions] = useState([]);

    const [visible, setVisible] = useState("templates");
    const [openSettings, setOpenSettings] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [showStatusModal, setShowStatusModal] = useState(false); // shows the status modal
    const [statusMessage, setStatusMessage] = useState(null); // status message
    const [statusType, setStatusType] = useState("success"); // status type (success/error)

    const settingsRef = useRef(null);

    useEffect( () => {
        const handleOutsideClick = (e) => {
            if (
                settingsRef.current &&
                !settingsRef.current.contains(e.target) 
            ){
                setOpenSettings(false);
            }

        }

        document.addEventListener('mousedown', handleOutsideClick)
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
        }

    },[settingsRef]);

    const fetchTemplates = async () => {
            try{
                const res = await apiGet(`/api/templates`)

                Array.isArray(res.data) ? setTemplates(res.data) : setTemplates([]);             
            } catch(err){
                console.error("Failed to fetch templates", err)
            }

        }

    useEffect(() => {        
        fetchTemplates();
    }, []);

    useEffect(() => {
        const fetchPrograms = async () => {
            try{
                const res = await apiGet(`/api/program`)

                Array.isArray(res.data.programs) ? setProgramOptions(res.data.programs) : setProgramOptions([]);             
            } catch(err){
                console.error("Failed to fetch programs", err)
            }

        }
        fetchPrograms();
    }, []);    


    const handleApplyTemplate = async (templateID) => {
        if (selectedProgram.length === 0) {
            setShowStatusModal(true);
            setStatusType("error");
            setStatusMessage("Please select at least one program.");
        } try{
          setLoading(true);

          const res = await apiPost(`/api/programs/apply-template/${templateID}`, { programIDs: selectedProgram,})
          if (res.success){
            setLoading(false);            
            setShowStatusModal(true);
            setStatusType("success");
            setStatusMessage("Template successfully applied to selected programs!");
            setSelectedTemplate(null);            
          } else {
            throw new Error(res.message || "Failed to apply template")
          }
        } catch(err) {
          setShowStatusModal(true);
          setStatusType("error");
          setStatusMessage("Failed to apply template");
          console.error()
        } finally{
          setLoading(false);
        }
      };
    


    const handleCreateTemplate = () => {
        setVisible("create");
    };

    const handleClose = () => {
        setVisible("templates");
        setSelectedTemplate(null);
        fetchTemplates();
        closeModal();
    };
    
    const closeModal = () => {
        setShowStatusModal(false);
        setShowTemplateDetails(false);
        setShowDeleteModal(false);
    }

    const handleDelete = async (templateID) => {
        try{
            const res = await apiDelete(`/api/templates/delete/${templateID}`);
            setShowStatusModal(true);
            setStatusMessage(res.data.message);
            setStatusType("success");           
            fetchTemplates();
        }catch(err){
            setShowStatusModal(true);
            setStatusMessage(res.data.message);
            setStatusType("error");  
        }
    }

    return(
        <>
            {/* Status Modal */}
            {showStatusModal && (
                <StatusModal message={statusMessage} type={statusType} showModal={showStatusModal} onClick={closeModal} />
            )}
        
            {visible === "templates" && (
                <div className="relative flex flex-col items-end min-h-screen gap-3 p-3 px-5 border rounded-[20px] border-neutral-300 dark:bg-gray-900 inset-shadow-sm inset-shadow-gray-400 dark:inset-shadow-gray-500 dark:shadow-md dark:shadow-zuccini-800">
                    <div className="flex flex-row items-center w-1/2 gap-3">
                        <div className="relative w-full max-w-[400px] my-2">
                            <FontAwesomeIcon icon={faSearch} className="absolute text-gray-400 top-4 left-4" />
                            <input type="text"
                            placeholder="Search Template"
                            className="w-full h-12 p-3 pl-10 text-gray-800 bg-gray-200 border border-gray-400 rounded-full outline-none dark:text-gray-100 focus:outline-none focus:ring focus:ring-zuccini-600 dark:bg-gray-800"
                            />
                        </div>
                        <button 
                        onClick={handleCreateTemplate}
                        className="flex items-center h-12 gap-3 px-5 font-medium text-white transition-all duration-300 rounded-full shadow-md cursor-pointer whitespace-nowrap bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600">
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Create Template</span>
                        </button>
                    </div>

                    <div className='relative grid w-full h-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3'>
                        {templates.length > 0 ? (templates.map((temp) => (
                            <TemplateCard
                                key={temp.templateID}
                                onClick={() => {
                                    setSelectedTemplate(temp);
                                    setShowTemplateDetails(true);
                                }}
                                title={temp.templateName}
                                status={temp.isApplied}
                                description={temp.description}
                                createdBy={temp.createdBy}                        
                                editTemplate={(e) => {
                                    e.stopPropagation();    
                                    setSelectedTemplate(temp);
                                    setShowTemplateDetails(false);
                                    setVisible("edit");                            
                                }}
                                createdAt={new Date(temp.createdAt)
                                    .toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric"
                                    })}
                            />
                    ))
                    ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full col-span-4">
                            <h1 className="text-2xl font-semibold text-gray-500">No Templates Found</h1>
                            <span className="mb-2 text-gray-500 text-md">Want to create a new one?</span>
                            <button 
                            onClick={handleCreateTemplate}
                            className="px-5 py-3 rounded-[20px] hover:text-white text-gray-500/70 cursor-pointer font-semibold transition-all duration-300 bg-gray-400/50 hover:bg-zuccini-600">Create</button>
                        </div>
                    )}
                </div>
            </div>
            )}

        {visible === "create" && (
            <TemplateBuilder             
                onClose={handleClose}
            />
        )}

        {visible === "edit" && selectedTemplate && (
            <TemplateBuilder 
                template={selectedTemplate}
                onClose={handleClose}

            />
        )}

        {showDeleteModal && (
                <div
                onClick={(e) => {
                    e.stopPropagation();                                            
                }}
                className="fixed inset-0 flex items-center justify-center transition-all duration-300 transform scale-100 z-150 bg-black/60 backdrop-blur-xs">
                    <div className={`flex flex-col justify-center items-center p-5 py-10 border border-gray-800 bg-gray-200 dark:bg-gray-900 rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-800 ${showDeleteModal ? 'fade-in' : 'fade-out'}`}>
                    <h1 className='mb-4 text-4xl font-bold text-red-500 text-shadow-md'>Delete Template</h1>
                    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-3 bg-red-100 rounded-full inset-shadow-sm inset-shadow-red-500 dark:bg-red-900/30">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="text-3xl text-red-500 dark:text-red-400"/>
                    </div>
                    <div className='flex flex-col justify-center items-center w-[90%]'>
                        <h1 className='mb-1 text-xl font-semibold text-center text-gray-800 dark:text-gray-200'>Are you sure you want to delete this Template?</h1>
                        <p className='mb-5 text-lg text-center text-gray-600 dark:text-gray-400'>This template could be involved in the accreditation process. Please proceed with caution</p>
                    </div>
                    <div className='flex flex-row justify-around w-full'>
                        <button
                        onClick={() =>  setShowDeleteModal(false)}
                        className={`px-10 py-3 font-medium transition-colors rounded-full bg-gray-300 dark:bg-gray-700 text-neutral-500 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-400/50 dark:hover:bg-gray-600 dark:hover:text-gray-200 cursor-pointer`}>Cancel</button>
                        <button 
                        onClick={() => handleDelete(selectedTemplate.templateID)}
                        className={`${loading ? 'cursor-not-allowed bg-gray-700' : 'bg-red-600/70 hover:bg-red-600/90 cursor-pointer'} px-8 py-3 rounded-full font-medium transition-colors flex items-center  text-white `}>
                        {loading && (
                            <FontAwesomeIcon icon={faSpinner} className="mr-2 text-gray-400 animate-spin"/>
                        )}
                        Delete Template</button>
                    </div>
                    </div>
                </div>
        )}
        
        

         {showTemplateDetails && selectedTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">                                                    
                    <div className="relative w-full max-w-2xl max-h-[90vh] h-full bg-gray-100 rounded-lg shadow flex flex-col dark:bg-gray-800">
                        <div>
                            <div    
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenSettings(!openSettings);
                                }}
                                className="absolute flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300 right-10 top-5 dark:bg-gray-700 dark:hover:bg-gray-600">
                                <FontAwesomeIcon icon={faEllipsis} className="text-xl text-gray-800"/>
                            </div>

                            <div>
                               {openSettings && (
                                <div   
                                    ref={settingsRef}        
                                    onClick={(e) => e.stopPropagation()}
                                    className='absolute z-50 p-3 border shadow-xl dark:bg-gray-700 dark:border-gray-700 bg-gray-200 backdrop-blur-sm rounded-xl min-w-[150px] top-16 right-8'
                                >
                                <button 
                                onClick={(e) => {
                                    e.stopPropagation();  
                                    setShowTemplateDetails(false);
                                    setVisible("edit"); 
                                    setOpenSettings(false);
                                }}
                                className='relative block w-full px-2 py-1 text-gray-600 transition-all duration-300 rounded-md hover:text-gray-100 hover:bg-blue-400/80 dark:text-gray-200'>
                                    Edit
                                    <FontAwesomeIcon icon={faPen} className="ml-5"/>
                                </button>
                                
                                <div className="w-full my-2 border-b border-gray-600"/> {/* Line */}

                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();                                        
                                        setShowDeleteModal(true);  
                                        setOpenSettings(false);                                                            
                                    }}
                                    className='relative block w-full px-2 py-1 text-gray-600 transition-all duration-300 rounded-md hover:text-gray-100 hover:bg-red-500/80 dark:text-gray-200'
                                >
                                    Delete
                                    <FontAwesomeIcon icon={faTrash} className="ml-5"/>
                                </button>
                                </div>
                            )}
                            </div>
                        </div>
                        {/* Scrollable content area */}
                        <div className="flex-1 p-4 mb-5 overflow-y-auto">
                            <h1 className="text-xl font-bold text-zuccini-700 dark:text-zuccini-500">{selectedTemplate.templateName}</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTemplate.description}</p>
                            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                                Created by {selectedTemplate.createdBy} on{" "}
                                {new Date(selectedTemplate.createdAt).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric"
                                })}
                            </p>

                            {/* Programs Applied */}
                            
                            <h1 className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-100">Programs Applied:</h1>
                            <div className="flex flex-row gap-1">
                            {selectedTemplate.programs?.map((program) => (
                                <div key={program.programID}
                                    className="mb-2"
                                >
                                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-50">
                                        {program.programCode}
                                    </span>
                                </div>
                            ))}
                            </div>
                            


                            {/* Areas */}
                            {selectedTemplate.areas?.map((area) => (
                                <div key={area.areaID} className="mb-3">
                                    <h2 className="px-3 py-2 text-lg font-semibold rounded-md bg-zuccini-500">
                                        {area.areaNum}: {area.areaName}
                                    </h2>

                                    {/* Subareas */}
                                    <div className="mt-2 ml-4 space-y-2">
                                        {area.subareas?.map((sub) => (
                                            <div key={sub.subareaID} className="pl-3 border-l-2 border-gray-300">
                                                <h3 className="font-medium text-gray-700 dark:text-gray-100">{sub.subareaName}</h3>

                                                {/* Criteria */}
                                                <ul className="ml-4 text-sm text-gray-600 list-disc dark:text-gray-100">
                                                    {sub.criteria && Object.values(sub.criteria).flat().map((crit) => (
                                                        <li key={crit.criteriaID}>
                                                            {crit.criteriaContent}
                                                        </li>
                                                        ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        

                        {/* Fixed button at bottom */}
                        <div className="flex justify-end p-4 bg-transparent border-t gap-x-5">
                            <button 
                                disabled={loading}
                                onClick={() => {
                                    setSelectedTemplate(null);
                                    setShowTemplateDetails(false);
                                }}
                                className={`p-2 px-4 font-medium text-white transition-colors duration-300 bg-gray-400 rounded-full cursor-pointer hover:bg-gray-500 ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowProgramSelect(true)}
                                disabled={loading}
                                className={`p-2 px-4 font-medium text-white transition-colors duration-300 rounded-full cursor-pointer ${loading ? 'bg-gray-400' : 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500'}`}
                            >
                                <FontAwesomeIcon icon={faSpinner} className={`${loading ? 'animate-spin block mr-2 opacity-100 ' : 'w-0 opacity-0'} `}/>
                                Use Template
                            </button>
                        </div>
                        {showProgramSelect && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
                                <div className={`flex flex-col justify-center h-full items-center p-8 py-12 border border-gray-400 bg-gray-200 dark:bg-gray-900 rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-800 ${showProgramSelect ? 'fade-in' : 'fade-out'}`}>
                                    <h2 className="mb-6 text-3xl font-bold text-gray-800 dark:text-gray-200">Select Programs</h2>
                                    <div className="w-full mb-4">
                                        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                                            Choose which programs you want to apply this template to:
                                        </p>
                                        <Select 
                                            isMulti
                                            options={programOptions.map(program => ({
                                                value: program.programID,
                                                label: program.programName
                                            }))}
                                            onChange={(selected) => {
                                                setSelectedProgram(selected ? selected.map(s => s.value) : []);
                                            }}
                                            placeholder="Select programs to apply template..."
                                            classNamePrefix="react-select"
                                            className="w-full text-lg text-gray-800 dark:text-gray-100"
                                        />
                                    </div>
                                    <div className="flex justify-end w-full mt-8 gap-x-4">
                                        <button
                                            onClick={() => setShowProgramSelect(false)}
                                            className="px-8 py-3 text-lg font-medium text-gray-600 transition-colors bg-gray-300 rounded-full hover:bg-gray-400"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleApplyTemplate(selectedTemplate.templateID);
                                                setShowProgramSelect(false);                                                
                                            }}
                                            disabled={selectedProgram.length === 0}
                                            className={`px-8 py-3 text-lg font-medium text-white rounded-full transition-colors ${
                                                selectedProgram.length === 0 
                                                    ? 'bg-gray-400 cursor-not-allowed' 
                                                    : 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500'
                                            }`}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )} 
                    </div>     
                </div>
            )}
        </>
    )
}