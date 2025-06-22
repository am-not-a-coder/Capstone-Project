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
                    <h2 className="text-neutral-800 text-xl font-semibold mb-4 dark:text-white">Announcements</h2>
                </div>

                <div className="absolute top-5 right-5 flex flex-row items-center justify-around px-5 py-1 cursor-pointer rounded-3xl transition-all duration-500 hover:bg-zuccini-600 active:bg-zuccini-500" >
                    <FontAwesomeIcon icon={faPlus} className="mr-2 dark:text-white" />
                    <h1 className="text-lg dark:text-white">New</h1>
                </div>
                
                <div className="bg-neutral-300 p-4 rounded-lg transition-all duration-500 dark:bg-woodsmoke-950">
                    <p className="p-5 text-gray-700 text-center font-light transition-all duration-500 dark:text-white">No new announcements</p>
                </div>

            </section>

            <section className='grid grid-cols-2 gap-4 mt-4'>

            {/* Pending Documents */}
            <div className="mt-4 p-5 text-neutral-800 border-1 border-neutral-900 rounded-3xl shadow-xl transition-all duration-500 dark:inset-shadow-sm dark:inset-shadow-zuccini-900 dark:bg-[#19181A]" >
                <div className='flex flex-row'>
                    <FontAwesomeIcon icon={faHourglassHalf}  className="p-2 transition-all duration-500 dark:text-white" />
                    <h2 className="text-neutral-800 text-xl font-semibold mb-4 transition-all duration-500 dark:text-white">Pending Documents</h2>
                </div>
                <div className="flex items-center justify-center h-60 bg-neutral-300 p-5 rounded-lg transition-all duration-500 dark:bg-woodsmoke-950">
                    <p className="m-auto p-5 text-gray-700 text-center transition-all duration-500 dark:text-white">No pending documents.</p>
                </div>
            </div>
            {/* Audit Logs */}
            
            <div className="mt-4 p-5 text-neutral-800 border-1 border-neutral-900 rounded-3xl shadow-xl transition-all duration-500 dark:inset-shadow-sm dark:inset-shadow-zuccini-900 dark:bg-[#19181A]">
                <div className='flex flex-row'>
                    <FontAwesomeIcon icon={faGears}  className="p-2 transition-all duration-500 dark:text-white" />
                    <h2 className="text-neutral-800 text-xl font-semibold mb-4 transition-all duration-500 dark:text-white">Audit Logs</h2>
                </div>

                <div className="flex items-center justify-center h-60 bg-neutral-300 p-4 rounded-lg dark:bg-woodsmoke-950">
                    <p className="p-5 text-gray-700 text-center transition-all duration-500 dark:text-white">No logs at the moment.</p>
                </div> 
            </div>
            </section>


        
        </>
    );
}

export const DashboardLinks = ({icon, text}) =>{
    return (
     <div className='flex flex-row items-center text-neutral-800 border-1 border-neutral-900 rounded-3xl h-20 p-4 m-1 relative shadow-xl cursor-pointer transition-all duration-500 dark:inset-shadow-sm dark:inset-shadow-zuccini-900 dark:bg-[#19181A]'>
        <div className='flex items-center justify-center p-2 w-12 h-12 bg-[#5ADF9C] rounded-full mr-3'>
            <FontAwesomeIcon icon={icon} className="text-neutral-800 text-2xl text-center" />
        </div>
        <h1 className="text-xl font-semibold text-shadow-md transition-all duration-500 dark:text-white">{text}</h1>
        <span className="absolute right-6 text-lg transition-all duration-500 dark:text-white">0</span>
    </div>
    )
}



export default Dashboard;