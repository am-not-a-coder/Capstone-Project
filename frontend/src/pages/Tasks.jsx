//for imports
import CircularProgressBar from '../components/CircularProgressBar'
import {useState, useEffect} from 'react';
import {
    faAngleRight,
    faCalendarPlus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import EventModal from '../components/modals/EventModal';
import { adminHelper, getCurrentUser } from '../utils/auth_utils';
import { useNavigate } from 'react-router-dom';
import AreaProgressPage from './AreaProgress';

const Tasks = () => {
    //admin
    const isAdmin = adminHelper()
    const user = getCurrentUser()

    const [deadLines, setDeadLines] = useState([]); // used to list the deadlines 
    const [event, setEvent] = useState([]); //used for the calendar
    
    //states for the input values
    const [dueDate, setDueDate] = useState("");
    const [program, setProgram] = useState("");
    const [content, setContent] = useState("");
    const [criteria, setCriteria] = useState("");
    
    const [criteriaOption, setCriteriaOption] = useState("");

    const [programOption, setProgramOption] = useState([]); // for the form option
    const [selectedProgram, setSelectedProgram] = useState(null);

    const [selectedArea, setSelectedArea] = useState(""); // area use state
    const [allAreas, setAllAreas]= useState([]);
    const [filteredAreaOptions, setFilteredAreaOptions] = useState([]);
    const [areaProgressList, setAreaProgressList] = useState([]); // displays the area in tasks

    const [showEventModal, setShowEventModal] = useState(false); // shows the event modal
    const [selectedEvent, setSelectedEvent] = useState(null); // selected event in the calendar
    
    const [showStatusModal, setShowStatusModal] = useState(false); // shows the status modal
    const [statusMessage, setStatusMessage] = useState(null); // status message
    const [statusType, setStatusType] = useState("success"); // status type (success/error)

    const [showDeadline, setShowDeadline] = useState(false);
    const [selectedDeadline, setSelectedDeadline] = useState(null);

    const navigate = useNavigate()

   

    // FETCH PROGRAM
    useEffect(() => {

        const fetchProgram = async () => {
            
            try{

                const res = await apiGet('/api/program', {withCredentials: true})

                Array.isArray(res.data.programs) ? setProgramOption(res.data.programs) : setProgramOption([]);

            } catch(err){
                console.error("Error occurred when fetching program", err)
            }
        }
        fetchProgram();
    }, []);

    // FETCH AREA
    useEffect(() => {

        const fetchArea = async () => {
            
            try{
                const res = await apiGet('/api/area', {withCredentials: true})

                Array.isArray(res.data.area) ? setAllAreas(res.data.area) : setAllAreas([]);
                Array.isArray(res.data.area) ? setAreaProgressList(res.data.area) : setAreaProgressList([]);
                    
            } catch(err){
                console.error("Failed to fetch area", err);
            }
        }
        fetchArea();
    }, []);

    // FETCH CRITERIA
    useEffect(() => {
        const fetchCriteria = async () => {
            try{
                const res = await apiGet('/api/criteria', {withCredentials: true})
                
                // Fix: Use the correct property name from your API response
                Array.isArray(res.data) ? setCriteriaOption(res.data) : setCriteriaOption([]);                
                    
            } catch(err){
                console.error("Failed to fetch criteria", err);
            }
        }
        fetchCriteria();
    }, []);

    const [filteredCriteriaOptions, setFilteredCriteriaOptions] = useState([]);

    useEffect(() => {
        if(selectedArea && criteriaOption.length > 0) {
            // Filter criteria based on the selected area
            // You'll need to adjust this logic based on how your criteria relates to areas
            // For now, showing all criteria when an area is selected
            setFilteredCriteriaOptions(criteriaOption);
        } else {
            setFilteredCriteriaOptions([]);
        }
    }, [selectedArea, criteriaOption]);

    // FETCH DEADLINES
    useEffect(() => {
        
        const fetchDeadline = async () => {

            try{

            const res = await apiGet("/api/deadlines", {withCredentials: true})

                Array.isArray(res.data.deadline) ? setDeadLines(res.data.deadline) : setDeadLines([]);   
                

            } catch (err){
                console.error("Error occurred when fetching deadlines! ", err)
            }
        };
        fetchDeadline();

    }, [])

    // FETCH EVENTS (FOR CALENDAR)
    useEffect(() => {

        const fetchEvents = async () => {

            try{

            const res = await apiGet("/api/events", {withCredentials: true})

                Array.isArray(res.data) ? setEvent(res.data) : setEvent([]);   
                

            } catch (err){
                console.error("Error occurred when fetching events! ", err)
            }
        };
        fetchEvents();

    }, [])

    // Creates the deadline
    const handleCreateDeadline = async (e) => {
            e.preventDefault()
            if (!isAdmin || !user.isCoAdmin) return 
            const formData = new FormData()
                formData.append("program", program)
                formData.append("area", selectedArea)
                formData.append("criteriaID", criteria) // Add this line to include criteria ID
                formData.append("due_date", dueDate)
                formData.append("content", content)

            try{
                //create deadline api
                const res = await apiPost('/api/deadline', formData, 
                {withCredentials: true}) 

                    setStatusMessage(res.data.message);
                    setShowStatusModal(true);
                    setStatusType("success");

                    setSelectedArea("");
                    setProgram("");
                    setContent("");
                    setCriteria("")
                    setDueDate("");

                // refetch deadline data
                const deadlineRes = await apiGet("api/deadlines", {withCredentials: true})

                    Array.isArray(deadlineRes.data.deadline) ? setDeadLines(deadlineRes.data.deadline) : setDeadLines([]);   
                
                // refetch event data
                const eventRes = await apiGet("/api/events", 
                    {withCredentials: true})

                    Array.isArray(eventRes.data) ? setEvent(eventRes.data) : setEvent([]);   

            }catch(err){
                setStatusMessage("Server error. Please try again");
                setShowStatusModal(true);
                setStatusType("error")
            }
        } 
    
    const handleEventClick = (clickInfo) => {

        setSelectedEvent({
            title: clickInfo.event.title,
            date: clickInfo.event.startStr,
            color: clickInfo.event.extendedProps.color,
            content: clickInfo.event.extendedProps.content,
            
        })
        setShowEventModal(true);
    }

    const handleCloseModal = () =>{
        setSelectedEvent(null);
        setShowEventModal(false);
    }


    const handleViewDeadline = (selectedDeadline) => {    
        const criteriaItem = criteriaOption.find(
            c => c.criteriaID === selectedDeadline.criteriaID
        );
        
        const criteriaName = criteriaItem ? criteriaItem.criteriaName : 'N/A';

        setSelectedDeadline({
            id: selectedDeadline.deadlineID,
            programName: selectedDeadline.programName,
            programCode: selectedDeadline.programCode,
            color: selectedDeadline.programColor,
            criteriaName: criteriaName,
            areaName: selectedDeadline.areaName,
            date: selectedDeadline.due_date,
            content: selectedDeadline.content
        })
        setShowDeadline(true);
    }

    const handleCloseDeadline = () =>{
        setSelectedDeadline(null);
        setShowDeadline(false);
    }

    const uniqueAreas = areaProgressList.filter((area, index, self) => index === self.findIndex(a => a.areaID === area.areaID))
    
    useEffect(()=> {
        if(program){
            const filteredAreas = allAreas.filter(
            (area) => String(area.programID) === String(program)
            );
            setFilteredAreaOptions(filteredAreas);
            setSelectedArea("");
        } else {
            setFilteredAreaOptions([]);
        }
    }, [program, allAreas]);
   
    const truncateText = (text, maxLength = 50) => {
        if (text?.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    

    return(
        
    <>    
    {/* shows status when creating deadline */}
    {showStatusModal && (
        <StatusModal message={statusMessage} type={statusType} showModal={showStatusModal} onClick={()=>setShowStatusModal(false)} />
    )}

    {/* Container */}
    <div className="relative w-full p-5 border bg-neutral-200 border-neutral-300 text-neutral-800 rounded-[20px] inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-900 dark:shadow-sm dark:shadow-zuccini-900">

        {/* Area Progress */}
        <h1 className="mx-3 mb-3 text-xl font-semibold transition-all duration-500 dark:text-white">Area Progress</h1>
        <section className="relative grid grid-cols-3 gap-2 p-3 min-h-[220px] text-neutral-800 border-1 border-gray-400 rounded-lg shadow-2xl overflow-hidden dark:bg-gray-950/50 dark:shadow-md dark:shadow-zuccini-900">
            {/* Areas */}

        {areaProgressList && areaProgressList.length > 0 ? (
        <>
        
        {uniqueAreas.slice(0,3).map((area) => (                
            <Area 
                key={area.areaID} 
                areaTitle={area.areaNum} 
                desc={area.areaTitle} 
                program={area.programCode} 
                progress={area.progress}
            />
        )
        )}
            <div 
            onClick={() => navigate('/Progress')}
            className='absolute right-0 col-start-3 flex items-center justify-center min-w-[275px] h-full overflow-hidden opacity-90 transition-all duration-500 hover:min-w-[278px] hover:opacity-95 hover:scale-110 bg-gradient-to-r from-transparent via-neutral-800 to-neutral-900 dark:bg-gradient-to-r dark:from-transparent dark:via-gray-800 dark:to-gray-900 cursor-pointer'>
                    <h1 className='z-10 text-xl font-semibold text-neutral-200'>View All</h1>
                </div>
        </>        
    ) : (
            <p className="col-span-3 m-auto text-lg text-center text-gray-500 font-extralight">No areas found.</p> 
        )}
        

        </section>

{/* Reports */}
<h1 className="mx-3 mt-5 mb-3 text-xl font-semibold dark:text-white">Reports</h1>
    <section className="grid grid-cols-2 grid-rows-[auto_1fr] relative p-3 gap-5 text-neutral-800 border-1 border-neutral-300 rounded-lg shadow-xl transition-all duration-500 dark:shadow-sm dark:shadow-zuccini-800" >
    {/* Create Deadlines */} {/* admin */}
    
    { (isAdmin || user.isCoAdmin) &&(<div className="col-span-2 transition-all duration-500 dark:text-white" >
        
            <div className="relative col-span-2 pt-3 px-3 min-h-[100px] border border-neutral-300 rounded-md transition-all duration-500 inset-shadow-sm inset-shadow-gray-400 dark:shadow-sm dark:shadow-zuccini-900 dark:bg-gray-900" >
                <h1 className="mx-3 my-1 font-medium text-md">
                    <FontAwesomeIcon icon={faCalendarPlus} className="mr-2" />
                    Create Submission Deadlines
                </h1>
                <form onSubmit={handleCreateDeadline}
                className='grid grid-cols-4 gap-x-2'>


                    {/* Select Department */}
                    <div className="min-h-[100px] p-3 flex flex-col justify-center">
                    <label htmlFor ="program"
                    className='mb-1 `text-lg font-extralight'>Program</label>

                    <select name="program" 
                        id="program"
                        value={program}
                        onChange={(e)=> {setProgram(e.target.value)}}
                        className='p-2 font-semibold transition-all duration-500 cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-gray-950/50'
                        required>
                        <option value="">Select a Program</option>

                        {programOption.map((program) => {
                            return(
                                <option key={program.programID} value={program.programID}>{program.programName}</option>
                            )
                        })}
                    </select>
                    </div>


                    {/* Select Area */}
                    <div className="min-h-[100px] p-3 flex flex-col justify-center">
                    <label htmlFor="area"
                        className='mb-1 text-lg font-extralight'>Area</label>
                    <select name="area" id="area"
                        value={selectedArea}
                        onChange={(e)=> {setSelectedArea(e.target.value)}}
                        className='p-2 font-semibold transition-all duration-500 cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-gray-950/50'
                        required>
                        <option value="">Select an Area</option>
                        {filteredAreaOptions.filter((area, index, self) => 
                        index === self.findIndex(a => a.areaID === area.areaID))
                        .map((area) => (
                            <option key={area.areaID} value={area.areaID}>
                            {area.areaName}
                            </option>
                        ))}
                    </select>
                    </div>

                    {/* Select Criteria */}
                    {/* <div className="min-h-[100px] p-3 flex flex-col justify-center">
                        <label htmlFor="criteria"
                            className='mb-1 text-lg font-extralight'>Criteria</label>
                        <select name="criteria" id="criteria"
                            value={criteria}
                            onChange={(e)=> {setCriteria(e.target.value)}}
                            className='p-2 font-semibold transition-all duration-500 cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-gray-950/50'
                            required>
                            <option value="">Select a Criteria</option>
                            {filteredCriteriaOptions.map((criteriaItem) => (
                                <option key={criteriaItem.criteriaID} value={criteriaItem.criteriaID}>
                                    {truncateText(criteriaItem.criteriaName)}
                                </option>
                            ))}
                        </select>
                    </div> */}


                    {/* Select Criteria */}
                    <div className="min-h-[100px] p-3 flex flex-col justify-center">
                        <label htmlFor="due_date"
                        className='mb-1 text-lg font-extralight'>Deadline</label>
                        <input type="date" name="due_date" id="due_date"
                            value={dueDate}
                            onChange={(e)=> {setDueDate(e.target.value)}}
                            className='p-2 font-semibold transition-all duration-500 border cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-gray-950/50' 
                            required/>  
                    </div>


                    {/* Create Deadline Btn*/}
                    <input 
                    type="submit" 
                    value="Create Deadline"
                    className='px-6 py-2 font-semibold text-gray-600 transition-colors duration-500 border-gray-500 shadow-xl cursor-pointer from-gray-300/50 via-gray-200 to-gray-400/50 dark:text-gray-200 hover:text-gray-200 place-self-center rounded-xl bg-gradient-to-br hover:from-zuccini-400 hover:via-zuccini-500 hover:to-zuccini-700 dark:from-gray-800/50 dark:via-gray-700 dark:to-gray-900/50'
                    />
                    <div className='flex flex-col col-span-4 px-3 py-3 '>
                        <label htmlFor="content"
                        className='mb-1 text-lg font-extralight'
                        >Description</label>
                        <textarea name="content" 
                        value={content}
                        id="content"                    
                        placeholder={"Input the deadline description"}
                        onChange={(e)=> {setContent(e.target.value)}}
                        required
                        className='scrollbar-hide placeholder-neutral-500 whitespace-pre-line resize-y w-full min-h-[200px] px-4 py-3 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-gray-950/50 dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none'       
                        />
                    </div>
                
                </form>
            </div>
    </div>)}
        
    {/* Deadlines */}
        <div className="relative flex flex-col items-center row-start-2 p-3 border rounded-md inset-shadow-sm border-neutral-300 inset-shadow-gray-400 dark:bg-gray-900 dark:shadow-sm dark:shadow-zuccini-900">                    
            <div className='grid w-full grid-cols-3 font-medium text-center dark:text-white '>
                <h2>Program</h2>
                <h2>Task</h2>
                <h2>Deadline</h2>
            </div>
            {/* Deadline container */}
            <div className='flex flex-col items-center mt-2 min-h-[500px] border-neutral-400 min-w-full p-1 bg-neutral-300 rounded-md border relative dark:bg-gray-950/50 ' >
                {deadLines && deadLines.length > 0 ? deadLines.map((deadline) => (
                    <Deadline key={deadline.deadlineID} data={deadline} program={deadline.programCode} areaTitle={deadline.areaName} date={deadline.due_date} onClick={() => handleViewDeadline(deadline)}/>
                )) : (
                        <p className="m-auto text-lg text-center text-gray-500 font-extralight">No deadlines ahead.</p>
                )
                }            
            </div>

            {showDeadline && selectedDeadline && (
                <DeadlineModal 
                    programName={selectedDeadline.programName} 
                    programCode={selectedDeadline.programCode} 
                    area={selectedDeadline.areaName} 
                    criteria={truncateText(selectedDeadline.criteriaName)}
                    date={selectedDeadline.date} 
                    color={selectedDeadline.color} 
                    content={selectedDeadline.content || 'No description'} 
                    id={selectedDeadline.id}
                    onClick={handleCloseDeadline}
                    showModal={showDeadline}
                    />
            )}
            
        </div>

    
    {/* Calendar */}
        <div className="relative col-start-2 row-start-2 p-5 transition-all duration-500 bg-transparent border rounded-md border-neutral-300 inset-shadow-sm inset-shadow-gray-400 dark:shadow-sm dark:shadow-zuccini-900 dark:text-white dark:bg-gray-900 ">
            <FullCalendar 
            plugins={[dayGridPlugin]}
            initialView='dayGridMonth'
            headerToolbar={{
                start: 'title',
                center: '',
                end: 'today prev next'
            }}
            events={event}        
            eventClick={handleEventClick}
            height={'500px'}                    
            expandRows={true}
            />

            {/* EventModal */}
            {showEventModal && selectedEvent && (
              <EventModal title={selectedEvent.title} showModal={showEventModal} date={selectedEvent.date} content={selectedEvent.content || 'N/A'} onClick={handleCloseModal} />
            )}

        </div>

    </section>
    </div>            
    </>
    )
};


//Generates the areas

export const Area = ({onClick, program, areaTitle, desc, progress}) =>{

    return(
        <div 
        onClick={onClick}
        className="relative mr-4 min-w-[300px] h-[210px] border-neutral-400 dark:border-neutral-800 border rounded-lg shadow-xl dark:shadow-sm dark:shadow-zuccini-700 overflow-hidden transition-all duration-500 hover:scale-105 cursor-pointer">
            <div className='h-[50%] bg-zuccini-600 dark:bg-zuccini-700'> 
                <div className='absolute px-5 font-light border border-neutral-400 top-2 right-2 bg-neutral-200 rounded-xl dark:bg-gray-900 dark:text-white'>{program}</div>
                <CircularProgressBar progress={progress} circleWidth="75" positionX={"left-3"} positionY={"top-17"} placement={`absolute top-17 left-3`}/>           
            </div>      

            <div className='text-right h-[50%] p-3 bg-neutral-200 border-t-1 transition-all duration-500  dark:bg-gray-900 dark:text-white dark:border-t-neutral-600'>
                <h1 className='mb-4 text-2xl font-semibold text-wrap'>{areaTitle}</h1>
                <h2 className='text-lg truncate'>{desc}</h2>
                
            </div>
        </div> 
        
    )
}

// Generates due_date

export const Deadline = ({program, areaTitle, date, onClick}) => {
    return (
        <div 
            className='relative grid grid-cols-3 justify-center mt-2 border p-2  rounded-lg bg-neutral-200 transition-all duration-500 dark:bg-gray-900 hover:bg-neutral-300 dark:hover:bg-[#232228] cursor-pointer'
            onClick={onClick}
        >
            <div className='flex items-center px-2'>
            <FontAwesomeIcon icon={faAngleRight} className="mr-3 dark:text-white"/>
            <h2 className='mb-1 text-2xl font-semibold tracking-widest text-center transition-all duration-500 text-neutral-600 text-wrap dark:text-white'>{program}</h2>
            </div>
            <h2 className='font-light transition-all duration-500 text-md place-self-center text-neutral-600 text-wrap dark:text-white'>{areaTitle}</h2>
            <h2 className='transition-all duration-500 text-md place-self-center text-neutral-600 dark:text-white'>{date}</h2>
            
            

        </div>
    );
}

export default Tasks;