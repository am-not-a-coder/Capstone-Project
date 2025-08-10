import {

} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function ReqCont(props) {
    // props: title, onClick, isExpanded, onIconClick
    return(
        <button 
            onClick={props.onClick}
            className='flex flex-row justify-between min-w-full p-3 mb-2 border shadow-md cursor-pointer rounded-2xl text-neutral-800'>
            <h1 className='font-semibold text-md'>{props.content}</h1>
            <div className='mr-3'>
                
            </div>
        </button>
    )
}