import {
 faPlus,
 faChevronDown,
 faChevronUp, 
 faCheck,
 faSquareCheck,
 faXmark,
 faTrash,
 faSave,
 faTimes
} from '@fortawesome/free-solid-svg-icons';
import {faCircleCheck} from '@fortawesome/free-regular-svg-icons';
import { useRef, useState, useEffect} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import UploadModal from './modals/UploadModal';
import { adminHelper } from '../utils/auth_utils';
import { apiPut } from '../utils/api_utils';
import StatusModal from './modals/StatusModal';

const SubCont = ({title, subareaID, criteria, programCode, areaName, subareaName, onCreate, onClick, onRefresh, onFilePreview, done, toggleDone, setAreas, editMode, onSaveEditSub, onDeleteSub, onSaveEditCrit, onDeleteCrit }) => {

    const approveRef = useRef(null)
    const isAdmin = adminHelper()
    const [expanded, setExpanded] = useState(false);
    const [criteriaExpand, setCriteriaExpand] = useState(null);
    const [showUpload, setShowUpload] = useState(false);
    const [showApprove, setShowApprove] = useState(null);

    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("success");    

    const [selectedCriteriaID, setSelectedCriteriaID] = useState(null);
    const [selectedProgramCode, setSelectedProgramCode] = useState(null);
    const [selectedAreaName, setSelectedAreaName] = useState(null);
    const [selectedCriteriaType, setSelectedCriteriaType] = useState(null);
    const [selectedSubareaName, setSelectedSubareaName] = useState(null);
    
    const [localSubareaName, setLocalSubareaName] = useState(title);
    const [isEditing, setIsEditing] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editingCriteriaId, setEditingCriteriaId] = useState(null);
    const [localCriteriaContent, setLocalCriteriaContent] = useState({});
    const [deletingCriteriaId, setDeletingCriteriaId] = useState(null);

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
            {items.length > 0 ? items.map((item, itemIndex) => {
                const isEditingCriteria = editingCriteriaId === item.criteriaID;
                const currentContent = localCriteriaContent[item.criteriaID] ?? item.content;

                const handleSaveCrit = async (e) => {
                    e.stopPropagation();
                    await onSaveEditCrit(item.criteriaID, currentContent);
                    setEditingCriteriaId(null);
                };

                const handleCancelCrit = (e) => {
                    e.stopPropagation();
                    setLocalCriteriaContent(prev => ({
                        ...prev,
                        [item.criteriaID]: item.content
                    }));
                    setEditingCriteriaId(null);
                };

                return (
                <div 
                 key={itemIndex} 
                 className='relative flex flex-col md:flex-row justify-between gap-3 p-3 py-10 mb-2 ml-0 md:ml-5 transition-all duration-300 border shadow-md cursor-default rounded-2xl border-neutral-400 text-neutral-800 dark:text-white inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600'>
                    {editMode && isEditingCriteria ? (
                        <div className='flex flex-col w-full gap-2' onClick={(e) => e.stopPropagation()}>
                        <textarea
                            value={currentContent}
                            onChange={(e) => setLocalCriteriaContent(prev => ({
                                ...prev,
                                [item.criteriaID]: e.target.value
                            }))}
                            className='w-full p-2 border border-gray-500 rounded-xl min-h-[100px] dark:bg-gray-800 dark:text-white'
                            placeholder="Criteria content"
                        />
                        <div className='flex gap-2'>
                            <button
                            onClick={handleSaveCrit}
                            className='px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700'
                            >
                            <FontAwesomeIcon icon={faSave} className='mr-2' />
                            Save
                            </button>
                            <button
                            onClick={handleCancelCrit}
                            className='px-4 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700'
                            >
                            <FontAwesomeIcon icon={faTimes} className='mr-2' />
                            Cancel
                            </button>
                        </div>
                        </div>
                    ) : (
                        <>
                        <span className='break-words md:align-middle text-[15px] w-full md:max-w-[65%] whitespace-pre-wrap'>
                            {item.content}
                        </span>

                        <div className='flex flex-col items-center justify-center'><br />
                            <h2 className='font-semibold'>Attached File</h2>
                            {item.docName ? (
                            <button
                                onClick={() => onFilePreview(item.docName, item.docPath)}
                                className='text-sm font-light text-center cursor-pointer hover:underline'
                            >
                                {item.docName}
                            </button>
                            ) : (
                            <span className='text-sm text-gray-500'>No file attached</span>
                            )}
                        </div>

                        <span className='absolute text-xs md:text-sm italic text-gray-500 bottom-2 left-3 dark:text-gray-300'>
                            Area ID: {item.criteriaID}
                        </span>
                        <h1 className='absolute text-xs md:text-sm italic text-gray-500 bottom-2 right-5 dark:text-gray-300'>
                            Predicted rating: {item.predicted_rating?.toFixed(1)}
                        </h1>

                        <div className='relative flex items-center justify-between gap-5 mr-3'>
                            {editMode && !isEditingCriteria ? (
                            <>
                            <button
                                onClick={(e) => {
                                e.stopPropagation();
                                setEditingCriteriaId(item.criteriaID);
                                setLocalCriteriaContent(prev => ({
                                    ...prev,
                                    [item.criteriaID]: item.content
                                }));
                                }}
                                className='px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700'
                            >
                                Edit
                            </button>
                            <button
                                onClick={(e) => {
                                e.stopPropagation();
                                setDeletingCriteriaId(item.criteriaID);
                                }}
                                className='px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700'
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                            </>
                           ) : (
                            <div className='relative flex items-center justify-between gap-5 ml-14 md:ml-0'>
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
                                            className="absolute z-50 flex flex-row gap-5 p-5 shadow-xl -top-5 right-5 rounded-xl border-neutral-400 bg-gray-200/10 backdrop-blur-sm">
                                                <button 
                                                    onClick={() => {
                                                        handleApprove(item.docID);
                                                        console.log(`Approved document ${item.docID}`);
                                                        closeApproveModal();
                                                    }}
                                                    className="p-3 font-semibold text-gray-200 w-25 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-400 hover:to-emerald-700 dark:from-emerald-600"
                                                >
                                                    Approve
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        handleReject(item.docID);
                                                        console.log(`Rejected document ${item.docID}`);
                                                        closeApproveModal();
                                                    }}
                                                    className='p-3 font-semibold text-gray-200 w-25 rounded-xl bg-gradient-to-br from-red-500 to-red-800 hover:from-red-400 hover:to-red-700 dark:from-red-600 dark:to-red-800'
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
                                        e.stopPropagation();
                                        handleUploadTrigger(item.criteriaID, groupName);                               
                                        }
                                    } 
                                    className={`${item.isApproved === true ? 'invisible w-0' : ''} text-xl transition-colors cursor-pointer hover:text-blue-600`} 
                                />
                            </div>
                        )}
                    
                </div>
                </>
                )}
                </div>
                );
            }) : (
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

    const handleSaveSub = async (e) => {
        e.stopPropagation();
        await onSaveEditSub(subareaID, localSubareaName);
        setIsEditing(false);
    };

    const handleCancelSub = (e) => {
        e.stopPropagation();
        setLocalSubareaName(title);
        setIsEditing(false);
    };

    const handleDeleteSub = async (e) => {
        e.stopPropagation();    
        await onDeleteSub(subareaID);
    };


    return(
        <>
         {/* subarea container div */}
        <li className='flex flex-col list-inside'>
            <div
             onClick={() => {setExpanded(prev => !prev); if (onClick) onClick();}}  
             className='flex flex-row justify-between p-2 md:p-3 md:py-5 mb-2 md:ml-5 transition-all duration-300 border shadow-md cursor-pointer rounded-2xl border-neutral-400 text-neutral-800 hover:scale-101 dark:text-white hover:border-neutral-500 dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900'>
                {editMode && isEditing ? (
                    <div className='flex flex-col w-full gap-2' onClick={(e) => e.stopPropagation()}>
                        <input 
                        type='text'
                        value={localSubareaName}
                        onChange={(e) => setLocalSubareaName(e.target.value)}
                        placeholder="Subarea Name"
                        className='w-full p-2 border border-gray-500 rounded-xl'
                        />
                        <div className='flex gap-2'>
                        <button
                            onClick={handleSaveSub}
                            className='px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700'
                        >
                            <FontAwesomeIcon icon={faSave} className='mr-2' />
                            Save
                        </button>
                        <button
                            onClick={handleCancelSub}
                            className='px-4 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700'
                        >
                            <FontAwesomeIcon icon={faTimes} className='mr-2' />
                            Cancel
                        </button>
                        </div>
                    </div>
                    ) : (
                    <>
                        <h1 className='font-semibold text-md' onClick={() => setExpanded(!expanded)}>
                        {title}
                        </h1>
                        
                        <div className='flex items-center gap-3 mr-3'>
                        {editMode && !isEditing && (
                            <>
                            <button
                                onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(true);
                                }}
                                className='px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700'
                            >
                                Edit
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteConfirm(true);
                                }}
                                className='px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700'
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                            </>
                        )}
                        
                        <FontAwesomeIcon 
                            icon={expanded ? faChevronUp : faChevronDown} 
                            onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(!expanded);
                            }}
                            className='cursor-pointer -mr-1'
                        />
                        </div>
                    </>
                    )}
                </div>

            
            <div className={`flex flex-col ml-0 md:ml-5 transition-all duration-400 ease-in-out ${
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
        
        {/* Subarea Delete Confirmation Modal */}
        {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"> 
         <div className='absolute flex flex-col items-center justify-center p-4 border border-gray-200 shadow-lg bg-red-50 w-100 rounded-xl dark:bg-gray-700 dark:border-gray-600 fade-in'>
            <div className='flex items-center justify-center mb-4 bg-red-200 rounded-full inset-shadow-sm w-18 h-18 inset-shadow-red-300'>
                <FontAwesomeIcon icon={faTrash} className="m-auto text-4xl text-red-500"/>
            </div>
            
            <h3 className='mb-2 text-xl font-bold text-gray-900 dark:text-white'>
                Delete Subarea
            </h3>
            <span className='mb-6 text-center text-gray-600 break-words dark:text-gray-300'>
               Are you sure you want to delete "<strong>{title}</strong>"? This will delete all criteria within it.
            </span>

            <div className='flex gap-4'>
                <button 
                    className='px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700' 
                    onClick={handleDeleteSub}
                >
                    Yes
                </button>
                <button 
                    className='px-4 py-2 text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 dark:text-white dark:bg-gray-600 dark:hover:bg-gray-700' 
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(false);
                    }}
                >
                    No
                </button>
            </div>                                    
         </div>
        </div>
        )}
        
        {/* Criteria Delete Confirmation Modal */}
        {deletingCriteriaId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"> 
         <div className='absolute flex flex-col items-center justify-center p-4 border border-gray-200 shadow-lg bg-red-50 w-100 rounded-xl dark:bg-gray-700 dark:border-gray-600 fade-in'>
            <div className='flex items-center justify-center mb-4 bg-red-200 rounded-full inset-shadow-sm w-18 h-18 inset-shadow-red-300'>
                <FontAwesomeIcon icon={faTrash} className="m-auto text-4xl text-red-500"/>
            </div>
            
            <h3 className='mb-2 text-xl font-bold text-gray-900 dark:text-white'>
                Delete Criteria
            </h3>
            <span className='mb-6 text-center text-gray-600 break-words dark:text-gray-300'>
               Are you sure you want to delete this criteria?
            </span>

            <div className='flex gap-4'>
                <button 
                    className='px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700' 
                    onClick={async (e) => {
                        e.stopPropagation();
                        await onDeleteCrit(deletingCriteriaId);
                        setDeletingCriteriaId(null);
                    }}
                >
                    Yes
                </button>
                <button 
                    className='px-4 py-2 text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 dark:text-white dark:bg-gray-600 dark:hover:bg-gray-700' 
                    onClick={(e) => {
                        e.stopPropagation();
                        setDeletingCriteriaId(null);
                    }}
                >
                    No
                </button>
            </div>                                    
         </div>
        </div>
        )} 
    </>
    )
}

export default SubCont;