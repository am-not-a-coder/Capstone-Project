import{
    faCircleCheck,
    faCircleXmark
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


const StatusModal = ({message, onClick, type = "success"}) =>{
    const isError = type === "error"
    return(
    <div className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 transform scale-100 bg-black/60">
        <div className={`flex flex-col justify-center items-center px-5 py-3 h-[50%] w-[45%] bg-neutral-200 border-t-10 ${isError ? 'border-red-500 ' : 'border-zuccini-500 '}shadow-2xl rounded-xl dark:bg-[#19181A] dark:inset-shadow-sm dark:inset-shadow-zuccini-900 transition`}>

            <div className='flex items-center justify-center mb-5'>
            <FontAwesomeIcon
                icon={isError ? faCircleXmark : faCircleCheck} 
                className={`mr-3 text-5xl drop-shadow-2xl ${isError ? 'text-red-500' : 'text-zuccini-600'}`}
            />
                <h1 className={`mb-2 text-5xl drop-shadow-2xl ${isError ? 'text-red-500' : 'text-zuccini-600'}`}>{isError ? "Error" : "Success"}</h1>
            </div>

            <h1 className='mb-3 text-3xl text-neutral-800 text-shadow-lg dark:text-white'>{message}</h1>
            
            <button className={`transition duration-300 w-[150px] rounded-lg p-4 mt-5 font-semibold text-white ${isError ? 'bg-red-500 hover:bg-red-400 ' : 'bg-zuccini-600 hover:bg-zuccini-500'}`} onClick={onClick}>Go Back</button>
                
        </div>      
    </div>
    )
}

export default StatusModal;