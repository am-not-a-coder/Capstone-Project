import {
 faChevronDown,
 faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

//Area container div

export default function AreaCont({ title, onClick, isExpanded, onIconClick }) {
    return(
        <button 
            onClick={onClick}
            className='flex flex-row justify-between min-w-full p-3 mb-2 transition-all duration-300 border shadow-md cursor-pointer border-neutral-400 rounded-2xl text-neutral-800 hover:scale-101 dark:text-white hover:border-neutral-500 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600'>
            <h1 className='font-semibold text-md'>{title}</h1>
            <div className='mr-3'>
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
    )
}