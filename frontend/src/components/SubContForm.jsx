import {
 faStar,
 faChevronDown,
 faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import SelfRateModal from './modals/SelfRateModal';
import { apiGet, apiPost } from '../utils/api_utils';
import SimilarityChart from './SimilarityChart';
import CircularProgressBar from './CircularProgressBar';


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

    const [hoveredPrediction, setHoveredPrediction] = useState(null)
    const [hoveredCriteriaID, setHoveredCriteriaID] = useState(null)

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
        className={`flex flex-row items-center justify-between p-2 md:p-3 ${selfRateMode ? '' : 'md:py-5' } mb-2 ml-5 transition-all duration-300 border shadow-md cursor-pointer rounded-2xl border-neutral-400 text-neutral-800 hover:scale-101 dark:text-white hover:border-neutral-500 dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 `}>
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

            
        <div className={`flex flex-col ml-5 transition-all duration-400 ease-in-out ${
    isOpen ? 'max-h-[2000px] opacity-100 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden' 
}`}>
            {/* Criteria Rendering */}
            {items.length > 0 ? items.map((item, index) => (            
                <div key={index} className='relative flex flex-row justify-between gap-3 p-3 py-10 mb-2 ml-5 overflow-visible transition-all duration-300 border shadow-md cursor-default rounded-2xl border-neutral-400 text-neutral-800 dark:text-white inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600'>
                    <span className='wrap-break-words text-[15px] flex-1 min-w-0 whitespace-pre-wrap'>{item.content}</span>                
                    <div className='flex flex-col items-center justify-center min-w-[120px] max-w-[180px] shrink-0'>
                        <h2 className='font-semibold'>Attached File</h2>
                        {item.docName ? (
                            <button
                                onClick={() => {onFilePreview(item.docName, item.docPath)}}
                                className='w-full text-sm font-light leading-tight text-center whitespace-normal cursor-pointer wrap-break-words hover:underline'
                            >
                                {item.docName}
                            </button>
                        ) : (
                            <span className='text-sm text-gray-500'>No file attached</span>
                        )}
                    </div>

                    <span className='absolute text-sm italic text-gray-500 bottom-2 left-3 dark:text-gray-300'>Criteria ID: {item.criteriaID}</span>
                    <div className='relative items-end'>
                        <h1
                            onMouseEnter={() => {
                                setHoveredPrediction(index);
                                setHoveredCriteriaID(item.criteriaID);
                            }}  
                            onMouseLeave={() => {
                                // Only clear if not hovering the popup
                                if (!document.querySelector(`#popup-${item.criteriaID}:hover`)) {
                                    setHoveredPrediction(null);
                                    setHoveredCriteriaID(null);
                                }
                            }}
                            className='absolute text-sm italic text-gray-500 -bottom-7 -right-2 whitespace-nowrap dark:text-gray-300'
                        >Predicted rating: {item.predicted_rating?.toFixed(1) || '0.0'}</h1>

                        {hoveredCriteriaID === item.criteriaID && (
                            <div 
                                id={`popup-${item.criteriaID}`}
                                onMouseEnter={() => {
                                    setHoveredPrediction(index);
                                    setHoveredCriteriaID(item.criteriaID);
                                }}
                                onMouseLeave={() => {
                                    setHoveredPrediction(null);
                                    setHoveredCriteriaID(null);
                                }}
                                className={`absolute flex flex-col -bottom-2 z-50 p-3 border border-gray-300 shadow-xl min-w-[200px] bg-gray-200/10 backdrop-blur-xs rounded-xl -right-5 dark:bg-gray-900 transition-all duration-300 ${hoveredCriteriaID === item.criteriaID ? 'fade-in-bottom' : 'fade-out-bottom'}`}>
                                    
                            {item.docName ? (
                                <>
                                 <h1 className='my-2 text-lg font-medium text-blue-500 place-self-center text-shadow-gray-300 text-shadow-sm'>{item.docName}</h1>                            
                                <div className='flex flex-row justify-between'>
                                    <span className='font-medium text-md'>Probability of Approval:</span> 
                                    <span className={`text-xl font-semibold ${
                                        (item.predicted_probability * 100) >= 70 ? 'text-zuccini-600' : 
                                        (item.predicted_probability * 100) >= 40 ? 'text-amber-600' : 
                                        'text-red-600'}`}>
                                            {(item.predicted_probability * 100)?.toFixed(2) || "0.0"}%</span>
                                </div>  
                                
                                <div className='w-full h-3 overflow-hidden bg-gray-400 rounded-full dark:bg-gray-700'>
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        (item.predicted_probability * 100) >= 70 ? 'bg-linear-to-r from-zuccini-400 to-zuccini-600' :
                                        (item.predicted_probability * 100) >= 40 ? 'bg-linear-to-r from-amber-400 to-amber-600' :
                                        'bg-linear-to-r from-red-400 to-red-600'
                                    }`}
                                    style={{ width: `${(item.predicted_probability * 100)?.toFixed(1) || 0}%` }}
                                />
                            </div>

                            
                                
                                 {item.similar_docs && item.similar_docs.length > 0 && (
                                    <div className="mt-2">                                        
                                        <SimilarityChart similarDocs={item.similar_docs} />                                         
                                    </div>
                                )}
                                </>
                            ) : (
                                 /* No Document UI */
                            <div className='flex flex-col items-center justify-center py-4 min-w-[300px]'>
                                {/* Empty Document Icon */}
                                <div className='flex items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full dark:bg-gray-800'>
                                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>

                                {/* Message */}
                                <h2 className='mb-2 text-base font-semibold text-gray-700 dark:text-gray-300'>
                                    No Document Attached
                                </h2>
                                <p className='mb-4 text-sm text-center text-gray-500 dark:text-gray-400'>
                                    Upload a document to view predicted approval rating and similar documents
                                </p>

                                {/* Info Box */}
                                <div className='w-full p-3 border border-gray-200 rounded-lg bg-gray-50/50 dark:bg-gray-800/50 dark:border-gray-700'>
                                    <div className='flex items-start gap-2'>
                                        <svg className="flex-shrink-0 w-4 h-4 mt-0.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div className='text-xs text-gray-600 dark:text-gray-400'>
                                            <p className='font-medium'>Why upload?</p>
                                            <ul className='mt-1 space-y-1 list-disc list-inside'>
                                                <li>Get AI-predicted approval ratings</li>
                                                <li>Compare with similar documents</li>
                                                <li>Improve compliance accuracy</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
        
                            )}
                               

                            </div>
                        )}
                    
                    </div>
                   

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
                className={`flex flex-row items-center justify-between p-2 md:p-3 md:py-5 mb-2 ml-0 md:ml-5 transition-all duration-300 border shadow-md cursor-pointer rounded-2xl border-neutral-400 text-neutral-800 hover:scale-101 dark:text-white hover:border-neutral-500 dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 `}>   
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
                        className="ml-2 -mr-2 md:-mr-0"
                    />
                </div>
            </button>

            
            <div className={`flex flex-col ml-0 md:ml-5 transition-all duration-400 ease-in-out ${
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