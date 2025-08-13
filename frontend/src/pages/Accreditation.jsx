//for imports
import {
 faPlus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {useEffect, useState} from 'react'
import axios from 'axios';
import AreaCont from '../components/AreaCont';
import SubCont from '../components/SubCont';
import CreateModal from '../components/modals/CreateModal';
import { apiGet } from '../utils/api_utils';

const Accreditation = () => {


    const [expandedAreaIndex, setExpandedAreaIndex] = useState(null);
    const [area, setArea] = useState([]);

    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(()=>{
      const fetchArea = async () => {

        const response = await apiGet('/api/accreditation')

        try{
          (Array.isArray(response.data) ? setArea(response.data) : setArea([]));
          console.log(response.data);
        } catch(err){
          console.log(err.response?.data || err.message)
          
        }

      }

     fetchArea(); 

    },[])

    const refreshAreas = async () => {
       const response = await apiGet('/api/accreditation', 
            {withCredentials: true})
        Array.isArray(response.data) ? setArea(response.data) : setArea([]);
    }
    

    const handleDropDown = (areaID) => {
      setExpandedAreaIndex(expandedAreaIndex === areaID ? null : areaID)
    }


    return(
    <>
        <div className="flex flex-row justify-around border border-neutral-800 rounded-[20px] min-w-[950px] min-h-[90%] shadow-md p-3 bg-neutral-200 dark:bg-[#19181A] dark:inset-shadow-sm dark:inset-shadow-zuccini-800">
           <div className='flex flex-col w-full p-3 overflow-auto'>
                <div className='flex flex-row gap-5 mb-5'>
                    <button onClick={() => {setShowCreateModal(true)}}  className='flex flex-row items-center justify-around px-3 font-semibold transition-all duration-300 border border-black shadow-lg cursor-pointer rounded-2xl text-neutral-800 hover:scale-105 hover:shadow-2xl hover:bg-zuccini-600 hover:text-white dark:border-none dark:text-white dark:bg-woodsmoke-950 dark:inset-shadow-sm dark:inset-shadow-zuccini-800'>
                         Create
                        <FontAwesomeIcon onClick={() => {setShowCreateModal(true)}} icon={faPlus} className='ml-3'/>
                    </button>

                    {showCreateModal && (
                      <CreateModal onCreate={refreshAreas} setShowCreateModal={setShowCreateModal} onClick={() => setShowCreateModal(false)}/>
                    )}



                    {/* Breadcrumbs */}
                    {/* NOT FINAL BREADCRUMBS JUST INITIAL */}
                    <div className='p-3 bg-neutral-300 rounded-xl w-[89%] text-neutral-800 font-semibold dark:text-white dark:bg-woodsmoke-950/50'>
                        <h1 className='text-md'>Home / BSIT / Level 1 Phase 1 / Area I</h1>   
                    </div>
                </div>




                {/* Area Containers */}
               
             {area.map((area) => (
              // area
              <div key={area.areaID} className='flex flex-col'>
                <AreaCont 
                  title={area.areaName} 
                  onClick={() => handleDropDown(area.areaID)}
                  onIconClick={() => handleDropDown(area.areaID)}
                  isExpanded={expandedAreaIndex === area.areaID} 
                /> 
                  {/* sub areas  */}
                  <div className={`list-upper-alpha list-inside overflow-hidden transition-all duration-500 ease-in-out ${expandedAreaIndex === area.areaID ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                  {Array.isArray(area.subareas) && area.subareas.filter(sa => sa.subareaID != null).length > 0 ? (area.subareas.filter(sa => sa.subareaID != null).map((subarea) => (
                    <SubCont 
                      key={subarea.subareaID} 
                      title={subarea.subareaName} 
                      criteria={subarea.criteria}
                      
                     />))
                    ) : (
                    <div className='flex flex-col items-center justify-center p-5 text-neutral-800 bg-neutral-300/50 dark:text-white rounded-2xl'>
                      <h1 className='text-lg font-semibold'>No Sub-Areas found</h1>
                      <p className='mb-1 font-light text-md'>Want to Create one?</p>
                      <button onClick={() => {setShowCreateModal(true)}} className='px-10 py-2 transition-all duration-300 cursor-pointer bg-neutral-300 hover:text-white hover:bg-zuccini-600/60 rounded-2xl'>Create</button>
                    </div>
                    )
                  }
                     
                  </div>
              </div>

             ))}
          
            </div>

           {/* <div className='w-full border border-black'>Picture</div> */}
            
        </div>

    </>
    )
};

export default Accreditation;