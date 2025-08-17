//for imports
  import {
  faPlus,
  faCircleXmark
  } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
  import {useCallback, useEffect, useState} from 'react'
  import AreaCont from '../components/AreaCont';
  import SubCont from '../components/SubCont';
  import CreateModal from '../components/modals/CreateModal';
  import { apiGet } from '../utils/api_utils';

  import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
  import "@cyntler/react-doc-viewer/dist/index.css";
  import "../../index.css"
  
  const Accreditation = () => {
    const [expandedAreaIndex, setExpandedAreaIndex] = useState(null);
    const [area, setArea] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    const [docs, setDocs] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [docViewerKey, setDocViewerKey] = useState(0); // Force re-render key

    useEffect(()=>{
      const fetchArea = async () => {
        try {
          const response = await apiGet('/api/accreditation')
          Array.isArray(response.data) ? setArea(response.data) : setArea([]);
        } catch(err){
          console.log(err.response?.data || err.message)
        }
      }
      fetchArea(); 
    },[])

    const refreshAreas = async () => {
      try {
        const response = await apiGet('/api/accreditation', {withCredentials: true})
        Array.isArray(response.data) ? setArea(response.data) : setArea([]);
      } catch(err) {
        console.error('Error refreshing areas:', err);
      }
    }

    const handleDropDown = (areaID) => {
      setExpandedAreaIndex(expandedAreaIndex === areaID ? null : areaID);
      setShowPreview(false);
    }

    const handleFilePreview = useCallback(async (docName, docPath) => {
      try {
        console.log('Preview requested for:', docName, docPath);
        
        setIsLoading(true);
        setError(null);
        setDocs([]); // Clear previous documents
        setShowPreview(false); // Hide preview temporarily
        
        // Construct the full URL
        const fullURL = docPath.startsWith('http') || docPath.startsWith('https')
          ? docPath
          : `http://localhost:5000/api/accreditation/preview/${encodeURIComponent(docName)}`;
            

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
          uri: fullURL,
          fileName: docName,
          fileType: getFileType(docName)
        };
        
        
        // Delay to ensure proper state transitions
        setTimeout(() => {
          setDocs([newDocument]);
          setShowPreview(true);
          setDocViewerKey(prev => prev + 1); // Force re-render
          
          // Force re-render after a short delay
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

    return(
    <>
        <div className="relative flex flex-row justify-around border border-neutral-800 rounded-[20px] min-w-[950px] min-h-[90%] shadow-md p-3 bg-neutral-200 dark:bg-gray-900 dark:inset-shadow-sm dark:inset-shadow-zuccini-800">
          <div className='flex flex-col w-full p-3 overflow-auto'>
            <div className='flex flex-row gap-5 mb-5'>
                <button onClick={() => {setShowCreateModal(true)}}  className='flex flex-row items-center justify-around px-3 font-semibold transition-all duration-300 border border-black shadow-lg cursor-pointer rounded-2xl text-neutral-800 hover:scale-105 hover:shadow-2xl hover:bg-zuccini-600 hover:text-white dark:border-none dark:text-white dark:bg-gray-950 dark:inset-shadow-sm dark:inset-shadow-zuccini-800'>
                    Create
                    <FontAwesomeIcon icon={faPlus} className='ml-3'/>
                </button>

                {showCreateModal && (
                  <CreateModal 
                    onCreate={refreshAreas} 
                    setShowCreateModal={setShowCreateModal} 
                    onClick={() => setShowCreateModal(false)}
                  />
                )}

                {/* Breadcrumbs */}
                <div className='p-3 bg-neutral-300 rounded-xl w-[89%] text-neutral-800 font-semibold dark:text-white dark:bg-gray-950/50'>
                    <h1 className='text-md'>Home / BSIT / Level 1 Phase 1 / Area I</h1>   
                </div>
            </div>

            {/* Area Containers */}
            {area.map((area) => (
              <div key={area.areaID} className='flex flex-col '>
                <AreaCont 
                  title={area.areaName} 
                  onClick={() => handleDropDown(area.areaID)}
                  onIconClick={() => handleDropDown(area.areaID)}
                  isExpanded={expandedAreaIndex === area.areaID}
                /> 
                <div className={`list-upper-alpha list-inside overflow-hidden transition-all duration-500 ease-in-out ${expandedAreaIndex === area.areaID ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                {Array.isArray(area.subareas) && area.subareas.filter(sa => sa.subareaID != null).length > 0 ? (area.subareas.filter(sa => sa.subareaID != null).map((subarea) => (
                  <SubCont 
                    key={subarea.subareaID} 
                    title={subarea.subareaName} 
                    criteria={subarea.criteria}
                    onClick={() => {setShowCreateModal(true)}}
                    onRefresh={refreshAreas}
                    onFilePreview={handleFilePreview}
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
            ))}
          </div>

          {/* Document Viewer Section */}
          <div className={`relative transition-all duration-500 ease-in-out overflow-hidden ${showPreview ? 'w-full opacity-100 fade-in-right' : 'w-0 opacity-0 fade-in-right'}`} style={{ height: '100vh' }}>
            {showPreview && (
              <div className='w-full h-full relative' style={{ minHeight: '600px', minWidth: '400px' }}>
                
                {/* Loading State */}
                {isLoading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-lg">Loading document...</div>
                  </div>
                )}
                
                {/* Error State */}
                {error && (
                  <div className="flex flex-col items-center justify-center h-full p-4">
                    <div className="text-red-500 text-lg mb-2">Error Loading Document</div>
                    <div className="text-sm text-gray-600 text-center">{error}</div>
                    <button 
                      onClick={() => {setShowPreview(false); setError(null);}}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Close
                    </button>
                  </div>
                )}
                
                {/* Document Viewer */}
                {!isLoading && !error && docs.length > 0 && (
                  <>
                    <div className="w-full h-full absolute inset-0">
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
                      className="z-10 absolute text-2xl text-white/50 rounded-full border-1 border-black top-3 right-4 cursor-pointer hover:text-red-400 transition-all duration-300"
                    /> 
                    
                    {/* View Full Document Button */}
                    <button 
                      onClick={() => {
                        if(docs.length > 0) {
                          window.open(docs[0].uri, '_blank');
                        }
                      }}
                      className="absolute bottom-4 right-4 z-10 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 font-medium shadow-lg"
                    >
                      View Full Document
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </>
      )
  };

  export default Accreditation;