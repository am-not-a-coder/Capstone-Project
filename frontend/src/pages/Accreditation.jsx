//for imports
import {
 faPlus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {useEffect, useState} from 'react'
import axios from 'axios';
import AreaCont from '../components/AreaCont';
import SubCont from '../components/SubCont';


// const area = [
//   {
//     title: "Area 1: Governance and Administration",
//     subAreas: [
//       { title: "A. Administrative Organization",
//         criteria: [
//           {title: "Input/s"},
//           {title: "Processes"},
//           {title: "Outcomes"}
//         ]
//        },
//       { title: "B. Academic Administration",
//         criteria: [
//           {title: "Input/s"},
//           {title: "Processes"},
//           {title: "Outcomes"}
//         ]
//        }
//     ]
//   },
//   {
//     title: "Area II: Faculty",
//     subAreas: [
//       { title: "A. Academic Faculty Qualification and Teaching Experience", 
//         criteria: [
//           {title: "Input/s"},
//           {title: "Processes"},
//           {title: "Outcomes"}
//         ]
//       },
//       { title: "B. Recruitment and Selection",
//         criteria: [
//           {title: "Input/s"},
//           {title: "Processes"},
//           {title: "Outcomes"}
//         ]
//        }
//     ]
//   }
// ];

const Accreditation = () => {

    const [expandedAreaIndex, setExpandedAreaIndex] = useState(null);
    const [area, setArea] = useState([]);

    const [] = useState();


    const token = localStorage.getItem('token'); // gets the access token

    useEffect(()=>{
      const fetchArea = async () => {
        
        if (!token){
            alert("No token found!");
            return;
        }

        const response = await axios.get('http://localhost:5000/api/accreditation', 
            {headers: {'Authorization': `Bearer${token}`}}, {withCredentials: true})

        try{
          (Array.isArray(response.data) ? setArea(response.data) : setArea([]));
          console.log(response.data);
        } catch(err){
          console.log(err.response?.data || err.message)
          
        }

      }

     fetchArea(); 

    },[])
    

    const handleDropDown = (index) => {
      setExpandedAreaIndex((prevIndex) => (prevIndex === index ? null : index))
    }

    const handleCreate = () => {

    }
    

    return(
    <>
        <div className="flex flex-row justify-around border border-neutral-800 rounded-[20px] min-w-[950px] min-h-[90%] shadow-md p-3 bg-neutral-200 dark:bg-[#19181A] dark:inset-shadow-sm dark:inset-shadow-zuccini-800">
           <div className='flex flex-col w-full p-3 overflow-auto'>
                <div className='flex flex-row gap-5 mb-5'>
                    <button className='flex flex-row items-center justify-around px-3 font-semibold transition-all duration-300 border border-black shadow-lg cursor-pointer rounded-2xl text-neutral-800 hover:scale-105 hover:shadow-2xl hover:bg-zuccini-600 hover:text-white'>
                         Create
                        <FontAwesomeIcon onClick={handleCreate} icon={faPlus} className='ml-3'/>
                    </button>
                    {/* Breadcrumbs */}
                    {/* NOT FINAL BREADCRUMBS JUST INITIAL */}
                    <div className='p-3 bg-neutral-300 rounded-xl w-[89%] text-neutral-800 font-semibold'>
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
                  <ol className={`list-upper-alpha list-inside overflow-hidden transition-all duration-500 ease-in-out ${expandedAreaIndex === area.areaID ? 'max-h-96 fade-in' : 'max-h-0 fade-out'}`}>
                  {area.subareas.map((subarea) => (
                    <SubCont 
                      key={subarea.subareaID} 
                      title={subarea.subareaName} 
                      criteria={subarea.criteria}
                      
                     />
                  ))}
                     
                  </ol>
              </div>

             ))}
          
            </div>

           {/* <div className='w-full border border-black'>Picture</div> */}
            
        </div>

    </>
    )
};

export default Accreditation;