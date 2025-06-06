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
        <main className="flex-1 p-4 h-full  col-span-4 row-span-4 col-start-2 row-start-2 overflow-y-auto">
            {/* Dashboard links */}
            <section className="grid grid-cols-4 gap-4">   
            <DashboardLinks icon={faUsers} text="Users" />            
            <DashboardLinks icon={faGraduationCap} text="Programs" />            
            <DashboardLinks icon={faSchool} text="Institutes" />            
            <DashboardLinks icon={faCircleCheck} text="Approved" />            
            </section>

            {/* Announcements */}
            <section className="relative mt-4 p-5 text-neutral-800 border-1 border-neutral-900 rounded-3xl shadow-xl">
                <div className='flex flex-row'>
                    <FontAwesomeIcon icon={faBullhorn} className=" p-2" />
                    <h2 className="text-neutral-800 text-xl font-semibold mb-4">Announcements</h2>
                </div>

                <div className="absolute top-5 right-5 flex flex-row items-center justify-around px-2 cursor-pointer" >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    <h1 className="text-lg">New</h1>
                </div>
                
                <div className="bg-neutral-400 p-4 rounded-lg">
                    <p className="p-5 text-gray-700 text-center">No new announcements at the moment.</p>
                </div>
            </section>

            {/* Pending Documents and Audit Logs*/}

            <section className='grid grid-cols-2 gap-4 mt-4'>
            <div className="mt-4 p-5 text-neutral-800 border-1 border-neutral-900 rounded-3xl shadow-xl" >
                <div className='flex flex-row'>
                    <FontAwesomeIcon icon={faHourglassHalf}  className=" p-2" />
                    <h2 className="text-neutral-800 text-xl font-semibold mb-4">Pending Documents</h2>
                </div>
                <div className="flex items-center justify-center h-60 bg-neutral-400 p-5 rounded-lg">
                    <p className="p-5 text-gray-700 text-center">No pending documents at the moment.</p>
                </div> 
            </div>
            
            <div className="mt-4 p-5 text-neutral-800 border-1 border-neutral-900 rounded-3xl shadow-xl">
                <div className='flex flex-row'>
                    <FontAwesomeIcon icon={faGears}  className=" p-2" />
                    <h2 className="text-neutral-800 text-xl font-semibold mb-4">Audit Logs</h2>
                </div>

                <div className="flex items-center justify-center h-60 bg-neutral-400 p-4 rounded-lg">
                    <p className="p-5 text-gray-700 text-center">No logs at the moment.</p>
                </div> 
            </div>
            </section>


        </main>
    );
}

export const DashboardLinks = ({icon, text}) =>{
    return (
     <div className='flex flex-row items-center text-neutral-800 border-1 border-neutral-900 rounded-3xl w-60 h-20 p-4 m-1 relative shadow-xl'>
        <div className='flex items-center justify-center p-2 w-12 h-12 bg-[#5ADF9C] rounded-full mr-3'>
            <FontAwesomeIcon icon={icon} className="text-neutral-800 text-2xl text-center" />
        </div>
        <h1 className="text-xl font-semibold text-shadow-md">{text}</h1>
        <span className="absolute right-6 text-lg">0</span>
    </div>
    )
}



export default Dashboard;