import {
    faCircleXmark
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


const DeadlineModal = ({id, programName, programCode, area, date, color, content, onClick}) => {

    return(
        <div className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 transform scale-100 bg-black/60">
                    <div className={`border-y-7 relative flex flex-col px-5 py-3 min-h-[75%] min-w-[65%] bg-neutral-200 shadow-2xl rounded-xl dark:bg-[#19181A] transition`}
                        style={{ borderColor: color}}
                    >
                        <FontAwesomeIcon 
                            icon={faCircleXmark} 
                            className="absolute text-2xl cursor-pointer top-5 right-5 text-neutral-700 dark:text-white" 
                            onClick={onClick} 
                        />
                        <h1 className='mt-5 mb-3 text-2xl font-bold dark:text-white'>
                            {programName} ({programCode})
                        </h1>

                        <div className='relative grid grid-cols-2 my-5'>
                        <div className='border-r-2'>
                            <h1 className='mb-2 text-xl dark:text-white'>Area:</h1>
                            <h2 className='mb-5 ml-5 text-xl italic dark:text-white'>{area}</h2>
                        </div>
                            
                        <div className='pl-5 border-l-2'>
                            <h2 className='mb-2 text-lg dark:text-white'>Deadline:</h2>
                            <h2 className='mb-5 text-xl italic ml-7 dark:text-white'>{date}</h2>
                        </div>
                        </div>

                        <div className='w-full min-h-[150px] p-3 my-2 bg-neutral-100 rounded-lg dark:bg-[#232228] dark:text-white'>
                            <span className='italic font-semibold'>Description:</span>
                            <div className='whitespace-pre-line indent-5'>{content}</div>
                        </div>
                        <span className='italic place-self-end text-neutral-400'>Deadline ID: {id}</span>
                    </div>
                </div>
    )
}

export default DeadlineModal;