import {
 faChevronDown,
 faChevronUp,
 faStar,
 faTriangleExclamation,
 faFloppyDisk
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { apiGet, apiPost } from '../utils/api_utils';
import { useEffect, useState } from 'react';


//Area container div

export default function AreaCont({title, onClick, isExpanded, onIconClick, selfRateMode, areaID, areaRating, onSaveAreaRating}) {
    const [hoveredArea, setHoveredArea] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("success");

   
    const saveRating = async () => {
        try{
            await apiPost('/api/accreditation/rate/area', {
                areaID: areaID,
                rating: areaRating
            })

            setShowStatusModal(true)
            setStatusMessage("Area rating saved!")
            setStatusType("success")

            onSaveAreaRating(programCode, areaID);
            
        } catch(err){
            setShowStatusModal(true)
            setStatusMessage("Failed to save rating. Please try again later.")
            console.error("Failed to save area rating:", err)
            setStatusType("error")

        }
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setShowStatusModal(false)
    }

    return(
        <>
        <button 
            onClick={onClick}
            className={`flex flex-row items-center justify-between min-w-full p-3 ${selfRateMode ? '' : 'py-5' } mb-2 transition-all duration-300 border shadow-md cursor-pointer border-neutral-400 rounded-2xl text-neutral-800 hover:scale-101 dark:text-white hover:border-neutral-500 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600`}>
            <h1 className='font-semibold text-md'>{title}</h1>
            <div className='flex items-center justify-center gap-4 mr-3'>      
                {selfRateMode && (
                    <div                                
                                onMouseEnter={() => setHoveredArea(areaID)}
                                onMouseLeave={() => setHoveredArea(null)}
                                onClick={() => {                                                                                                                                                                                              
                                    setShowModal(true);                                       
                                }}
                                className={`relative flex flex-row items-center align-center p-3 px-5 text-sm font-semibold overflow-hidden transition-all duration-300 text-gray-600 bg-gray-200 rounded-3xl inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-900 dark:text-gray-200 cursor-pointer hover:text-white hover:bg-zuccini-500/80`}
                            >
                        <FontAwesomeIcon icon={faFloppyDisk} className='mr-3'/>                                
                        <h1 className={`${ hoveredArea === areaID ? 'translate-x-10' : 'translate-x-0'} transition-all duration-300`}> 
                            {areaRating.toFixed(1) || 0.0}</h1> {/* Rating */}  
                         <span className={`absolute ${ hoveredArea === areaID ? "left-9 ml-2" : " ml-0 -left-10"} transition-all duration-300`}>Save</span>                  
                        
                    </div>
                )}        
                
                <FontAwesomeIcon 
                    icon={isExpanded ? faChevronUp : faChevronDown} 
                    onClick={e => {
                        e.stopPropagation();
                        if (onIconClick) onIconClick(e);
                    }}
                    className='cursor-pointer'
                />
            </div>
        </button>
                {/* Save Rating Modal */}
        {showModal && (
            // Modal Overlay
            <div className="fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 transform scale-100 bg-black/60 backdrop-blur-sm">
                {/* Status Modal */}
                {showStatusModal && (
                    <StatusModal message={statusMessage} type={statusType} showModal={showStatusModal} onClick={handleCloseModal}  />

                )}
                {/* Modal Container */}
                <div className={`p-5 bg-gray-100 dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-800 ${showModal ? 'fade-in' : 'fade-out'}`}>
                    <div className='flex justify-center h-20 mb-5 align-center bg-linear-to-br from-zuccini-500 to-zuccini-700 rounded-xl inset-shadow-sm inset-shadow-gray-400 dark:from-zuccini-600 dark:to-zuccini-800'>
                        <h1 className='mt-5 text-3xl font-semibold text-gray-100 dark:text-gray-200'>Save Area Rating</h1>
                    </div>
                    {/* warning !! */}
                    <div className='p-5 mb-2 border-2 border-dashed border-yellow-300/50 bg-yellow-500/40 dark:bg-yellow-500/30 rounded-xl'>
                        <h1 className='text-2xl text-yellow-800 dark:text-yellow-300/90'>
                            Warning 
                            <FontAwesomeIcon icon={faTriangleExclamation}  className="ml-2 "/>
                        </h1>
                        <p className='ml-5 text-lg italic font-light text-yellow-800 dark:text-yellow-300/90'>Please confirm your rating. Once submitted, it cannot be modified or resubmitted.</p>
                    </div>
                    
                   
                    
                    
                    
                    <div className="flex items-center justify-end p-6 space-x-3">
                        <button
                        onClick={handleCloseModal}
                        className={`px-4 py-2 font-medium transition-colors rounded-md bg-gray-300 dark:bg-gray-700 text-neutral-500 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-400/50 dark:hover:bg-gray-600 dark:hover:text-gray-200 cursor-pointer`}>
                        Cancel
                        </button>
                        <button
                        onClick={saveRating}            
                            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center bg-blue-600 hover:bg-blue-700 text-white cursor-pointer`}>
                        Save Rating
                        </button>
                </div>
                </div>
            </div>
        )}
        </>
    )
}