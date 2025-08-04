//for imports
import {
 faPlus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {useState} from 'react'
import AreaCont from '../components/AreaCont';
import SubCont from '../components/SubCont';

const area = [
    {
        title: "Area I: Faculty",
    },
    {
        title: "Area II: Administration"   
    }]

const subArea = [
    {
        title: "Sub-Area I: Faculty",
    },
    {
        title: "Sub-Area II: Administration"   
    }]

    const [showDropArea, setShowDropArea] = useState(false);


const Accreditation = () => {




    return(
    <>
        <div className="flex flex-row justify-around border border-neutral-800 rounded-[20px] min-w-[950px] min-h-[90%] shadow-md p-3 bg-neutral-200 dark:bg-[#19181A] dark:inset-shadow-sm dark:inset-shadow-zuccini-800">
           <div className=' w-full p-3'>
                <div className='flex flex-row gap-5 mb-5'>
                    <button className='border border-black rounded-2xl shadow-lg p-3 cursor-pointer text-neutral-800'>
                        Create Area 
                        <FontAwesomeIcon icon={faPlus} className='ml-4'/>
                    </button>
                    {/* Breadcrumbs */}
                    {/* NOT FINAL BREADCRUMBS JUST INITIAL */}
                    <div className='p-3 bg-neutral-300 rounded-xl w-[89%] text-neutral-800 font-semibold'>
                        <h1 className='text-md'>Home / Area I</h1>   
                    </div>
                </div>

                {/* Area Containers */}
                
                {area.map((areaItem, index) => (
                    <AreaCont key={index} title={areaItem.title} onClick={() => setShowDropArea(true)}/>
                ))}

                {/* {subArea.map((subAreaItem, index) => (
                    <SubCont key={index} title={subAreaItem.title}/>
                ))} */}
                    
                    
                    
                    

                    
                
            </div>

           <div className='border border-black w-full'>Picture</div>    
            
        </div>

    </>
    )
};

export default Accreditation;