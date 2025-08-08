import {
 faChevronDown,
 faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


const SubCont = ({title, criteria}) => {
    const [expanded, setExpanded] = useState(false);
    const [criteriaExpand, setCriteriaExpand] = useState(null);


    //renders the input, process, outcome
    const renderCriteriaGroup = (groupName, items, index) => {
      const isOpen = criteriaExpand === index;

        return(
        <>
        {/* CriteriaGroup div */}
        <div 
        onClick={() => setCriteriaExpand(isOpen ? null : index)}
        className='flex flex-row justify-between p-3 mb-2 ml-5 border shadow-md cursor-pointer rounded-2xl text-neutral-800'>
            <h2 className='font-semibold'>{groupName}</h2>
             <div className='mr-3'>
                    <FontAwesomeIcon 
                        icon={isOpen ? faChevronUp : faChevronDown} 
                        onClick={() => setCriteriaExpand(isOpen ? null : index)}
                    />
            </div>            
        </div>

            {/* CriteriaContent div */}
        <div className={`flex flex-col ml-5 overflow-hidden transition-all duration-500 z-0 ${isOpen ? 'max-h-96 fade-in' : 'max-h-0 fade-out' }`}>
            {isOpen && items.map((criteria, index) => (
                <div key={index} className='flex flex-row justify-between p-3 mb-2 ml-5 border shadow-md cursor-pointer rounded-2xl text-neutral-800'>
                    {criteria}
                </div>
            ))}
        </div>
        </>
        )
    }


    return(
        // subarea container div
    
        <li className='flex flex-col list-item' style={{ listStyleType: 'upper-alpha' }}>
            <button 
                onClick={() => setExpanded(prev => !prev)}
                className='flex flex-row justify-between p-3 mb-2 ml-5 border shadow-md cursor-pointer rounded-2xl text-neutral-800'>   
                <h1 className='font-semibold text-md'>{title}</h1>
                <div className='mr-3'>
                    <FontAwesomeIcon 
                        icon={expanded ? faChevronUp : faChevronDown} 
                        onClick={() => setExpanded(prev => !prev)}
                    />
                </div>
            </button>

            <div className={`flex flex-col ml-5 overflow-hidden transition-all duration-500 z-0 ${expanded ? 'max-h-96 fade-in' : 'max-h-0 fade-out' }`}>
                {expanded &&(
                    <>
                        {renderCriteriaGroup("Input/s", criteria.inputs, 0)}
                        {renderCriteriaGroup("Processes", criteria.processes, 1)}
                        {renderCriteriaGroup("Outcomes", criteria.outcomes, 2)}
                    </>
                )}
            </div>
            

        </li>
    )
}

export default SubCont;