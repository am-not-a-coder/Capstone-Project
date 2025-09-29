//for imports
import {
  faHouse,
  faCircleXmark,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ProgramCard from "../components/ProgramCard";
import CreateCard from "../components/CreateCard";
import CreateForm from "../components/CreateForm";
import { useState, useEffect, useCallback } from "react";
import { apiGet, apiGetBlob, apiPut } from '../utils/api_utils';
import { getCurrentUser } from '../utils/auth_utils';
import AreaCont from "../components/AreaCont";
import SubCont from "../components/SubCont";
import CreateModal from '../components/modals/CreateModal';
// PDF viewer
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
import "../../index.css"
import { adminHelper } from '../utils/auth_utils';
import { CardSkeleton } from '../components/Skeletons';

  const Programs = () => {
    //admin
    const isAdmin = adminHelper()
    // use state function
  const [institutes, setInstitutes] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [employees, setEmployees] = useState([]); 
  const [areas, setAreas] = useState([]);
  const [instituteOption, setInstituteOption] = useState([]);
  const [subareas, setSubareas] = useState([]);
  const [criteria, setCriteria] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [activeModify, setActiveModify] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
    
  const [expandedAreaIndex, setExpandedAreaIndex] = useState(null);
  const [showWord, setShowWord] = useState(false);

  const [programLoading, setProgramLoading] = useState(false);

  //Preview state functions
  const [docs, setDocs] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [docViewerKey, setDocViewerKey] = useState(0); 

  useEffect(() => {
    const fetchProgram = async () => {
      setProgramLoading(true)
      try {
        const response = await apiGet('/api/program');

            if (response.success) {
              Array.isArray(response.data.programs) ? setPrograms(response.data.programs) : setPrograms([]);
            } else {
              console.error('Failed to fetch programs:', response.error);
              setPrograms([]); // Set empty array on error
            }
            

        } catch (err){
          console.error("Error occurred when fetching programs", err)

        } finally {
          setProgramLoading(false);
        }
      }
        fetchProgram()
    }, []);
    
    // Fetch institutes for Institute dropdown selection
    useEffect(() => {
      const fetchInstitutes = async () => {
        try {
          const response = await apiGet('/api/institute');
          
          Array.isArray(response.data.institutes) ? setInstitutes(response.data.institutes) : setInstitutes([]);
          
        } catch (err) {
          console.error("Unexpected error fetching institutes", err);
        }
      }
      fetchInstitutes();
    }, []);

    // Fetch employees for program dean dropdown selection
    useEffect(() => {
      const fetchEmployees = async () => {
        try {
         
          const response = await apiGet('/api/users');
          
          if (response.success) {
          Array.isArray(response.data.users) ? setEmployees(response.data.users) : setEmployees([]);
          } else {
            console.error("Error fetching employees:", response.error);
            setEmployees([]);
          }
        } catch (err) {
          console.error("Unexpected error fetching employees", err);
          setEmployees([]);
        }
      };
      fetchEmployees();
    }, []); 

    useEffect(() => {
      const fetchInstitutes = async () => {
        try {
         
          const response = await apiGet('/api/institute');
          
          if (response.success) {
          Array.isArray(response.data.institutes) ? setInstituteOption(response.data.institutes) : setInstituteOption([]);
          console.log(response.data)
          } else {
            console.error("Error fetching institutes:", response.error);
            setInstituteOption([]);
          }
        } catch (err) {
          console.error("Unexpected error fetching institutes", err);
          setInstituteOption([]);
        }
      };
      fetchInstitutes();
    }, []); 

        
    useEffect(() => {
      const fetchCriteria = async () => {
        try {
          const response = await apiGet("/api/criteria");
          setCriteria(response.data);

          // Build done state from DB values
          const doneMap = {};
          response.data.forEach(c => {
            doneMap[c.criteriaID] = c.isDone;
          });
          setDone(doneMap);
        } catch (err) {
          console.error("Failed to fetch criteria", err);
        }
      };

      fetchCriteria();
    }, []);


    //Fetch areas from specific programs
        const fetchAreasForProgram = async (programCode) => {
          try {
            const response = await apiGet(`/api/accreditation?programCode=${encodeURIComponent(programCode)}`)

            if(Array.isArray(response.data)) { 
              setAreas(response.data)
             
            } else {
              setAreas([])
            };
          } catch(err){
            console.log(err.response?.data || err.message);
            setAreas([]);
          }
        }
        
        

    const refreshAreas = async (programCode) => {      
      try {
        const response = await apiGet(`/api/accreditation?programCode=${encodeURIComponent(programCode)}`, {withCredentials: true})
        Array.isArray(response.data) ? setAreas(response.data) : setAreas([]);
      } catch(err) {
        console.error('Error refreshing areas:', err);
      }
    }

    function handleModify(mode) {
      setActiveModify((prev) => (prev === mode ? null : mode));
      if (mode !== "edit") {
        setEditIndex(null);
        setForm({ code: "", name: "", color: "", programDean: "" });
      }
    }

    function handleEditSelect(e) {
      const idx = e.target.value;
      setEditIndex(idx);
      const prog = programs[idx];
      setForm({ ...prog });
    }

    function handleDeleteSelect(e) {
      setEditIndex(e.target.value);
    }

  function handleDelete(e) {
      e.preventDefault();
      if (editIndex !== null) {
          setPrograms(programs.filter((_, idx) => idx != editIndex));
          setShowForm(false);
          setEditIndex(null);
          setActiveModify(null);
      }
  }

  const handleSubmit = (e) => {
      e.preventDefault();
        if (activeModify === "edit" && editIndex !== null) {
          // Edit mode
          const updated = [...programs];
        updated[editIndex] = { ...form };
        setPrograms(updated);
        } else {
          // Add mode
        setPrograms([
          ...programs,
          {
            code: form.code,
            name: form.name,
            color: form.color,
            programDean: form.programDean,
          },
        ]);
      }
        setShowForm(false);
      setForm({ code: "", name: "", color: "", programDean: "" });
        setEditIndex(null);
        setActiveModify(null);
    };

    const [form, setForm] = useState({
      code: "",
      name: "",
      color: "",
      programDean: "",
  });

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  }, []);

  const [visible, setVisible] = useState("programs");
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedSubarea, setSelectedSubarea] = useState(null);

  
  const handleDropDown = (area) => {
    const currentExpandedIndex = expandedAreaIndex === area.areaID;
    setExpandedAreaIndex(currentExpandedIndex ? null : area.areaID);
    setShowPreview(false);
    setSelectedArea(currentExpandedIndex ? null : area);    
    
    if(currentExpandedIndex || (selectedArea && selectedArea.areaID !== area.areaID)){
      setSelectedSubarea(null);
    }
  }

  // Function to set the visible area to "areas" and set the selected program
  const visibleArea = (program) => {
    setVisible("areas");
    setSelectedProgram(program);
    fetchAreasForProgram(program.programCode);
  
  }

  // Clear navigation route to programs
  const backToPrograms = () => {
    setVisible("programs");
    setSelectedProgram(null);
    setSelectedArea(null);
    setSelectedSubarea(null);
    setShowPreview(false);
  }

  const handleAreaBreadcrumbClick = () =>{
    setSelectedSubarea(null)
    setShowPreview(false);

    if(selectedArea && expandedAreaIndex === selectedArea.areaID){
      // Area is already expanded, just clear subarea
      return;
    }
    // If area is not expanded, expand it
    if(selectedArea){
      setExpandedAreaIndex(selectedArea.areaID)
    }
  }
  const handleSubareaSelect = (subarea) => {
    setSelectedSubarea(subarea);
  }

  const handleFilePreview = useCallback(async (docName, docPath) => {
    try {
      setIsLoading(true);
      setError(null);
      setDocs([]);
      setShowPreview(true);

      const blobRes = await apiGetBlob(`/api/accreditation/preview/${encodeURIComponent(docName)}`);

      if (!blobRes.success || !(blobRes.data instanceof Blob)) {
        throw new Error('File preview failed or file is not a valid Blob.');
      }

      const fileURL = URL.createObjectURL(blobRes.data);

      // Helper function to determine file type from filename
      const getFileType = (fileName) => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const typeMap = {
          'pdf': 'pdf',
          'doc': 'doc',
          'docx': 'docx',
          'xls': 'xls',
          'xlsx': 'xlsx',
          'ppt': 'ppt',
          'pptx': 'pptx',
          'txt': 'txt',
          'csv': 'csv',
          'jpg': 'jpg',
          'jpeg': 'jpeg',
          'png': 'png',
          'gif': 'gif'
        };
        return typeMap[extension] || extension;
      };

      const newDocument = {
        uri: fileURL,
        fileName: docName,
        fileType: getFileType(docName)
      };

      // Delay to ensure proper state transitions
      setTimeout(() => {
        setDocs([newDocument]);
        setShowPreview(true);
        setDocViewerKey(prev => prev + 1);

        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }, 100);

      
    } catch(err){
      console.error('Preview error:', err);
      setError(`Failed to load document: ${err.message}`);
      setIsLoading(false);
      setShowPreview(false);
    } 
  }, []);
    const [done, setDone] = useState({});

    
  const toggleDone = async (criteriaID) => {
    const newStatus = !done[criteriaID];
    try {
      await apiPut(`/api/criteria/${criteriaID}/done`, { isDone: newStatus });
      setDone(prev => ({
        ...prev,
        [criteriaID]: newStatus
      }));
    } catch (err) {
      console.error("Failed to update done status", err);
    }
  };



    return (
      <>
        <div className="relative flex flex-row min-h-screen p-3 px-5 border rounded-[20px] border-neutral-300 dark:bg-gray-900 inset-shadow-sm inset-shadow-gray-400 dark:inset-shadow-gray-500 dark:shadow-md dark:shadow-zuccini-800">
          
          {/* Main Content */}
          <div className="relative flex flex-col w-full pt-2">
            {/* Navigation route */}
            <div className='flex flex-row gap-3 mb-5'>             
              <FontAwesomeIcon icon={faHouse}
              onClick={() => {backToPrograms()}}
              className={`${visible === "programs" 
              ? 'text-gray-500 inset-shadow-sm inset-shadow-gray-400 bg-gray-300 dark:inset-shadow-gray-800 dark:bg-gray-800/50 dark:text-gray-400' 
              : 'cursor-pointer text-gray-500 bg-gray-200 hover:text-zuccini-500 dark:hover:text-zuccini-500/70 shadow-md dark:inset-shadow-sm dark:inset-shadow-gray-400 dark:bg-gray-950/50'
          } p-4 text-xl transition-all duration-200 border border-neutral-300 rounded-xl dark:border-neutral-500`}
              />             
            
            {/* Breadcrumbs */}
            <div className='w-full p-3 font-semibold bg-neutral-300/90 rounded-xl border-neutral-300 text-neutral-800 dark:text-white inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-950/50'>
              <nav className="flex items-center overflow-hidden font-semibold text-gray-700 gap-x-2 text-md lg:text-lg dark:text-white">
                
                {/* Programs Breadcrumb */}
                <span 
                  onClick={() => backToPrograms()} 
                  className="flex items-center flex-shrink-0 transition-all cursor-pointer duration-250 hover:text-zuccini-500"
                  title="Programs"
                >
                  Programs
                </span>
                
                {/* Program Name Breadcrumb */}
                {selectedProgram && (
                  <>
                    <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">/</span>
                    <span 
                      onClick={() => {
                        // Stay in areas view but clear area/subarea selections
                        setSelectedArea(null);
                        setSelectedSubarea(null);
                        setExpandedAreaIndex(null);
                        setShowPreview(false);
                      }}
                      className="flex items-center min-w-0 truncate transition-all duration-300 cursor-pointer hover:text-zuccini-500"
                      title={selectedProgram.programName}
                    >
                      <span className="truncate">
                        {selectedProgram.programName.length > 25 
                          ? `${selectedProgram.programName.substring(0, 25)}...` 
                          : selectedProgram.programName
                        }
                      </span>
                    </span>
                  </>
                )}
                
                {/* Area Name Breadcrumb */}
                {selectedArea && (
                  <>
                    <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">/</span>
                    <span 
                      onClick={() => {        
                        setSelectedSubarea(null);
                        setShowPreview(false);            
                      }}
                      className="flex items-center min-w-0 truncate transition-all duration-300 cursor-pointer hover:text-zuccini-500"
                      title={selectedArea.areaName}
                    >
                      <span className="truncate">
                        {selectedArea.areaName.length > 20 
                          ? `${selectedArea.areaName.substring(0, 20)}...` 
                          : selectedArea.areaName
                        }
                      </span>
                    </span>
                  </>
                )}
                
                {/* Subarea Name Breadcrumb */}
                {selectedSubarea && (
                  <>
                    <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">/</span>
                    <span 
                      className="flex items-center min-w-0 truncate transition-all duration-200 hover:text-zuccini-500 text-zuccini-600 dark:text-zuccini-400"
                      title={selectedSubarea.subareaName}
                    >
                      <span className="truncate">
                        {selectedSubarea.subareaName.length > 20 
                          ? `${selectedSubarea.subareaName.substring(0, 20)}...` 
                          : selectedSubarea.subareaName
                        }
                      </span>
                    </span>
                  </>
                )}
                
              </nav>
            </div>
            { isAdmin && visible !== "programs" && (                
                <button onMouseEnter={() => setShowWord(true)}
                  onMouseLeave={() => setShowWord(false)}
                  onClick={() => setShowCreateModal(true)}
                  className={`p-3 px-4 text-xl flex items-center transition-all duration-300 cursor-pointer rounded-xl text-gray-500 bg-gray-200 hover:text-zuccini-500 dark:hover:text-zuccini-500/70 shadow-md border-neutral-700 dark:border-neutral-500 dark:text-gray-200 dark:inset-shadow-sm dark:inset-shadow-gray-400  dark:bg-gray-950/50`}
                  >
                    
                    <span
                      className={`transition-all duration-500 overflow-hidden whitespace-nowrap ${ showWord ? "opacity-100 max-w-[200px] mr-2" : "opacity-0 max-w-0 mr-0"}`}
                    >
                      Create</span>
                    <FontAwesomeIcon icon={faPlus} className='z-10'/>
                </button>                
              )}
            {showCreateModal && (
              <CreateModal 
                onCreate={() => refreshAreas(selectedProgram.programCode)} 
                setShowCreateModal={setShowCreateModal} 
                onClick={() => setShowCreateModal(false)}
              />
              
            )}
            </div>

            {/* Content Area */}
            <div className="flex flex-row flex-1 gap-4">
              
              {/* Programs/Areas */}
              <div className={`flex flex-col transition-all duration-500 ${showPreview ? 'w-1/2' : 'w-full'}`}>
                
                {/* Program Cards Section */}
                <div className={`${visible == "programs" ? 'block' : 'hidden'} flex flex-wrap gap-4`}>
            { isAdmin && (<CreateCard form={form} handleChange={handleChange} setShowForm={setShowForm} title="Program" />)}
              {programLoading ? (
                <>
                  <CardSkeleton />
                  <CardSkeleton />                                    
                  <CardSkeleton />                                    
                </>
                ) : (              
                <>
                  {programs.map(program=> (
                        <ProgramCard 
                          program={program} 
                          key={program.programID} 
                          onClick={()=> visibleArea(program)}                           
                        />
                      ))}
                </>
              )}
              
                    </div>

                    {/* Areas Section */}
                    {selectedProgram && visible === "areas" && (
                      <div className="flex flex-col w-full overflow-auto">
                        <div className="w-full p-2 text-gray-700 rounded-xl">
                          {areas.sort((a, b) => a.areaID - b.areaID).map((area) => {
                            const allCriteria = Array.isArray(area.subareas)
                              ? area.subareas.flatMap(sub => [
                                  ...(sub.criteria?.inputs || []),
                                  ...(sub.criteria?.processes || []),
                                  ...(sub.criteria?.outcomes || []),
                                ])
                              : [];

                            const doneCount = allCriteria.filter(c => done[c.criteriaID]).length;
                            const doneTotal = allCriteria.length;        
                            const progress = doneTotal > 0 ? ((doneCount / doneTotal) * 100).toFixed(0) : 0 ;              

                          return (
                                <div key={area.areaID} className='flex flex-col'>
                                  <AreaCont 
                                    title={area.areaName} 
                                    onClick={() => handleDropDown(area)}
                                    onIconClick={() => handleDropDown(area)}
                                    isExpanded={expandedAreaIndex === area.areaID}
                                    doneCount={doneCount}
                                    doneTotal={doneTotal}         
                                    progress={progress}
                                  /> 
                                  <div className={`list-upper-alpha list-inside overflow-hidden transition-all duration-500 ease-in-out ${expandedAreaIndex === area.areaID ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                  {Array.isArray(area.subareas) && area.subareas.filter(sa => sa.subareaID != null).length > 0 ? (area.subareas.filter(sa => sa.subareaID != null).map((subarea) => (
                                    <SubCont 
                                      key={subarea.subareaID} 
                                      title={subarea.subareaName} 
                                      criteria={subarea.criteria}                                  
                                      programCode={area.programCode}
                                      areaName={area.areaName}  
                                      subareaName={subarea.subareaName}
                                      onClick={() => {handleSubareaSelect(subarea)}}
                                      onCreate={() => {setShowCreateModal(true)}}
                                      onRefresh={() => refreshAreas(selectedProgram.programCode)}
                                      onFilePreview={handleFilePreview}
                                      done={done}
                                      setDone={setDone}
                                      setAreas={setAreas}
                                      toggleDone={toggleDone}
                                    />))
                                    ) : (
                                    <div className='flex flex-col items-center justify-center p-5 mb-3 text-neutral-800 bg-neutral-300/50 dark:bg-gray-800/50 dark:text-white rounded-2xl'>
                                      <h1 className='text-lg font-semibold'>No Sub-Areas found</h1>
                                      <p className='mb-1 font-light text-md'>Want to Create one?</p>
                                      <button onClick={() => {setShowCreateModal(true)}} className='px-10 py-2 transition-all duration-300 cursor-pointer bg-neutral-300 dark:bg-gray-600 hover:text-white hover:bg-zuccini-600/60 rounded-2xl'>Create</button>
                                    </div>
                                    )
                                  }
                                  </div>
                                </div>
                              )})}            
                        </div>
                      </div>
                    )}
                    
                </div>

                {/* Document Viewer */}
                <div className={`sticky top-0 transition-all duration-500 ease-in-out overflow-hidden ${showPreview ? 'w-1/2 opacity-100' : 'w-0 opacity-0'}`} 
                     style={{ height: showPreview ? '100vh' : '0' }}>
                  {showPreview && (
                    <div className='relative w-full h-full bg-white rounded-lg shadow-lg' style={{ minHeight: '100%', minWidth: '400px' }}>
                      
                      {/* Loading State */}
                      {isLoading && (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-lg">Loading document...</div>
                        </div>
                      )}
                      
                      {/* Error State */}
                      {error && (
                        <div className="flex flex-col items-center justify-center h-full p-4">
                          <div className="mb-2 text-lg text-red-500">Error Loading Document</div>
                          <div className="text-sm text-center text-gray-600">{error}</div>
                          <button 
                            onClick={() => {setShowPreview(false); setError(null);}}
                            className="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600"
                          >
                            Close
                          </button>
                        </div>
                      )}
                      
                      {/* Document Viewer */}
                      {!isLoading && !error && docs.length > 0 && (
                        <>
                          <div className="absolute inset-0 w-full h-full">
                            <DocViewer 
                              key={docViewerKey} // Force re-render when key changes
                              pluginRenderers={DocViewerRenderers}
                              documents={docs}    
                              className="doc-viewer"
                              prefetchMethod="GET"
                              config={{
                                header: {
                                  disableHeader: false,
                                  disableFileName: false,
                                  retainURLParams: false,
                                },
                                pdfZoom: {
                                  defaultZoom: 1.0,
                                  zoomJump: 0.3,
                                },
                                pdfVerticalScrollByDefault: false,
                                loadingRenderer: {
                                  showLoadingTimeout: false,
                                }
                              }}
                              style={{ 
                                height: '100%',
                                width: '100%',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0
                              }}
                            />
                          </div>

                          {/* Close Button */}
                          <FontAwesomeIcon 
                            icon={faCircleXmark} 
                            onClick={() => {
                              setShowPreview(false);
                              setDocs([]);
                              setError(null);
                            }}
                            className="absolute z-10 text-2xl transition-all duration-300 border-black rounded-full cursor-pointer text-white/50 border-1 top-3 right-4 hover:text-red-400"
                          /> 
                          
                          {/* View Full Document Button */}
                          <button 
                            onClick={() => {
                              if(docs.length > 0) {
                                window.open(docs[0].uri, '_blank');
                              }
                            }}
                            className="absolute z-10 px-4 py-2 font-medium text-white transition-all duration-300 bg-green-600 rounded-lg shadow-lg bottom-4 right-4 hover:bg-green-700"
                          >
                            View Full Document
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/*Form Modal*/}
            {showForm && 
            <CreateForm 
              title="Program"
              data={programs}
              employees={employees}
              institutes={institutes}
              onSubmit={handleSubmit}
              onClose={() => setShowForm(false)}
              onEditSelect={handleEditSelect}
              onDeleteSelect={handleDeleteSelect}
              onDelete={handleDelete}
              activeModify={activeModify}
              editIndex={editIndex}
              form={form}
              handleChange={handleChange}
              handleModify={handleModify}
              employees={employees}
              institutes={instituteOption}
            />}
        </div>
      </>
    );
}
export default Programs;