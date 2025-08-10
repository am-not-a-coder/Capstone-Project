import { useEffect, useState } from 'react';
import axios from 'axios';
import StatusModal from './StatusModal';



const CreateModal = ({onClick, onCreate, setShowCreateModal}) => {

const [programID, setProgramID] = useState();
const [areaNum, setAreaNum] = useState('');
const [areaName, setAreaName] = useState('');

const [subAreaName, setSubAreaName] = useState('');
const [criteria, setCriteria] = useState('');
const [criteriaType, setCriteriaType] = useState('Input/s'); // input, process, outcome

const [selectedAreaID, setSelectedAreaID] = useState()
const [selectedSubAreaID, setSelectedSubAreaID] = useState()

const [activeForm, setActiveForm] = useState("Area")
const [programOption, setProgramOption] = useState([]);
const [areaOption, setAreaOption] = useState([]);
const [subAreaOption, setSubAreaOption] = useState([]);

const token = localStorage.getItem("token");

const [showStatusModal, setShowStatusModal] = useState(false); // shows the status modal
const [statusMessage, setStatusMessage] = useState(null); // status message
const [statusType, setStatusType] = useState("success"); // status type (success/error)


    //fetch Program
    useEffect(() => {
    const fetchProgram = async () => {
        if (!token){
            alert("No token found!");
            return;
        }

        try{
        const res = await axios.get('http://localhost:5000/api/program', 
                        {headers: {'Authorization': `Bearer${token}`}},
                        {withCredentials: true}
                    )
            Array.isArray(res.data.programs) ? setProgramOption(res.data.programs) : setProgramOption([]);
            console.log(res.data.programs)
        } catch (err){
            console.error("Error occurred when fetching program", err)
        }
    }
    fetchProgram();

    }, [])
    //fetch Area
    useEffect(() => {
            if(!token){
                console.error("No token found!");
                return;
            }
    
            const fetchArea = async () => {
                
                try{
                    const res = await axios.get('http://localhost:5000/api/accreditation', 
                        {headers: {'Authorization': `Bearer ${token}`}}, {withCredentials: true})
    
                    Array.isArray(res.data) ? setAreaOption(res.data) : setAreaOption([]);
                    
                } catch(err){
    
                }
            }
            fetchArea();
        }, []);
    //fetch Sub-area

    useEffect(() => {
         if (!token){
            alert("No token found!");
            return;
        }

        const fetchSubArea = async () =>{
            try{
                const res = await axios.get('http://localhost:5000/api/subarea', 
                    {headers: {'Authorization': `Bearer ${token}`}}, {withCredentials: true})

                Array.isArray(res.data.subarea) ? setSubAreaOption(res.data.subarea) : setSubAreaOption([]);
            } catch(err){
                console.error("Error occurred when fetching sub-area", err)
            }
        }
    fetchSubArea();
    }, []);

    const handleCreateArea = async (e) => {
        e.preventDefault();
        
        const formData = new FormData()
            formData.append("programID", programID)
            formData.append("areaNum", areaNum)
            formData.append("areaName", areaName)

        try{
            const response = await axios.post('http://localhost:5000/api/accreditation/create_area', formData,
                {headers: {'Authorization': `Bearer ${token}`}}, {withCredentials: true});

            //shows the status of creation
            setShowStatusModal(true)
            setStatusMessage(response.data.message)
            setStatusType("success")

            // Clear inputs and refresh areas after success    
            setProgramID('')
            setAreaNum('');
            setAreaName('');    
            if (onCreate) onCreate(); // refreshes the areas

            

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
            
            const response = await axios.post('http://localhost:5000/api/accreditation/create_subarea', formData,
                {headers: {'Authorization': `Bearer ${token}`}}, {withCredentials: true});

            
            // Clear inputs and refresh areas after success    
            setSelectedAreaID('')
            setSubAreaName('');
            if (onCreate) onCreate(); // refreshes the areas

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
        formData.append("selectedSubAreaID", selectedAreaID)
        formData.append("criteriaType", criteriaType)
        formData.append("criteria", criteria)

        try{
            const response = await axios.post('http://localhost:5000/api/accreditation/create_criteria', formData,
                {headers: {'Authorization': `Bearer ${token}`}}, {withCredentials: true});

            // Clear inputs and refresh areas after success    
            setSelectedAreaID('')
            setSelectedSubAreaID('')
            setCriteriaType('Input/s')
            setCriteria('')
            if (onCreate) onCreate(); // refreshes the areas

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

    const handleCloseModal = () => {
        setShowStatusModal(false)
        setShowCreateModal(false)

    }


return(

<div className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 transform scale-100 bg-black/60 backdrop-blur-sm">

    {showStatusModal && (
        <StatusModal message={statusMessage} type={statusType} onClick={handleCloseModal}  />

    )}

    <div className={`flex flex-col relative px-5 py-3 min-w-[700px] text-black bg-neutral-200 border-t-10 border-zuccini-400 shadow-2xl rounded-xl dark:bg-[#19181A] dark:inset-shadow-sm dark:inset-shadow-zuccini-900 transition`}>
        <h1 className="mb-3 text-3xl text-black text-shadow-sm dark:text-white">Create {activeForm} </h1>
        <div>
            <button className={`${activeForm == "Area" ? 'border-b-2 border-zuccini-600 font-semibold bg-neutral-300 dark:bg-neutral-800 dark:text-white' : 'border-0 font-normal'} dark:text-white rounded-t-lg text-lg py-2 px-5 mb-2`} onClick={() => setActiveForm("Area")}>Area</button>
            <button className={`${activeForm == "Sub-Area" ? 'border-b-2 font-semibold border-zuccini-600 bg-neutral-300 dark:bg-neutral-800 dark:text-white' : 'border-0 font-normal'} dark:text-white rounded-t-lg text-lg py-2 px-5 mb-2`} onClick={() => setActiveForm("Sub-Area")}>Sub-Area</button>
            <button className={`${activeForm == "Criteria" ? 'border-b-2 border-zuccini-600 font-semibold bg-neutral-300 dark:bg-neutral-800 dark:text-white' : 'border-0 font-normal'} dark:text-white rounded-t-lg text-lg py-2 px-5 mb-2`} onClick={() => setActiveForm("Criteria")}>Criteria</button>
        </div>

        <div className="px-3 pt-3 mb-5 dark:text-white bg-neutral-300 rounded-xl min-h-[325px] border-2 border-zuccini-900 dark:border-none focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:bg-woodsmoke-950">
        
            {activeForm === "Area" && ( 
                <form action=""
                onSubmit={handleCreateArea}
                className='flex flex-col justify-center '
                >
                    <label htmlFor ="programID" className='mb-2 text-xl font-semibold'>Program</label>

                    <select name="programID" id="programID"
                        value={programID}
                        onChange={(e)=> {setProgramID(e.target.value)}}
                        className='p-2 mb-3 transition-all duration-500 cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none dark:bg-[#19181A] bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 '
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
                        className='p-2 mb-3 transition-all duration-500 cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A]'
                        required/>
                    
                    <label htmlFor="areaName" className='text-xl font-semibold'>Area Name</label>
                    <input name="areaName" type="text" 
                        placeholder="Enter the area name"
                        value={areaName}
                        onChange={(e) => {setAreaName(e.target.value)}}
                        className='p-2 mb-3 transition-all duration-500 cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A]'
                        required
                    />

                </form>
            )}
            {activeForm === "Sub-Area" && (
                <form action=""
                className='flex flex-col justify-center'
                >
                    <label htmlFor="selectedAreaID" className='mb-2 text-xl font-semibold'>Assign Area</label>

                    <select name="selectedAreaID" id="selectedAreaID"           
                        value={selectedAreaID}             
                        onChange={(e)=> {setSelectedAreaID(e.target.value)}}
                        className='p-2 mb-3 transition-all duration-500 cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A]'
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
                        className='p-2 mb-3 transition-all duration-500 cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-woodsmoke-950'
                        required/>
                    
                </form>
            )}

            {activeForm === "Criteria" && (
                <form action=""
                className='flex flex-col justify-center'
                >
                    <label htmlFor="selectedAreaID" className='mb-2 text-xl font-semibold'>Area</label>

                    <select name="selectedAreaID" id="selectedAreaID"           
                        value={selectedAreaID}             
                        onChange={(e)=> {setSelectedAreaID(e.target.value)}}
                        className='p-2 mb-3 transition-all duration-500 cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A]'
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
                        placeholder="Enter the sub-area name"
                        value={selectedSubAreaID}
                        onChange={(e) => {setSelectedSubAreaID(e.target.value)}}
                        className='p-2 transition-all duration-500 cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A]'
                        required>
                        
                        <option value="">Select Designated Sub-Area</option>
                        {subAreaOption.map((subarea) => (
                            <option key={subarea.subareaID} value={subarea.subareaID}>{subarea.subareaName}</option>
                        ))}

                    </select>
                    </div>
                    
                    <div className='flex gap-2 place-self-end'>
                    <label htmlFor="criteriaType" className='mt-1 text-xl font-semibold '>Criteria Type</label>
                    <select name="criteriaType" id="criteriaType"
                        value={criteriaType}
                        onChange={(e) => {setCriteriaType(e.target.value)}}
                        className='p-2 transition-all duration-500 cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A]'
                        required>
                        <option value="">Select Criteria Type</option>
                        <option value="Input/s">Input/s</option>
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
                        className='whitespace-pre p-2 mb-3 transition-all min-h-[100px] duration-500 cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A]'
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

export default CreateModal;