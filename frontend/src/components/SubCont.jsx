import {
 faPlus,
 faChevronDown,
 faChevronUp, 
 faCheck,
 faSquareCheck,
 faXmark
} from '@fortawesome/free-solid-svg-icons';
import {faCircleCheck} from '@fortawesome/free-regular-svg-icons';
import { useRef, useState, useEffect} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import UploadModal from './modals/UploadModal';
import { adminHelper } from '../utils/auth_utils';
import { apiPut } from '../utils/api_utils';
import StatusModal from './modals/StatusModal';

const SubCont = ({title, criteria, programCode, areaName, subareaName, onCreate, onClick, onRefresh, onFilePreview, done, toggleDone, setAreas}) => {

    const approveRef = useRef(null)
    const isAdmin = adminHelper()
    const [expanded, setExpanded] = useState(false);
    const [criteriaExpand, setCriteriaExpand] = useState(null);
    const [showUpload, setShowUpload] = useState(false);
    const [showApprove, setShowApprove] = useState(null);

    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("success");    

    const [selectedCriteriaID, setSelectedCriteriaID] = useState(null); // State to hold the selected criteria ID
    const [selectedProgramCode, setSelectedProgramCode] = useState(null); // State to hold the selected program code
    const [selectedAreaName, setSelectedAreaName] = useState(null); // State to hold the selected area ID
    const [selectedCriteriaType, setSelectedCriteriaType] = useState(null);
    const [selectedSubareaName, setSelectedSubareaName] = useState(null);
    

        // Handle outside click of the approve modal
        useEffect( () => {
            const handleOutsideClick = (e) => {
                if (
                    approveRef.current &&
                    !approveRef.current.contains(e.target)
                ){
                    setShowApprove(null)                                        
                }
    
            }
    
            document.addEventListener('mousedown', handleOutsideClick)
            return () => {
                document.removeEventListener('mousedown', handleOutsideClick)
            }
    
        },[showApprove])

    // Function to close the modal
    const handleCloseModal = () => {        
        setShowStatusModal(false);
        setSelectedCriteriaID(null);
        setSelectedProgramCode(null);
    };

    const closeStatusModal = () => {
        setShowStatusModal(false);
        onRefresh()
    }

    const handleApprove = async (docID) => {
        try{
           const res = await apiPut('/api/program/approve', {docID})

            setShowStatusModal(true)
            setStatusMessage(res.data.message)
            setStatusType("success")

        } catch(err){
            console.error("Failed to approve Document: ", err)
            setShowStatusModal(true)
            setStatusMessage("An error occurred when approving document")
            setStatusType("error")
        }
    }

    const handleReject = async (docID) => {
        try{
           const res = await apiPut('/api/program/reject', {docID})

            setShowStatusModal(true)
            setStatusMessage(res.data.message)
            setStatusType("success")

        } catch(err){
            console.error("Failed to reject Document: ", err)
            setShowStatusModal(true)
            setStatusMessage("An error occurred when rejecting document")
            setStatusType("error")
        }
    }

    // Function to toggle approve modal for specific criteria
    const toggleApproveModal = (criteriaID) => {
        setShowApprove(showApprove === criteriaID ? null : criteriaID);
    };

    // Function to close approve modal (you can call this after approve/reject actions)
    const closeApproveModal = () => {
        setShowApprove(null);
    };


      const handleUploadTrigger = (criteriaID, criteriaType) => {
        setSelectedCriteriaID(criteriaID);
        setSelectedProgramCode(programCode);
        setSelectedAreaName(areaName);
        setSelectedCriteriaType(criteriaType);
        setSelectedSubareaName(subareaName);

        setShowUpload(true);
    };

    //renders the input, process, outcome
    const renderCriteriaGroup = (groupName, items, index) => {
      const isOpen = criteriaExpand === index;


        return(
        <>

        {/* Status Modal */}
            {showStatusModal && (
                <StatusModal message={statusMessage} type={statusType} showModal={showStatusModal} onClick={closeStatusModal}  />

            )}
        {/* CriteriaGroup div */}
        <div 
        onClick={() => {setCriteriaExpand(isOpen ? null : index)}}
        className='flex flex-row justify-between p-3 py-5 mb-2 ml-5 transition-all duration-300 border shadow-md cursor-pointer rounded-2xl border-neutral-400 text-neutral-800 hover:scale-101 dark:text-white hover:border-neutral-500 dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 '>
            <h2 className='font-semibold'>{groupName}</h2>
             <div className='mr-3'>
                    <FontAwesomeIcon 
                        icon={isOpen ? faChevronUp : faChevronDown} 
                        onClick={() => setCriteriaExpand(isOpen ? null : index)}
                    />
            </div>            
        </div>

            
        <div className={`flex flex-col ml-5 overflow-hidden transition-all duration-400 ease-in-out ${
            isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0' 
        }`}>
            {/* Criteria Rendering */}
            {items.length > 0 ? items.map((item, index) => (
                <div key={index} 
                className='flex flex-row justify-between gap-3 p-3 mb-2 ml-5 transition-all duration-300 border shadow-md cursor-default rounded-2xl border-neutral-400 text-neutral-800 dark:text-white inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600'>
                    <span className='break-words text-[15px] max-w-[65%] whitespace-pre-wrap'>{item.content}</span>

                    <div className='flex flex-col items-center justify-center'>
                        <h2 className='font-semibold'>Attached File</h2>
                        {item.docName ? (
                            <button
                            onClick={() =>{onFilePreview(item.docName, item.docPath)}}
                            className='text-sm font-light text-center cursor-pointer hover:underline'>{item.docName}</button>

                        ) : (
                            <span className='text-sm text-gray-500'>No file attached</span>
                        )
                        }
                        
                    </div>

                    <div className='flex items-center justify-between gap-5 mr-3 relative'>
                        {isAdmin ? (
                           <>
                                <FontAwesomeIcon                     
                                    icon={item.isApproved === true ? faCheck :item.isApproved === false ? faXmark : faCircleCheck}                                     
                                    title={item.isApproved === true ? 'Approved' : item.isApproved === false ? 'Rejected' : 'Approve Document'}                             
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleApproveModal(item.criteriaID);
                                    }}
                                    className={`text-xl cursor-pointer ${item.isApproved === true ? 'text-emerald-500' : item.isApproved === false ? 'text-red-600' : 'text-neutral-500 '}`}
                                />                            
                                {showApprove === item.criteriaID && (
                                    <div
                                    ref={approveRef}
                                    className="z-50 flex flex-row gap-5 absolute -top-5 right-5 p-5 rounded-xl border-neutral-400 shadow-xl bg-gray-200/10 backdrop-blur-sm">
                                        <button 
                                            onClick={() => {
                                                handleApprove(item.docID);
                                                console.log(`Approved document ${item.docID}`);
                                                closeApproveModal();
                                            }}
                                            className="w-25 rounded-xl p-3 bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-400 hover:to-emerald-700 dark:from-emerald-600 font-semibold text-gray-200"
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            onClick={() => {
                                                handleReject(item.docID);
                                                console.log(`Rejected document ${item.docID}`);
                                                closeApproveModal();
                                            }}
                                            className='w-25 rounded-xl p-3 bg-gradient-to-br from-red-500 to-red-800 hover:from-red-400 hover:to-red-700 dark:from-red-600 dark:to-red-800 font-semibold text-gray-200'
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            
                        <FontAwesomeIcon
                            icon={item.isApproved === true ? faCheck :item.isApproved === false ? faXmark : faSquareCheck}
                            title= {item.isApproved === true ? 'Approved' : item.isApproved === false ? 'Rejected' : 'Mark as done'}
                            onClick={item.isApproved === true ? undefined : () => toggleDone(item.criteriaID)}                                                        
                            className={`text-xl ${item.isApproved === false ? 'text-red-600' : done[item.criteriaID] || item.isApproved === true ? 'text-zuccini-600' : 'text-neutral-500'} ${item.isApproved === true ? 'cursor-default' : 'cursor-pointer'}`}
                        />)}
                        
                        <FontAwesomeIcon 
                            icon={faPlus} 
                            onClick={(e) => { 
                                e.stopPropagation(); // Prevent event bubbling                                
                                handleUploadTrigger(item.criteriaID, groupName);
                                console.log(`Program Code: ${programCode}`)
                                console.log(`Area Name: ${areaName}`)
                                console.log(`Sub-Area Name: ${subareaName}`)
                                console.log(`Criteria Type: ${groupName}`)
                                console.log(`Criteria ID: ${item.criteriaID}`)
                                
                                }
                            } 
                            className={`${item.isApproved === true ? 'invisible w-0' : ''} text-xl transition-colors cursor-pointer hover:text-blue-600`} 
                        />
                    </div>
                </div>
            )) : (
                <div className='flex flex-col items-center justify-center p-5 mb-3 text-neutral-800 bg-neutral-300/50 dark:bg-gray-800/50 dark:text-white rounded-2xl'>
                      <h1 className='text-lg font-semibold'>No Criteria found</h1>
                      <p className='mb-1 font-light text-md'>Want to Create one?</p>
                      <button onClick={onCreate}  className='px-10 py-2 transition-all duration-300 cursor-pointer bg-neutral-300 dark:bg-gray-600 hover:text-white hover:bg-zuccini-600/60 rounded-2xl'>Create</button>
                    </div>
            )}
        </div>
        </>
        )
    }




    return(


        // subarea container div
        <li className='flex flex-col list-inside'>
            <button 
                onClick={() => {setExpanded(prev => !prev); if (onClick) onClick();}}
                
                className='flex flex-row justify-between p-3 py-5 mb-2 ml-5 transition-all duration-300 border shadow-md cursor-pointer rounded-2xl border-neutral-400 text-neutral-800 hover:scale-101 dark:text-white hover:border-neutral-500 dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 '>   
                <h1 className='font-semibold text-md'>{title}</h1>
                <div className='mr-3'>
                    <FontAwesomeIcon 
                        icon={expanded ? faChevronUp : faChevronDown} 
                        onClick={() => setExpanded(prev => !prev)}
                    />
                </div>
            </button>

            
            <div className={`flex flex-col ml-5 transition-all duration-400 ease-in-out ${
                expanded ? 'max-h-[2000px] opacity-100 overflow-visible' : 'overflow-hidden max-h-0 opacity-0' }`}>    
                        {renderCriteriaGroup("Inputs", criteria.inputs, 0)}
                        {renderCriteriaGroup("Processes", criteria.processes, 1)}
                        {renderCriteriaGroup("Outcomes", criteria.outcomes, 2)}
            </div>

            {/* Upload Modal */}
            {showUpload && selectedCriteriaID && (
                <UploadModal 
                    showModal={showUpload} 
                    onClose={handleCloseModal}  
                    criteriaID={selectedCriteriaID}
                    programCode={selectedProgramCode}
                    areaName={selectedAreaName}
                    criteriaType={selectedCriteriaType}
                    subareaName={selectedSubareaName}
                    onUploadSuccess={onRefresh}
                    setAreas={setAreas}
                />
            )}
        </li>
    )
}

export default SubCont;