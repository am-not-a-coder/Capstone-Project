import {
 faPlus,
 faChevronDown,
 faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import {faCircleCheck} from '@fortawesome/free-regular-svg-icons';
import { useState} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import UploadModal from './modals/UploadModal';

const SubCont = ({title, criteria}) => {
    const [expanded, setExpanded] = useState(false);
    const [criteriaExpand, setCriteriaExpand] = useState(null);
    const [showUpload, setShowUpload] = useState(false);

    const [done, setDone] = useState(false);
    // Function to close the modal
    const handleCloseModal = () => {
        setShowUpload(false);
    };

    //renders the input, process, outcome
    const renderCriteriaGroup = (groupName, items, index) => {
      const isOpen = criteriaExpand === index;

        return(
        <>
        {/* CriteriaGroup div */}
        <div 
        onClick={() => setCriteriaExpand(isOpen ? null : index)}
        className='flex flex-row justify-between p-3 mb-2 ml-5 border shadow-md cursor-pointer rounded-2xl text-neutral-800 dark:text-white dark:border-none dark:bg-woodsmoke-950 dark:inset-shadow-sm dark:inset-shadow-zuccini-800'>
            <h2 className='font-semibold'>{groupName}</h2>
             <div className='mr-3'>
                    <FontAwesomeIcon 
                        icon={isOpen ? faChevronUp : faChevronDown} 
                        onClick={() => setCriteriaExpand(isOpen ? null : index)}
                    />
            </div>            
        </div>

            {/* CriteriaContent div - Fixed animation classes */}
        <div className={`flex flex-col ml-5 overflow-hidden transition-all duration-400 ease-in-out ${
            isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0' 
        }`}>
            {items.map((item, index) => (
                <div key={index} className='flex flex-row justify-between gap-3 p-3 mb-2 ml-5 border shadow-md cursor-default rounded-2xl text-neutral-800 dark:border-none dark:text-white dark:bg-woodsmoke-950 dark:inset-shadow-sm dark:inset-shadow-zuccini-800'>
                    <span className='break-words text-[15px] max-w-[65%]'>{item.content}</span>

                    <div className='flex flex-col items-center justify-center'>
                        <h2 className='font-semibold'>Attached File</h2>
                        <span className='font-light text-center cursor-pointer text-small hover:underline'>{item.docName}</span>
                    </div>

                    <div className='flex items-center justify-between gap-5 mr-3'>
                        <FontAwesomeIcon icon={faCircleCheck}
                            onClick={() => setDone(!done)}
                        className={`text-xl ${done ? 'text-zuccini-600' : 'text-neutral-500 '} cursor-pointer`} />
                        <FontAwesomeIcon 
                            icon={faPlus} 
                            onClick={() => setShowUpload(true)} 
                            className="text-xl transition-colors cursor-pointer hover:text-blue-600" 
                        />
                    </div>
                </div>
            ))}
        </div>
        </>
        )
    }

    return(
        // subarea container div
        <li className='flex flex-col list-inside'>
            <button 
                onClick={() => setExpanded(prev => !prev)}
                className='flex flex-row justify-between p-3 mb-2 ml-5 border shadow-md cursor-pointer rounded-2xl text-neutral-800 dark:border-none dark:text-white dark:bg-woodsmoke-950 dark:inset-shadow-sm dark:inset-shadow-zuccini-800'>   
                <h1 className='font-semibold text-md'>{title}</h1>
                <div className='mr-3'>
                    <FontAwesomeIcon 
                        icon={expanded ? faChevronUp : faChevronDown} 
                        onClick={() => setExpanded(prev => !prev)}
                    />
                </div>
            </button>

            {/* Main dropdown - Fixed animation classes */}
            <div className={`flex flex-col ml-5 overflow-hidden transition-all duration-400 ease-in-out ${
                expanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0' }`}>    
                        {renderCriteriaGroup("Input/s", criteria.inputs, 0)}
                        {renderCriteriaGroup("Processes", criteria.processes, 1)}
                        {renderCriteriaGroup("Outcomes", criteria.outcomes, 2)}
            </div>

            {/* Render Upload Modal */}
            {showUpload && (
                <UploadModal onClose={handleCloseModal} />
            )}
        </li>
    )
}

export default SubCont;