//for imports
import CircularProgressBar from '../components/CircularProgressBar'
import {useState, useEffect} from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
// the progress bar is currently static  

const Tasks = () => {

    const [deadLines, setDeadLines] = useState([]);
    const [event, setEvent] = useState([]); //used for the calendar
    
    const [dueDate, setDueDate] = useState("");
    const [program, setProgram] = useState("")
    const [content, setContent] = useState("");

    const [programOption, setProgramOption] = useState([]); // for the form option

    const [selectedArea, setSelectedArea] = useState(""); // area use state
    const [areaOption, setAreaOption] = useState([]); // for the form option
    const [areaProgressList, setAreaProgressList] = useState([]); // displays the area in tasks
    const token = localStorage.getItem('token'); //gets the token


    // FETCH PROGRAM
    useEffect(() => {
        if(!token){
            console.error("No token found!");
            return;
        }

        const fetchProgram = async () => {

            if(!token){
            console.error("No token found!");
            return;
        }
            
            try{

                const res = await axios.get('http://localhost:5000/api/program', 
                    {headers: {'Authorization': `Bearer${token}`}},
                    {withCredentials: true}
                )

                Array.isArray(res.data.programs) ? setProgramOption(res.data.programs) : setProgramOption([]);

            } catch(err){
                console.error("Error occurred when fetching program", err)
            }
        }
        fetchProgram();
    }, []);

    // FETCH AREA
    useEffect(() => {
        if(!token){
            console.error("No token found!");
            return;
        }

        const fetchArea = async () => {
            
            try{
                const res = await axios.get('http://localhost:5000/api/area', 
                    {headers: {'Authorization': `Bearer ${token}`}}, {withCredentials: true})

                Array.isArray(res.data.area) ? setAreaOption(res.data.area) : setAreaOption([]);
                Array.isArray(res.data.area) ? setAreaProgressList(res.data.area) : setAreaProgressList([]);
                    
            } catch(err){

            }
        }
        fetchArea();
    }, []);

    useEffect(() => {
        
        if(!token){
            console.error("No token found!");
            return;
        }

        const fetchDeadline = async () => {

            try{

            const res = await axios.get("http://localhost:5000/api/deadlines", 
                {headers:{'Authorization': `Bearer${token}`}}, {withCredentials: true})

                Array.isArray(res.data.deadline) ? setDeadLines(res.data.deadline) : setDeadLines([]);   
                

            } catch (err){
                console.error("Error occurred when fetching deadlines! ", err)
            }
        };
        fetchDeadline();

    }, [])

    useEffect(() => {
        
        if(!token){
            console.error("No token found!");
            return;
        }

        const fetchEvents = async () => {

            try{

            const res = await axios.get("http://localhost:5000/api/events", 
                {headers:{'Authorization': `Bearer${token}`}}, {withCredentials: true})

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

        const formData = new FormData()
            formData.append("program", program)
            formData.append("area", selectedArea)
            formData.append("due_date", dueDate)
            formData.append("content", content)

        try{
            //create deadline api
            const res = await axios.post('http://localhost:5000/api/deadline', formData, 
                {headers: {'Authorization': `Bearer ${token}`}}, {withCredentials: true}) 

                alert(res.data.message)

                setSelectedArea("");
                setProgram("");
                setContent("");
                setDueDate("");

            // refetch deadline data
            const deadlineRes = await axios.get("http://localhost:5000/api/deadlines", 
                {headers:{'Authorization': `Bearer${token}`}}, {withCredentials: true})

                Array.isArray(deadlineRes.data.deadline) ? setDeadLines(deadlineRes.data.deadline) : setDeadLines([]);   
            
            // refetch event data
            const eventRes = await axios.get("http://localhost:5000/api/events", 
                {headers:{'Authorization': `Bearer${token}`}}, {withCredentials: true})

                Array.isArray(eventRes.data) ? setEvent(eventRes.data) : setEvent([]);   
            



        }catch(err){
            alert("Server error. Please try again");
            console.log(err.res?.data || err.message)
        }

    } 

    return(
        
    <>    
    {/* Container */}
    <div className="relative w-full bg-neutral-100 p-5 border-2 border-neutral-700 text-neutral-800 rounded-2xl dark:border-none dark:bg-[#19181A] dark:inset-shadow-sm dark:inset-shadow-zuccini-900">

        {/* Area Progress */}
        <h1 className="mx-3 mb-3 text-xl font-semibold transition-all duration-500 dark:text-white">Area Progress</h1>
        <section className="relative grid grid-cols-3 gap-2 p-3 min-h-[220px] text-neutral-800 border-1 border-neutral-900 rounded-lg shadow-2xl overflow-hidden dark:bg-woodsmoke-950 dark:inset-shadow-sm dark:inset-shadow-zuccini-900">
            {/* Areas */}

        {areaProgressList && areaProgressList.length > 0 ? (
        <>
        
        {areaProgressList.map((area) => (                
            <Area key={area} areaTitle={area.areaNum} desc={area.areaName} program={area.programCode} progress={area.progress}/>)
        )}
            <div className='absolute right-0 col-start-3 flex items-center justify-center min-w-[275px] h-full overflow-hidden opacity-90 transition-all duration-500 hover:min-w-[278px] hover:opacity-95 hover:scale-110 bg-gradient-to-r from-transparent via-neutral-800 to-neutral-900 cursor-pointer'>
                    <h1 className='z-10 text-xl font-semibold text-neutral-200'>View All</h1>
                </div>
        </>        
    ) : (
            <p className="col-span-3 m-auto text-lg text-center text-gray-500 font-extralight">No areas found.</p> 
        )}
        

        </section>

{/* Reports */}
<h1 className="mx-3 mt-5 mb-3 text-xl font-semibold dark:text-white">Reports</h1>
    <section className="grid grid-cols-2 grid-rows-[auto_1fr] relative p-3 gap-5 text-neutral-800 border-1 border-neutral-900 rounded-lg shadow-xl transition-all duration-500 dark:inset-shadow-sm dark:inset-shadow-zuccini-900 dark:bg-woodsmoke-950">
    {/* Create Deadlines */}
    <div className="col-span-2 transition-all duration-500 dark:text-white">
        <h1 className="mx-3 mb-1 font-medium text-md">Create Submission Deadlines</h1>
            <div className="col-span-2 min-h-[100px] border rounded-md transition-all duration-500 dark:border-none dark:inset-shadow-sm dark:inset-shadow-zuccini-900 dark:bg-[#19181A]">
                <form onSubmit={handleCreateDeadline}
                className='grid grid-cols-4 gap-x-2'>


                    {/* Select Department */}
                    <div className="min-h-[100px] p-3 flex flex-col justify-center">
                    <label htmlFor ="program"
                    className='mb-1 `text-lg font-extralight'>Program</label>

                    <select name="program" id="program"
                        value={program}
                        onChange={(e)=> {setProgram(e.target.value)}}
                        className='p-2 font-semibold transition-all duration-500 cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-woodsmoke-950'
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
                        className='p-2 font-semibold transition-all duration-500 cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-woodsmoke-950'
                        required>
                        <option value="">Select an Area</option>
                        {areaOption.map((area) => {
                            return(
                                <option key={area.areaID} value={area.areaID}>{area.areaNum}</option>
                            )
                        }
                        )}
                    </select>
                    </div>


                    {/* Select Deadline */}
                    <div className="min-h-[100px] p-3 flex flex-col justify-center">
                        <label htmlFor="due_date"
                        className='mb-1 text-lg font-extralight'>Deadline</label>
                        <input type="date" name="due_date" id="due_date"
                            value={dueDate}
                            onChange={(e)=> {setDueDate(e.target.value)}}
                            className='p-2 font-semibold transition-all duration-500 border cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-woodsmoke-950' 
                            required/>  
                    </div>


                    {/* Create Deadline Btn*/}
                    <input 
                    type="submit" 
                    value="Create Deadline"
                    className='px-6 py-4 font-semibold transition-all duration-300 cursor-pointer place-self-center rounded-xl bg-zuccini-600 hover:bg-zuccini-800 active:bg-zuccini-700 text-neutral-100'
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
                        className='scrollbar-hide placeholder-neutral-500 whitespace-pre-line resize-y w-full min-h-[200px] px-4 py-3 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-woodsmoke-950 dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none'       
                        />
                    </div>
                
                </form>
            </div>
    </div>
        
    {/* Deadlines */}
        <div className="flex items-center flex-col row-start-2 p-3 border rounded-md relative dark:bg-[#19181A] dark:inset-shadow-sm dark:inset-shadow-zuccini-900">                    
            <div className='grid w-full grid-cols-3 font-medium text-center dark:text-white '>
                <h2>Task</h2>
                <h2>Deadline</h2>
            </div>
            {/* Deadline container */}
            <div className='flex flex-col items-center mt-2 min-h-[500px] min-w-full p-1 bg-neutral-300 rounded-md border relative dark:bg-woodsmoke-950 ' >
                {deadLines && deadLines.length > 0 ? deadLines.map((deadline) => (
                    <Deadline key={deadline.deadlineID} data={deadline} areaTitle={deadline.areaName} date={deadline.due_date} />
                )) : (
                        <p className="m-auto text-lg text-center text-gray-500 font-extralight">No deadlines ahead.</p>
                )
                }            
            </div>
        </div>

    
    {/* Calendar */}
        <div className="row-start-2 col-start-2 bg-transparent border rounded-md p-5 transition-all duration-500 dark:inset-shadow-sm dark:inset-shadow-zuccini-900 dark:text-white dark:bg-[#19181A] dark:border-none">
            <FullCalendar 
            plugins={[dayGridPlugin]}
            initialView='dayGridMonth'
            headerToolbar={{
                start: 'title',
                center: '',
                end: 'today prev next'
            }}
            events={event}        
            eventClick={(info) => {
                alert(`Program: ${info.event.title}\nDate: ${info.event.startStr}`);
                }}
            height={'500px'}                    
            expandRows={true}
            
            />

        </div>

    </section>
    </div>            
    </>
    )
};


//Generates the areas

export const Area = ({program, areaTitle, desc, progress}) =>{

    return(
        <div className="relative mr-4 min-w-[300px] h-[210px] border-black border rounded-lg shadow-lg overflow-hidden transition-all duration-500 hover:scale-105 cursor-pointer">
            <div className='h-[50%] bg-zuccini-600'> 
                <div className='absolute top-2 right-2 px-5 bg-neutral-200 border-black border rounded-xl font-light dark:bg-[#19181A] dark:text-white'>{program}</div>
                <CircularProgressBar progress={progress} circleWidth="75"/>           
            </div>      

            <div className='text-right h-[50%] p-3 bg-neutral-200 border-t-1 transition-all duration-500  dark:bg-[#19181A] dark:text-white dark:border-t-neutral-600'>
                <h1 className='mb-4 text-2xl font-semibold text-wrap'>{areaTitle}</h1>
                <h2 className='text-lg truncate'>{desc}</h2>
            </div>
        </div> 
        
    )
}

// Generates due_date

export const Deadline = ({areaTitle, date}) =>{

    return(
        <div className='grid grid-cols-3 justify-center mt-2 border p-2 rounded-lg bg-neutral-200 transition-all duration-500 dark:bg-[#19181A]'>
            <h2 className='text-sm font-light transition-all duration-500 place-self-center text-neutral-600 text-wrap dark:text-white'>{areaTitle}</h2>
            <h2 className='text-sm transition-all duration-500 place-self-center text-neutral-600 dark:text-white'>{date}</h2>
            <button className='px-10 py-3 m-auto font-semibold transition-all duration-300 border-2 cursor-pointer text-neutral-100 bg-zuccini-600 border-zuccini-700 hover:bg-zuccini-700 active:bg-zuccini-600 rounded-xl'>View</button>

        </div>
    )
}

export default Tasks;