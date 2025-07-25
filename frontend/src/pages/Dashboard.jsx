import{
    faUsers,
    faGraduationCap,
    faSchool,
    faCircleCheck,
    faBullhorn,
    faPlus,
    faGears,
    faHourglassHalf
} from '@fortawesome/free-solid-svg-icons';
import {useNavigate} from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


const Dashboard = () => {

    
    return (
        <>
            {/* Dashboard links */}
            <section className="grid grid-cols-4 gap-3">   
                <DashboardLinks icon={faUsers} text="Users" />            
                <DashboardLinks icon={faGraduationCap} text="Programs" />            
                <DashboardLinks icon={faSchool} text="Institutes" />            
                <DashboardLinks icon={faCircleCheck} text="Approved" />            
            </section>

            {/* Announcements */}
            <section className="relative mt-4 p-5 text-neutral-800 border-1 border-neutral-900 rounded-3xl shadow-xl transition-all duration-500 dark:inset-shadow-sm dark:inset-shadow-zuccini-900 dark:bg-[#19181A] ">
                <div className='flex flex-row'>
                    <FontAwesomeIcon icon={faBullhorn} className="p-2 dark:text-white" />
                    <h2 className="mb-4 text-xl font-semibold text-neutral-800 dark:text-white">Announcements</h2>
                </div>

                <div className="absolute flex flex-row items-center justify-around px-5 py-1 transition-all duration-500 cursor-pointer top-5 right-5 rounded-3xl hover:bg-zuccini-600 active:bg-zuccini-500" >
                    <FontAwesomeIcon icon={faPlus} className="mr-2 dark:text-white" />
                    <h1 className="text-lg dark:text-white">New</h1>
                </div>
                
                <div className="p-4 transition-all duration-500 rounded-lg bg-neutral-300 dark:bg-woodsmoke-950">
                    <p className="p-5 font-light text-center text-gray-700 transition-all duration-500 dark:text-white">No new announcements</p>
                </div>
            </section>

            <section className='grid grid-cols-2 gap-4 mt-4'>

            {/* Pending Documents */}
            <div className="mt-4 p-5 text-neutral-800 border-1 border-neutral-900 rounded-3xl shadow-xl transition-all duration-500 dark:inset-shadow-sm dark:inset-shadow-zuccini-900 dark:bg-[#19181A]" >
                <div className='flex flex-row'>
                    <FontAwesomeIcon icon={faHourglassHalf}  className="p-2 transition-all duration-500 dark:text-white" />
                    <h2 className="mb-4 text-xl font-semibold transition-all duration-500 text-neutral-800 dark:text-white">Pending Documents</h2>
                </div>
                <div className="flex items-center justify-center p-5 transition-all duration-500 rounded-lg h-60 bg-neutral-300 dark:bg-woodsmoke-950">
                    <p className="p-5 m-auto text-center text-gray-700 transition-all duration-500 dark:text-white">No pending documents.</p>
                </div>
            </div>
            {/* Audit Logs */}
            
            <div className="mt-4 p-5 text-neutral-800 border-1 border-neutral-900 rounded-3xl shadow-xl transition-all duration-500 dark:inset-shadow-sm dark:inset-shadow-zuccini-900 dark:bg-[#19181A]">
                <div className='flex flex-row'>
                    <FontAwesomeIcon icon={faGears}  className="p-2 transition-all duration-500 dark:text-white" />
                    <h2 className="mb-4 text-xl font-semibold transition-all duration-500 text-neutral-800 dark:text-white">Audit Logs</h2>
                </div>

                <div className="flex items-center justify-center p-4 rounded-lg h-60 bg-neutral-300 dark:bg-woodsmoke-950">
                    <p className="p-5 text-center text-gray-700 transition-all duration-500 dark:text-white">No logs at the moment.</p>
                </div> 
            </div>
            </section>


        
        </>
    );
}

export const DashboardLinks = ({icon, text}) =>{
    const navigate = useNavigate();

    return (
    
        <div className='flex flex-row items-center text-neutral-800 border-1 border-neutral-900 rounded-3xl h-20 p-4 m-1 relative shadow-xl cursor-pointer transition-all duration-500 dark:inset-shadow-sm dark:inset-shadow-zuccini-900 dark:bg-[#19181A]'>
            <div className='flex items-center justify-center p-2 w-12 h-12 bg-[#5ADF9C] rounded-full mr-3'>
                <FontAwesomeIcon icon={icon}  className="text-2xl text-center text-neutral-800" />
            </div>
            <h1 className="text-xl font-semibold transition-all duration-500 text-shadow-md dark:text-white">{text}</h1>
            <span className="absolute text-lg transition-all duration-500 right-6 dark:text-white">0</span>
        </div>
    
    )
}



export default Dashboard;