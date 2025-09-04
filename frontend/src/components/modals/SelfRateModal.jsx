import { useEffect, useState } from 'react';
import StatusModal from './StatusModal';
import { apiGet, apiPostForm } from '../../utils/api_utils';


const SelfRateModal = ({onClick, onCreate, setShowSelfRateModal}) => {

const [programID, setProgramID] = useState('');
const [areaNum, setAreaNum] = useState('');
const [areaName, setAreaName] = useState('');

const [subAreaName, setSubAreaName] = useState('');
const [criteria, setCriteria] = useState('');
const [criteriaType, setCriteriaType] = useState('Inputs'); // input, process, outcome


const [programCode, setProgramCode] = useState('');
const [selectedAreaID, setSelectedAreaID] = useState();
const [selectedSubAreaID, setSelectedSubAreaID] = useState()

const [activeForm, setActiveForm] = useState("Area")

// options
const [programOption, setProgramOption] = useState([]);
const [areaOption, setAreaOption] = useState([]);
const [subAreaOption, setSubAreaOption] = useState([]);
const [allSubareas, setAllSubareas] = useState([]);


const [showStatusModal, setShowStatusModal] = useState(false); // shows the status modal
const [statusMessage, setStatusMessage] = useState(null); // status message
const [statusType, setStatusType] = useState("success"); // status type (success/error)


    //fetch Program
    useEffect(() => {
        const fetchProgram = async () => {
            try{
                const res = await apiGet('/api/program', {withCredentials: true})
                Array.isArray(res.data.programs) ? setProgramOption(res.data.programs) : setProgramOption([]);
                console.log(res.data.programs)
            } catch (err){
                console.error("Error occurred when fetching program", err)
            }
        }
        fetchProgram();

    }, [])
    
    //fetch Sub-area
    
    const fetchSubAreas = async (programCode) =>{
        try{
            const res = await apiGet(`/api/accreditation?programCode=${encodeURIComponent(programCode)}`,{withCredentials: true})

            // Extract all subareas from all areas
            const allSubareas = [];
                if (Array.isArray(res.data)) {res.data.forEach(area => {
                    if (Array.isArray(area.subareas)) {
                        // Add areaID to each subarea for filtering later
                        area.subareas.forEach(subarea => {
                            allSubareas.push({
                                ...subarea,
                                areaID: area.areaID
                            });
                        });
                    }
                });
            }
            setAllSubareas(allSubareas);
            setSubAreaOption(allSubareas);
        } catch(err){
            console.error("Error occurred when fetching sub-area", err)
        }
    };

    //fetch Area
    
    const fetchAreas = async (programCode) => {
        
        try{
            const res = await apiGet(`/api/accreditation?programCode=${encodeURIComponent(programCode)}`, {withCredentials: true})

            Array.isArray(res.data) ? setAreaOption(res.data) : setAreaOption([]);
            
        } catch(err){
            console.error("Error occurred when fetching area", err)
        }
    }
    
    

    const handleCreateArea = async (e) => {
        e.preventDefault();
        
        const formData = new FormData()
            formData.append("programID", programID)
            formData.append("areaNum", areaNum)
            formData.append("areaName", areaName)


        try{
            const response = await apiPostForm('/api/accreditation/create_area', formData, {withCredentials: true});

            //shows the status of creation
            setShowStatusModal(true)
            setStatusMessage(response.data.message)
            setStatusType("success")    

        } catch(err){
            setShowStatusModal(true)
            setStatusMessage("An error occurred when creating area")
            setStatusType("error")
        }

    }

    const handleCreateSubArea = async (e) => {
        e.preventDefault();

        const formData = new FormData()
            formData.append("selectedAreaID", selectedAreaID)
            formData.append("subAreaName", subAreaName)
            
        try{
            
            const response = await apiPostForm('/api/accreditation/create_subarea', formData, {withCredentials: true});                   
    
            //shows the status of creation
            setShowStatusModal(true)
            setStatusMessage(response.data.message)
            setStatusType("success")
            

        } catch(err){
            setShowStatusModal(true)
            setStatusMessage("An error occurred when creating sub-area")
            console.error(err)
            setStatusType("error")
        }

    }

    const handleCreateCriteria = async (e) => {
        e.preventDefault();

        const formData = new FormData()
        formData.append("selectedSubAreaID", selectedSubAreaID)
        formData.append("criteriaType", criteriaType)
        formData.append("criteria", criteria)

        try{
            const response = await apiPostForm('/api/accreditation/create_criteria', formData, {withCredentials: true});

            //shows the status of creation
            setShowStatusModal(true)
            setStatusMessage(response.data.message)
            setStatusType("success")

        }catch(err){
            setShowStatusModal(true)
            setStatusMessage("An error occurred when creating criteria")
            console.error(err)
            setStatusType("error")
        }

    }

    // trigger api calls when programCode Changes
    useEffect(() => {
        if (programCode){
            fetchAreas(programCode);
            fetchSubAreas(programCode);
        } else{
            setAreaOption([]);
            setSubAreaOption([]);
        }

    }, [programCode])

    useEffect(() => {
        if(selectedAreaID){
            const filteredSubAreas = allSubareas.filter(
                (sub) => sub.areaID === parseInt(selectedAreaID)
            );
            setSubAreaOption(filteredSubAreas);
        } else{
            setSubAreaOption(allSubareas);
        }
            setSelectedSubAreaID(''); // Reset selected subarea when area changes
        }, [selectedAreaID, allSubareas])

        // handles the passing of programID and programCode
    const handleChange = (e) =>{
        setProgramID(e.target.value);
                        
        const selectedProgram = programOption.find(p => p.programID === parseInt(e.target.value))

        if (selectedProgram){
            setProgramCode(selectedProgram.programCode);
        } else{
            setProgramCode('');
        }

    }

    const handleCloseModal = () => {
        setShowStatusModal(false);
        setShowSelfRateModal(false);
        
    // Clear inputs and refresh areas after success    
        setSelectedAreaID('')
        setSelectedSubAreaID('')
        setCriteriaType('Inputs')
        setCriteria('')

        // Clear inputs and refresh areas after success    
        setSelectedAreaID('');
        setSubAreaName('');

        setCriteria('');
        setCriteriaType('');
        if (onCreate) onCreate(); // refreshes the areas

    }


return(

<div className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 transform scale-100 bg-black/60 backdrop-blur-sm">

    {showStatusModal && (
        <StatusModal message={statusMessage} type={statusType} showModal={showStatusModal} onClick={handleCloseModal}  />

    )}

    <div className={`flex flex-col relative px-5 py-3 min-w-[700px] text-black bg-neutral-200 border-t-10 border-zuccini-400 shadow-2xl rounded-xl inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-900 dark:shadow-sm dark:shadow-zuccini-900 transition`}>
        <h1 className="mb-3 text-3xl text-black text-shadow-sm dark:text-white">Create {activeForm} </h1>
        <div>
            <button className={`${activeForm == "Area" ? 'border-b-2 border-zuccini-600 font-semibold bg-neutral-300 dark:bg-gray-800 dark:text-white' : 'border-0 font-normal'} cursor-pointer dark:text-white rounded-t-lg text-lg py-2 px-5 mb-2`} onClick={() => setActiveForm("Area")}>Area</button>
            <button className={`${activeForm == "Sub-Area" ? 'border-b-2 font-semibold border-zuccini-600 bg-neutral-300 dark:bg-gray-800 dark:text-white' : 'border-0 font-normal'} cursor-pointer dark:text-white rounded-t-lg text-lg py-2 px-5 mb-2`} onClick={() => setActiveForm("Sub-Area")}>Sub-Area</button>
            <button className={`${activeForm == "Criteria" ? 'border-b-2 border-zuccini-600 font-semibold bg-neutral-300 dark:bg-gray-800 dark:text-white' : 'border-0 font-normal'} cursor-pointer dark:text-white rounded-t-lg text-lg py-2 px-5 mb-2`} onClick={() => setActiveForm("Criteria")}>Criteria</button>
        </div>

        <div className="px-3 pt-3 mb-5 dark:text-white bg-neutral-300 rounded-xl min-h-[325px] border border-neutral-400 inset-shadow-sm inset-shadow-gray-400 focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:shadow-zuccini-900 dark:shadow-md dark:bg-gray-950/50">        
            {activeForm === "Area" && ( 
                <form action=""
                onSubmit={handleCreateArea}
                className='flex flex-col justify-center '
                >
                    <label htmlFor ="programID" className='mb-2 text-xl font-semibold'>Program</label>

                    <select name="programID" id="programID"
                        value={programID}
                        onChange={handleChange}
                        className='p-2 mb-3 transition-all duration-500 cursor-pointer inset-shadow-sm inset-shadow-gray-400 dark:shadow-zuccini-900 dark:shadow-md dark:bg-gray-900 bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 '
                        required>
                        <option value="">Select a Program</option>

                        {programOption.map((program) => {
                            return(                            
                                <option key={program.programID} value={program.programID}>{program.programName}</option>
                            )
                        })}
                    </select>

                    <label htmlFor="areaNum" className='mb-2 text-xl font-semibold'>Area Number</label>
                    <input name="areaNum" type="text" placeholder="e.g. Area I, Area II, Area III"
                        value={areaNum}
                        onChange= {(e) => {setAreaNum(e.target.value)}}
                         className='p-2 mb-3 transition-all duration-500 cursor-pointer inset-shadow-sm inset-shadow-gray-400 dark:shadow-zuccini-900 dark:shadow-md dark:bg-gray-900 bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 ' 
                        required/>
                    
                    <label htmlFor="areaName" className='text-xl font-semibold'>Area Name</label>
                    <input name="areaName" type="text" 
                        placeholder="Enter the area name"
                        value={areaName}
                        onChange={(e) => {setAreaName(e.target.value)}}
                         className='p-2 mb-3 transition-all duration-500 cursor-pointer inset-shadow-sm inset-shadow-gray-400 dark:shadow-zuccini-900 dark:shadow-md dark:bg-gray-900 bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 '
                        required
                    />

                </form>
            )}
            {activeForm === "Sub-Area" && (
                <form action=""
                className='flex flex-col justify-center'
                >
                    <label htmlFor ="programID" className='mb-2 text-xl font-semibold'>Program</label>

                    <select name="programID" id="programID"
                        value={programID}
                        onChange={handleChange}
                        className='p-2 mb-3 transition-all duration-500 cursor-pointer inset-shadow-sm inset-shadow-gray-400 dark:shadow-zuccini-900 dark:shadow-md dark:bg-gray-900 bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 '
                        required>
                        <option value="">Select a Program</option>

                        {programOption.map((program) => {
                            return(                            
                                <option key={program.programID} value={program.programID}>{program.programName}</option>
                            )
                        })}
                    </select>

                    <label htmlFor="selectedAreaID" className='mb-2 text-xl font-semibold'>Assign Area</label>

                    <select name="selectedAreaID" id="selectedAreaID"           
                        value={selectedAreaID}             
                        onChange={(e)=> {setSelectedAreaID(e.target.value)}}
                         className='p-2 mb-3 transition-all duration-500 cursor-pointer inset-shadow-sm inset-shadow-gray-400 dark:shadow-zuccini-900 dark:shadow-md dark:bg-gray-900 bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 '
                        required>
                        <option value="" >Select Designated Area</option>
                        {areaOption.map((area) => {                            
                            return(
                                <option key={area.areaID} value={area.areaID}>{area.areaName}</option>
                            )
                        })}
                    </select>

                    <label htmlFor="subAreaName" className='mb-2 text-xl font-semibold'>Sub-Area Name</label>
                    <input name="subAreaName" type="text" placeholder="e.g. A. Administration, B. Finance"
                        onChange={(e) => {setSubAreaName(e.target.value)}}   
                         className='p-2 mb-3 transition-all duration-500 cursor-pointer inset-shadow-sm inset-shadow-gray-400 dark:shadow-zuccini-900 dark:shadow-md dark:bg-gray-900 bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 '
                        required/>
                    
                </form>
            )}

            {activeForm === "Criteria" && (
                <form action=""
                className='flex flex-col justify-center'
                >
                    <label htmlFor="programID" className='mb-2 text-xl font-semibold'>Program</label>

                    <select name="programID" id="programID"           
                        value={programID}             
                        onChange={handleChange}
                         className='p-2 mb-3 transition-all duration-500 cursor-pointer inset-shadow-sm inset-shadow-gray-400 dark:shadow-zuccini-900 dark:shadow-md dark:bg-gray-900 bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 '
                        required>
                        <option value="" >Select a Program</option>
                        {programOption.map((program) => {
                            return(
                                <option key={program.programID} value={program.programID}>{program.programName}</option>
                            )
                        })}
                    </select>

                    <label htmlFor="selectedAreaID" className='mb-2 text-xl font-semibold'>Area</label>

                    <select name="selectedAreaID" id="selectedAreaID"           
                        value={selectedAreaID}             
                        onChange={(e)=> {setSelectedAreaID(e.target.value)}}
                         className='p-2 mb-3 transition-all duration-500 cursor-pointer inset-shadow-sm inset-shadow-gray-400 dark:shadow-zuccini-900 dark:shadow-md dark:bg-gray-900 bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 '
                        required>
                        <option value="" >Select Designated Area</option>
                        {areaOption.map((area) => {
                            return(
                                <option key={area.areaID} value={area.areaID}>{area.areaName}</option>
                            )
                        })}
                    </select>
                  

                <div className='flex flex-row items-center justify-between gap-5 py-1'>
                    <div className='flex gap-2'>
                    <label htmlFor="subareaID" className='mt-1 text-xl font-semibold'>Sub-Area</label>
                    <select name="subareaID" type="text"                         
                        value={selectedSubAreaID}
                        onChange={(e) => {setSelectedSubAreaID(e.target.value)}}
                         className='p-2 mb-3 transition-all duration-500 cursor-pointer inset-shadow-sm inset-shadow-gray-400 dark:shadow-zuccini-900 dark:shadow-md dark:bg-gray-900 bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 '
                        required>
                        
                        <option value="">Select Designated Sub-Area</option>
                        {subAreaOption.map((subareas) => (
                            <option key={subareas.subareaID} value={subareas.subareaID}>{subareas.subareaName}</option>
                        ))}

                    </select>
                    </div>
                    
                    <div className='flex gap-2 place-self-end'>
                    <label htmlFor="criteriaType" className='mt-1 text-xl font-semibold '>Criteria Type</label>
                    <select name="criteriaType" id="criteriaType"
                        value={criteriaType}
                        onChange={(e) => {setCriteriaType(e.target.value)}}
                         className='p-2 mb-3 transition-all duration-500 cursor-pointer inset-shadow-sm inset-shadow-gray-400 dark:shadow-zuccini-900 dark:shadow-md dark:bg-gray-900 bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 '
                        required>
                        <option value="">Select Criteria Type</option>
                        <option value="Inputs">Inputs</option>
                        <option value="Processes">Processes</option>
                        <option value="Outcomes">Outcomes</option>
                    </select>
                    </div>
                </div>

                    <label htmlFor="criteria" className='mb-2 text-xl font-semibold'>Criteria</label>
                    <textarea name="criteria" type="text" 
                        placeholder="Enter the criteria"
                        value={criteria}
                        onChange={(e) => {setCriteria(e.target.value)}}
                         className='p-2 mb-3 transition-all duration-500 cursor-pointer inset-shadow-sm inset-shadow-gray-400 dark:shadow-zuccini-900 dark:shadow-md dark:bg-gray-900 bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 '
                        required/>

            </form>
            )}
            
            
        </div>
        

        <div className='flex justify-between'>
             <button className="p-3 text-2xl text-white cursor-pointer px-15 place-self-end rounded-xl bg-neutral-600 hover:bg-neutral-500" onClick={onClick}>Back</button>
             <button className="p-3 text-2xl text-white cursor-pointer px-15 place-self-end rounded-xl bg-zuccini-600 hover:bg-zuccini-500" 
             onClick={activeForm === "Area" ? handleCreateArea : activeForm === "Sub-Area" ? handleCreateSubArea : handleCreateCriteria}
             >Create</button>
            
        </div>
       
    </div>
</div>
)
}

export default SelfRateModal;