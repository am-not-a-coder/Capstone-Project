import {
 faFilePdf
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';



const PreviewFile = ({ document, onClick }) => {

    return(
        <div className="sticky w-full border border-gray-700 shadow-gray-700 max-h-[500px] flex flex-col items-center justify-center p-5 dark:bg-gray-800 rounded-lg "> 
            {/* File Preview Header */}
            <div className='flex items-center w-full'>
                <div className='flex items-center justify-between'>
                <FontAwesomeIcon icon={faFilePdf} className="text-xl text-red-500 mr-3"/>
                <h2 className='text-xl font-semibold text-neutral-800 text-shadow-2xs'>File Name</h2>
                </div>

            </div>

            
            
        </div>
    )
}

export default PreviewFile;