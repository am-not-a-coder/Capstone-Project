import {
 faPlus,
 faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function SubCont(props) {

    return(
        <button className='flex flex-row justify-between ml-10 border min-w-full p-3 rounded-2xl cursor-pointer text-neutral-800 mb-2 shadow-md'>
             
            <h1 className='text-md font-semibold'>{props.title}</h1>
            
            <div className='mr-3'>
                <FontAwesomeIcon icon={faPlus} className='mx-5' onClick={props.onclick}/>
                <FontAwesomeIcon icon={faChevronDown} onClick={props.onclick}/>
            </div>
           
        </button>
    )
}