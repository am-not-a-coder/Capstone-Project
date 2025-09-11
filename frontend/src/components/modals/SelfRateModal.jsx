import { useEffect, useState} from 'react';
import StatusModal from './StatusModal';
import { faStar as faSolidStar} from '@fortawesome/free-solid-svg-icons';
import { faStar as faRegularStar, faFilePdf } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { apiPost } from '../../utils/api_utils';



const SelfRateModal = ({showModal, criteriaList, setShowSelfRateModal, onSaveRating}) => {

    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("success");
    
    const [ratings, setRatings] = useState({});
    const [hovers, setHovers] = useState({}); // highlight the stars when hovered
    
    const handleRating = async (e) => {
       e.preventDefault()
       
       try{

            const response = await apiPost('/api/accreditation/rate/criteria', {ratings})

            onSaveRating(response.data.criteria)
            
            setShowStatusModal(true)
            setStatusMessage("Criteria group rated successfully!")
            setStatusType("success")

       } catch (err) {
            console.error("Failed to rate criteria:", err);
            setShowStatusModal(true);
            setStatusMessage("An error occurred when rating.");
            setStatusType("error");
       }

    }
    
    const computeRating = () => {
        const values = Object.values(ratings)
        if(values.length === 0) return 0.0
        const sum = values.reduce((acc, r) => acc + r, 0)
        return sum / values.length
    }
   

    const handleStarClick = (selectedRating, criteriaID) => {
        setRatings(prev => ({...prev, 
            [criteriaID]: selectedRating})
        );
    }
   

    const handleCloseModal = () => {
        setShowSelfRateModal(false);
        setShowStatusModal(false);        
        
    }

return(
// Modal Overlay
<div className="fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-300 transform scale-100 bg-black/60 backdrop-blur-sm">
    {/* Status Modal */}
    {showStatusModal && (
        <StatusModal message={statusMessage} type={statusType} showModal={showStatusModal} onClick={handleCloseModal}  />

    )}
    {/* Modal Container */}
      <div className={`p-5 bg-gray-100 dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-800 ${showModal ? 'fade-in' : 'fade-out'}`}>
        <div className='flex justify-center h-20 mb-5 align-center bg-linear-to-br from-zuccini-500 to-zuccini-700 rounded-xl inset-shadow-sm inset-shadow-gray-400 dark:from-zuccini-600 dark:to-zuccini-800'>
            <h1 className='mt-5 text-3xl font-semibold text-gray-100 dark:text-gray-200'>Criteria Evaluation</h1>
        </div>
        
        <div className='flex flex-col items-center p-5 mb-2 border-2 border-blue-600 inset-shadow-sm inset-shadow-blue-900 bg-gradient-to-bl from-blue-600 via-purple-800 to-blue-800 rounded-xl'>
            <h1 className='text-6xl font-bold text-gray-100 mb-1'>{computeRating().toFixed(1)}</h1>
            <h1 className='text-2xl text-gray-100'>Total Rating</h1>
        </div>
        
        {criteriaList.map((criteria, criteriaID) => (        
        <div
        key={criteriaID}
        className='relative p-5 mb-5 transition-all duration-500 border border-neutral-400 rounded-xl hover:border-zuccini-600 hover:border-2 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-800'>
            
            <h1 className='mb-2 text-xl font-medium dark:text-gray-200'>Criteria: </h1>
            <p className='text-lg text-justify text-gray-700 break-words whitespace-pre-wrap dark:text-gray-200'>{criteria.content}</p> 

            {/* Star Rating */}
            <div className='flex flex-row gap-5 mt-10 align-center'>
                
                {[1,2,3,4,5].map((star)=> (
                    <FontAwesomeIcon 
                        key={star}
                        icon={star <= (hovers[criteria.criteriaID] || ratings[criteria.criteriaID]) ? faSolidStar : faRegularStar}
                        className={`text-2xl text-yellow-500 transition-colors duration-200 `}
                        onClick={()=> handleStarClick(star, criteria.criteriaID)}
                        onMouseEnter ={() => setHovers(prev => ({...prev, [criteria.criteriaID]: star}))}
                        onMouseLeave ={() => setHovers(prev => ({...prev, [criteria.criteriaID]: 0}))}
                    />
                ))}
                
                <span className='font-semibold text-md'>{(ratings[criteria.criteriaID] || 0.0).toFixed(1)} / 5.0</span> 
            </div>
        </div>                                        
        ))}
        
        
        
        <div className="flex items-center justify-end p-6 space-x-3">
            <button
            onClick={handleCloseModal}
              className={`px-4 py-2 font-medium transition-colors rounded-md bg-gray-300 dark:bg-gray-700 text-neutral-500 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-400/50 dark:hover:bg-gray-600 dark:hover:text-gray-200 cursor-pointer`}>
              Cancel
            </button>
            <button
            onClick={handleRating}            
                className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center bg-blue-600 hover:bg-blue-700 text-white cursor-pointer`}>
              Submit Rating
            </button>
      </div>
    </div>
</div>
)
}

export default SelfRateModal;