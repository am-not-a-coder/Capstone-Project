import {
 faChevronDown,
 faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

//Area container div

export default function AreaCont(props) {
    // props: title, onClick, isExpanded, onIconClick
    return(
        <button 
            onClick={props.onClick}
            className='flex flex-row justify-between min-w-full p-3 mb-2 border shadow-md cursor-pointer rounded-2xl text-neutral-800 dark:border-none dark:text-white dark:bg-gray-950 dark:inset-shadow-sm dark:inset-shadow-zuccini-800'>
            <h1 className='font-semibold text-md'>{props.title}</h1>
            <div className='mr-3'>
                <FontAwesomeIcon 
                    icon={props.isExpanded ? faChevronUp : faChevronDown} 
                    onClick={e => {
                        e.stopPropagation();
                        if (props.onIconClick) props.onIconClick(e);
                    }}
                    className='cursor-pointer'
                />
            </div>
        </button>
    )
}