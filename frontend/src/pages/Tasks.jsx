//for imports
import CircularProgressBar from '../components/CircularProgressBar'
import {useState} from 'react';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
// the progress bar is currently static  

const Tasks = () => {
    //for temp progress control
    const [percentage, setPercentage] = useState(30);
    const deadLines = [
    {
        title: 'Area I-A: Administrative Organization', 
        date: '2025-06-15'
    },
    {
        title: 'Area I-C: Administration of Non-Academic Personnel', 
        date: '2025-06-18' 
    }
];
    
    const area =[
    {
        title: "Area I",
        desc: "Governance and Administration",
        program: "BSIT",
        percentage: 50
    },
    {
        title: "Area I",
        desc: "Faculty",
        program: "BSIT",
        percentage: 30
    },
    {
        title: "Area I",
        desc: "Governance and Administration",
        program: "BSED",
        percentage: 45
    }
    
    ]
    return(
        
        <>
        {/* Container */}
        <div className="relative w-full p-5 border-2 border-neutral-700 text-neutral-800 rounded-2xl dark:border-none dark:bg-[#19181A] dark:inset-shadow-sm dark:inset-shadow-zuccini-900">

            {/* Area Progress */}
            <h1 className="mx-3 mb-3 text-xl font-semibold transition-all duration-500 dark:text-white">Area Progress</h1>
            <section className="relative grid grid-cols-3 gap-2 p-3 min-h-[220px] text-neutral-800 border-1 border-neutral-900 rounded-lg shadow-2xl overflow-hidden dark:bg-woodsmoke-950 dark:inset-shadow-sm dark:inset-shadow-zuccini-900">
                {/* Areas */}

            {area && area.length > 0 ? (
            <>
            {area.map((area, index) => (
                <Area key={index} areaTitle={area.title} desc={area.desc} program={area.program} percentage={area.percentage}/>)
            )}
                <div className='absolute right-0 col-start-3 flex items-center justify-center min-w-[275px] h-full overflow-hidden opacity-90 transition-all duration-500 hover:min-w-[278px] hover:opacity-95 hover:scale-110 bg-gradient-to-r from-transparent via-neutral-800 to-neutral-900 cursor-pointer'>
                        <h1 className='z-10 text-xl font-semibold text-neutral-200'>View All</h1>
                    </div>
            </>        
        ) : (
                <p className="col-span-3 m-auto text-lg text-center text-gray-500 font-extralight">No areas found.</p> 
            )}
            

            {/* the percentage should be changed based on the progress of area */}
            {/*Temp. control for progress bar = <input type="range" min="0" max="100" value={percentage} onChange={(e) => setPercentage(e.target.value)} />*/}   
            </section>

            {/* Reports */}
            <h1 className="mx-3 mt-5 mb-3 text-xl font-semibold dark:text-white">Reports</h1>
             <section className="grid grid-cols-2 grid-rows-[auto_1fr] relative p-3 gap-5 text-neutral-800 border-1 border-neutral-900 rounded-lg shadow-xl transition-all duration-500 dark:inset-shadow-sm dark:inset-shadow-zuccini-900 dark:bg-woodsmoke-950">
                {/* Create Deadlines */}
                    <div className="col-span-2 transition-all duration-500 dark:text-white">
                        <h1 className="mx-3 mb-1 font-medium text-md">Create Submission Deadlines</h1>
                        <div className="col-span-2 min-h-[100px] border rounded-md transition-all duration-500 dark:border-none dark:inset-shadow-sm dark:inset-shadow-zuccini-900 dark:bg-[#19181A]">
                            <form action="#"
                            className='grid grid-cols-4 gap-2'
                            >
                                {/* Select Department */}
                                <div className="min-h-[100px] p-3 flex flex-col justify-center">
                                <label htmlFor ="department"
                                className='mb-1 `text-lg font-extralight'
                                >Department</label>
                                <select name="department" id="department"
                                    className='p-2 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-woodsmoke-950 dark:border-none'
                                    required>
                                    <option value="">Select a Department</option>
                                    <option value="BSIT">BSIT</option>
                                    <option value="BSED">BSED</option>
                                    <option value="BSCrim">BSCrim</option>
                                </select>
                                </div>
                                {/* Select Area */}
                                <div className="min-h-[100px] p-3 flex flex-col justify-center">
                                <label htmlFor="area"
                                    className='mb-1 text-lg font-extralight'
                                >Area</label>
                                <select name="area" id="area"
                                    className='p-2 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-woodsmoke-950 dark:border-none'
                                    required>
                                    <option value="">Select an Area</option>
                                    <option value="Area I">Area I</option>
                                    <option value="Area II">Area II</option>
                                    <option value="Area III">Area III</option>
                                </select>
                                </div>
                                {/* Select Deadline */}
                                <div className="min-h-[100px] p-3 flex flex-col justify-center">
                                    <label htmlFor="deadline"
                                    className='mb-1 text-lg font-extralight'
                                    >Deadline</label>
                                    <input type="date" name="deadline" id="deadline"
                                        className='p-2 font-semibold transition-all duration-500 border cursor-pointer bg-neutral-300 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-woodsmoke-950 dark:border-none' 
                                        required/>  
                                </div>
                                {/* Create Deadline Btn*/}
                                <input 
                                type="submit" 
                                value="Create Deadline"
                                className='px-6 py-4 font-semibold transition-all duration-300 cursor-pointer place-self-center rounded-xl bg-zuccini-600 hover:bg-zuccini-800 active:bg-zuccini-700 text-neutral-100'
                                />
                            
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
                            {deadLines && deadLines.length > 0 ? deadLines.map((deadline, index) => (
                                <Deadline key={index} areaTitle={deadline.title} date={deadline.date} />
                            )) : (
                                 <p className="m-auto text-lg text-center text-gray-500  font-extralight">No deadlines ahead.</p>
                            )
                            }            
                        </div>
                    </div>

                
                {/* Calendar */}
                    <div className="row-start-2 col-start-2 border rounded-md p-5 transition-all duration-500 dark:inset-shadow-sm dark:inset-shadow-zuccini-900 dark:text-white dark:bg-[#19181A] dark:border-none">
                        <FullCalendar 
                        plugins={[dayGridPlugin]}
                        initialView='dayGridMonth'
                        headerToolbar={{
                            start: 'title',
                            center: '',
                            end: 'today prev next'
                        }}
                        events={deadLines}
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

export const Area = ({percentage, program, areaTitle, desc}) =>{

    return(
        <div className="relative mr-4 min-w-[300px] h-[210px] border-black border rounded-lg shadow-lg overflow-hidden transition-all duration-500 hover:scale-105 cursor-pointer">
            <div className='h-[50%] bg-zuccini-600'> 
                <div className='absolute top-2 right-2 px-5 bg-neutral-200 border-black border rounded-xl font-light dark:bg-[#19181A] dark:text-white'>{program}</div>
                <CircularProgressBar percentage={percentage} circleWidth="75"/>           
            </div>      

            <div className='text-right h-[50%] p-3 bg-neutral-200 border-t-1 transition-all duration-500  dark:bg-[#19181A] dark:text-white dark:border-t-neutral-600'>
                <h1 className='mb-4 text-2xl font-semibold text-wrap'>{areaTitle}</h1>
                <h2 className='text-lg truncate'>{desc}</h2>
            </div>
        </div> 
        
    )
}

// Generates deadline

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