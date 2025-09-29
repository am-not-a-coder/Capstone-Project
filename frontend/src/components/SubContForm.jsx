import {
 faStar,
 faChevronDown,
 faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SelfRateModal from './modals/SelfRateModal';
import { apiGet, apiPost } from '../utils/api_utils';


const SubContForm = ({title,  selfRateMode, onClick, onFilePreview, subareaID, programCode, onSubareaRatingUpdate}) => {
    const [expanded, setExpanded] = useState(false);
    const [criteriaExpand, setCriteriaExpand] = useState(null);     
    const [showSelfRateModal, setShowSelfRateModal] = useState(false);
    const [hoveredCriteria, setHoveredCriteria] = useState(null);
    
    const [selectedGroup, setSelectedGroup] = useState(null); // State to hold the selected criteria ID
    const [selectedGroupName, setSelectedGroupName] = useState(null); // State to hold the selected criteria ID 
    
    const [overallSubareaRating, setOverallSubareaRating] = useState(0.0)
    const [inputAverage, setInputAverage] = useState(0.0)
    const [processesAverage, setProcessesAverage] = useState(0.0)
    const [outcomesAverage, setOutcomesAverage] = useState(0.0)
    
    const [criteriaState, setCriteriaState] = useState({ inputs: [], processes: [], outcomes: [] });;
    
    const calculateAverage = (array) => {
      if (!array || array.length === 0) return 0.0
        const sum = array.reduce((acc, item) => acc + (item.rating || 0), 0)        
        return sum / array.length
    }

    
     const fetchCriteriaFromDB = async () => {
    try {
        const res = await apiGet(`/api/accreditation/rate/criteria/${programCode}/${subareaID}`);
        
        setCriteriaState(res.data);

        const inputAvg = calculateAverage(res.data.inputs);
        const processAvg = calculateAverage(res.data.processes); 
        const outcomeAvg = calculateAverage(res.data.outcomes);

        const weightedAverage = (
            inputAvg * 0.2 +
            processAvg * 0.3 +
            outcomeAvg * 0.5
        );

        setInputAverage(inputAvg);
        setProcessesAverage(processAvg);
        setOutcomesAverage(outcomeAvg);
        setOverallSubareaRating(weightedAverage);

        try{
            await apiPost('/api/accreditation/rate/subarea', {subareaID, rating: weightedAverage})
            console.log("Subarea rating saved")

            if (onSubareaRatingUpdate) {
                onSubareaRatingUpdate();
            }

        } catch(err){
            console.error('Failed to save subarea rating: ', err)
        }
    } catch (err) {
      console.error("Failed to fetch criteria:", err);
    }
  };

  // Load ratings when component mounts or programCode/subareaID changes
  useEffect(() => {
    fetchCriteriaFromDB();
  }, [programCode, subareaID]);

                   
         
    //renders the input, process, outcome
    const renderCriteriaGroup = (groupName, items, index) => {
      const isOpen = criteriaExpand === index;    

        return(
        <>
        {/* CriteriaGroup div */}
        <div 
        onClick={() => {setCriteriaExpand(isOpen ? null : index)}}
        className={`flex flex-row items-center justify-between p-3 ${selfRateMode ? '' : 'py-5' } mb-2 ml-5 transition-all duration-300 border shadow-md cursor-pointer rounded-2xl border-neutral-400 text-neutral-800 hover:scale-101 dark:text-white hover:border-neutral-500 dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 `}>
            <h2 className='font-semibold'>{groupName}</h2>
             <div className='flex flex-row items-center justify-center mr-3'>                
                       {selfRateMode && (
                            <button                                
                                onMouseEnter={() => setHoveredCriteria(index)}
                                onMouseLeave={() => setHoveredCriteria(null)}
                                onClick={() => {                                                                                                                 
                                    setSelectedGroup(items);    
                                    setSelectedGroupName(groupName.toLowerCase().split(' ')[0]);                                                       
                                    setShowSelfRateModal(true);                                       
                                }}
                                className={`relative flex flex-row items-center align-center p-3 px-5 text-sm font-semibold overflow-hidden transition-all duration-300 text-gray-600 bg-gray-200 rounded-3xl inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-900 dark:text-gray-200 cursor-pointer hover:text-white hover:bg-zuccini-500/80`}
                            >
                                
                                <FontAwesomeIcon icon={faStar} className='mr-3'/>        
                                <h1 className={`${ hoveredCriteria === index ? 'translate-x-10' : 'translate-x-0'} transition-all duration-300`}> 
                                    {groupName.toLowerCase().includes('input') && inputAverage.toFixed(1)}
                                    {groupName.toLowerCase().includes('process') && processesAverage.toFixed(1)}
                                    {groupName.toLowerCase().includes('outcome') && outcomesAverage.toFixed(1)}
                                </h1> {/* Rating */}                    
                                <span className={`absolute ${ hoveredCriteria === index ? "left-9 ml-2" : " ml-0 -left-10"} transition-all duration-300`}>Rate</span>
                            </button>
                       )}
                         
                    <FontAwesomeIcon 
                        icon={isOpen ? faChevronUp : faChevronDown} 
                        onClick={() => setCriteriaExpand(isOpen ? null : index)}
                        className="ml-3"
                    />
            </div>            
        </div>

            
        <div className={`flex flex-col ml-5 overflow-hidden transition-all duration-400 ease-in-out ${
            isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0' 
        }`}>
            {/* Criteria Rendering */}
            {items.length > 0 ? items.map((item, index) => (
                <div key={index} className='relative flex flex-row justify-between gap-3 p-3 py-10 mb-2 ml-5 transition-all duration-300 border shadow-md cursor-default rounded-2xl border-neutral-400 text-neutral-800 dark:text-white inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600'>
                    <span className='break-words text-[15px] flex-1 min-w-0 whitespace-pre-wrap'>{item.content}</span>

                    <div className='flex flex-col items-center justify-center min-w-[120px] max-w-[180px] flex-shrink-0'>
                        <h2 className='font-semibold'>Attached File</h2>
                        {item.docName ? (
                            <button
                                onClick={() => {onFilePreview(item.docName, item.docPath)}}
                                className='w-full text-sm font-light leading-tight text-center break-words whitespace-normal cursor-pointer hover:underline'
                            >
                                {item.docName}
                            </button>
                        ) : (
                            <span className='text-sm text-gray-500'>No file attached</span>
                        )}
                    </div>

                    <span className='absolute text-sm italic text-gray-500 bottom-2 left-3 dark:text-gray-300'>Area ID: {item.criteriaID}</span>
                    <h1 className='absolute text-sm italic text-gray-500 bottom-2 right-5 dark:text-gray-300'>Predicted rating: {item.predicted_rating?.toFixed(1)}</h1>
                        
                    <div className='flex items-center justify-between flex-shrink-0'>
                    {selfRateMode && (
                            <button className={`relative flex flex-row items-center align-center p-3 px-5 text-sm font-semibold overflow-hidden transition-all duration-300 text-gray-600 bg-gray-200 hover:text-white hover:bg-zuccini-500/80 cursor-pointer rounded-3xl inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-900 dark:text-gray-200`}>
                                <FontAwesomeIcon icon={faStar} className='mr-3'/>
                                <h1 className='transition-all duration-300'> {item.rating ? parseFloat(item.rating).toFixed(1) : '0.0'}</h1>                                           
                            </button>
                        )} 
                    </div>
                </div>
            )) : (
                <div className='flex flex-col items-center min-h-[150px] justify-center p-5 mb-3 text-neutral-800 bg-neutral-300/50 dark:bg-gray-800/50 dark:text-white rounded-2xl'>
                      <h1 className='text-lg text-gray-500'>No Criteria found</h1>                     
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
                className={`flex flex-row items-center justify-between p-3 py-5 mb-2 ml-5 transition-all duration-300 border shadow-md cursor-pointer rounded-2xl border-neutral-400 text-neutral-800 hover:scale-101 dark:text-white hover:border-neutral-500 dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 `}>   
                <h1 className='font-semibold text-md'>{title}</h1>
                <div className='flex flex-row items-center justify-center mr-3'>
                     {selfRateMode && (
                    <div                                       
                    className={`relative flex flex-row items-center align-center p-3 px-5 text-sm font-semibold overflow-hidden transition-all duration-300 text-gray-600 bg-gray-200 hover:text-white hover:bg-zuccini-500/80 cursor-pointer rounded-3xl inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-900 dark:text-gray-200`}
                    >
                        <FontAwesomeIcon icon={faStar} className='mr-3'/>        
                    <h1 className='transition-all duration-300'>{overallSubareaRating.toFixed(1)}</h1> {/* Subarea Rating */}                    
                        
                    </div>
                )}          
                    <FontAwesomeIcon 
                        icon={expanded ? faChevronUp : faChevronDown} 
                        onClick={() => setExpanded(prev => !prev)}
                        className="ml-3"
                    />
                </div>
            </button>

            
            <div className={`flex flex-col ml-5 transition-all duration-400 ease-in-out ${
                expanded ? 'max-h-[2000px] opacity-100 overflow-visible' : 'overflow-hidden max-h-0 opacity-0' }`}>    
                        {renderCriteriaGroup(`Inputs ${selfRateMode ? '(20%)' : ''}`, criteriaState.inputs, 0)}
                        {renderCriteriaGroup(`Processes  ${selfRateMode ? '(30%)' : ''}`, criteriaState.processes, 1)}
                        {renderCriteriaGroup(`Outcomes  ${selfRateMode ? '(50%)' : ''}`, criteriaState.outcomes, 2)}
                        {selfRateMode && (
                                  <div className='flex flex-row items-center justify-end p-3 mb-2 ml-5 transition-all duration-300 border shadow-md cursor-pointer rounded-2xl border-neutral-400 text-neutral-800 dark:text-white dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 '>
                                    <h1 className='mr-3 text-xl italic font-semibold'>Overall Sub-Area Rating: </h1>
                                      <div className={`relative flex flex-row items-center align-center p-3 px-15 mr-3 text-sm font-semibold overflow-hidden transition-all duration-300 text-gray-600 bg-gray-200 cursor-pointer rounded-3xl inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-900 dark:text-gray-200`} >
                                        <FontAwesomeIcon icon={faStar} className='mr-3'/>        
                                        <h1 className='text-xl transition-all duration-300'>{overallSubareaRating.toFixed(1)}</h1> {/* Overall Subarea Rating */}
                                      </div>
                                  </div>
                                )}
            </div>

            {/* Self Rate Modal */}
            {showSelfRateModal && (
                <SelfRateModal 
                showModal={showSelfRateModal}             
                criteriaList={selectedGroup}
                groupName={selectedGroupName}   
                onSaveRating={() => fetchCriteriaFromDB()}                   
                setShowSelfRateModal={setShowSelfRateModal}             
                
                />
            )}
        </li>   
    )
}

export default SubContForm;