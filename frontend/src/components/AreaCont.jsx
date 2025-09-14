import {
 faChevronDown,
 faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

//Area container div


export default function AreaCont(props) {
    // props: title, onClick, isExpanded, onIconClick
    
    
    let percentage = props.doneTotal > 0 ? ((props.doneCount / props.doneTotal) * 100).toFixed(0) + '%' : '0%';

    return(
        <button 
            onClick={props.onClick}
            className='relative flex flex-row justify-between min-w-full p-3 mb-2 transition-all duration-300 border shadow-md cursor-pointer border-neutral-400 rounded-2xl text-neutral-800 hover:scale-101 dark:text-white hover:border-neutral-500 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600'>
            <h1 className='font-semibold text-md'>{props.title}</h1>
			<p className='right-[14%] opacity-70 font-semibold absolute'>{props.doneCount} / {props.doneTotal}</p>
            <p className='absolute right-[6%] font-semibold text-lg'>{percentage}</p>

            <div className='mr-3'>
                <FontAwesomeIcon 
                    icon={props.isExpanded ? faChevronUp : faChevronDown} 
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