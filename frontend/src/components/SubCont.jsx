import {
 faPlus,
 faChevronDown,
 faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import {faCircleCheck} from '@fortawesome/free-regular-svg-icons';
import { useState} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import UploadModal from './modals/UploadModal';

const SubCont = ({title, criteria, onClick, onRefresh, onFilePreview}) => {
    const [expanded, setExpanded] = useState(false);
    const [criteriaExpand, setCriteriaExpand] = useState(null);
    const [showUpload, setShowUpload] = useState(false);

    const [selectedCriteriaID, setSelectedCriteriaID] = useState(null); // State to hold the selected criteria ID

    const [done, setDone] = useState(false);
    // Function to close the modal
    const handleCloseModal = () => {
        setShowUpload(false);
        setSelectedCriteriaID(null)
    };

      const handleUploadTrigger = (criteriaID) => {
        setSelectedCriteriaID(criteriaID);
        setShowUpload(true);
    };

    //renders the input, process, outcome
    const renderCriteriaGroup = (groupName, items, index) => {
      const isOpen = criteriaExpand === index;

      


        return(
        <>
        {/* CriteriaGroup div */}
        <div 
        onClick={() => setCriteriaExpand(isOpen ? null : index)}
        className='flex flex-row justify-between p-3 mb-2 ml-5 border shadow-md cursor-pointer rounded-2xl text-neutral-800 dark:text-white dark:border-none dark:bg-gray-950 dark:inset-shadow-sm dark:inset-shadow-zuccini-800'>
            <h2 className='font-semibold'>{groupName}</h2>
             <div className='mr-3'>
                    <FontAwesomeIcon 
                        icon={isOpen ? faChevronUp : faChevronDown} 
                        onClick={() => setCriteriaExpand(isOpen ? null : index)}
                    />
            </div>            
        </div>

            
        <div className={`flex flex-col ml-5 overflow-hidden transition-all duration-400 ease-in-out ${
            isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0' 
        }`}>
            {items.length > 0 ? items.map((item, index) => (
                <div key={index} className='flex flex-row justify-between gap-3 p-3 mb-2 ml-5 border shadow-md cursor-default rounded-2xl text-neutral-800 dark:border-none dark:text-white dark:bg-gray-950 dark:inset-shadow-sm dark:inset-shadow-zuccini-800'>
                    <span className='break-words text-[15px] max-w-[65%] whitespace-pre-wrap'>{item.content}</span>

                    <div className='flex flex-col items-center justify-center'>
                        <h2 className='font-semibold'>Attached File</h2>
                        {item.docName ? (
                            <button
                            onClick={() =>{onFilePreview(item.docName, item.docPath)}}
                            className='font-light text-center cursor-pointer text-sm hover:underline'>{item.docName}</button>

                        ) : (
                            <span className='text-sm text-gray-500'>No file attached</span>
                        )
                        }
                        
                    </div>

                    <div className='flex items-center justify-between gap-5 mr-3'>
                        <FontAwesomeIcon icon={faCircleCheck}
                            onClick={() => setDone(!done)}
                        className={`text-xl ${done ? 'text-zuccini-600' : 'text-neutral-500 '} cursor-pointer`} />
                        <FontAwesomeIcon 
                            icon={faPlus} 
                            onClick={(e) => { 
                                 e.stopPropagation(); // Prevent event bubbling                                
                                handleUploadTrigger(item.criteriaID);
                            }
                            } 
                            className="text-xl transition-colors cursor-pointer hover:text-blue-600" 
                        />
                    </div>
                </div>
            )) : (
                <div className='flex flex-col items-center justify-center p-5 mb-3 text-neutral-800 bg-neutral-300/50 dark:bg-gray-800/50 dark:text-white rounded-2xl'>
                      <h1 className='text-lg font-semibold'>No Criteria found</h1>
                      <p className='mb-1 font-light text-md'>Want to Create one?</p>
                      <button onClick={onClick}  className='px-10 py-2 transition-all duration-300 cursor-pointer bg-neutral-300 dark:bg-gray-600 hover:text-white hover:bg-zuccini-600/60 rounded-2xl'>Create</button>
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
                onClick={() => setExpanded(prev => !prev)}
                className='flex flex-row justify-between p-3 mb-2 ml-5 border shadow-md cursor-pointer rounded-2xl text-neutral-800 dark:border-none dark:text-white dark:bg-gray-950 dark:inset-shadow-sm dark:inset-shadow-zuccini-800'>   
                <h1 className='font-semibold text-md'>{title}</h1>
                <div className='mr-3'>
                    <FontAwesomeIcon 
                        icon={expanded ? faChevronUp : faChevronDown} 
                        onClick={() => setExpanded(prev => !prev)}
                    />
                </div>
            </button>

            
            <div className={`flex flex-col ml-5 overflow-hidden transition-all duration-400 ease-in-out ${
                expanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0' }`}>    
                        {renderCriteriaGroup("Input/s", criteria.inputs, 0)}
                        {renderCriteriaGroup("Processes", criteria.processes, 1)}
                        {renderCriteriaGroup("Outcomes", criteria.outcomes, 2)}
            </div>

            {/* Upload Modal */}
            {showUpload && selectedCriteriaID && (
                <UploadModal 
                    showModal={showUpload} 
                    onClose={handleCloseModal}  
                    criteriaID={selectedCriteriaID}
                    onUploadSuccess={onRefresh}
                />
            )}
        </li>
    )
}

export default SubCont;