import{
    faUsers,
    faGraduationCap,
    faSchool,
    faBullhorn,
    faPlus,
    faGears,
    faHourglassHalf,
    faCalendarDays 
} from '@fortawesome/free-solid-svg-icons';
import {useNavigate} from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../utils/api_utils';
import toast, { Toaster } from 'react-hot-toast'
import { getCurrentUser } from '../utils/auth_utils';
import AnnouncementModal from '../components/modals/AnnouncementModal';

const Dashboard = () => {

    const [showAnnounceModal, setShowAnnounceModal] = useState(false);
    
    const [count, setCount] = useState({
        employees: 0,
        programs: 0,
        institutes: 0,
        deadlines: 0
    })
    useEffect(()=> {
        const fetchCounts = async () => {
            try{
                const response = await apiGet('/api/count');
                setCount(response.data)                
            } catch(err){
                console.error("Failed fetching counts", err)
            }
        }
        fetchCounts();

        // Check if this is a fresh login (not a page refresh or navigation)
        const hasShownWelcome = sessionStorage.getItem('welcomeShown')
        if (!hasShownWelcome) {
            const currentUser = getCurrentUser()
            if (currentUser?.employeeID) {
                toast.success(`Welcome, ${currentUser.lastName} | ${currentUser.employeeID}!`, {
                    duration: 2000,
                    icon: '🎊'
                })
                // Mark that welcome has been shown for this session
                sessionStorage.setItem('welcomeShown', 'true')
            }
        }
    }, [])

   const handleCreateAnnouncement = async (announcement) => {
      console.log("New announcement:", announcement);
      // Here you can push it to state, API call, etc.
        const currentUser = getCurrentUser()
        try {
        const response = await apiPost('/api/postAnnounce', {
            title: announcement.title, 
            message: announcement.message, 
            duration: announcement.duration,
            userID: currentUser.userID
        })
        } catch(err){ console.error('Posting announcement to server failed, ', err)}
	};

    
   return (
        <>
        <Toaster />
            {/* Dashboard links */}
            <section className='grid grid-rows-4 gap-1 mt-20 mb-5 lg:mt-8 lg:grid-cols-4 lg:grid-rows-1'>   
                <DashboardLinks icon={faUsers} text="Users" count={count.employees}/>            
                <DashboardLinks icon={faGraduationCap} text="Programs" count={count.programs}/>            
                <DashboardLinks icon={faSchool} text="Institutes" count={count.institutes}/>               
                <DashboardLinks icon={faCalendarDays} text="Deadlines" count={count.deadlines} />            
            </section>

            {/* Announcements */}
            <section className={` relative mt-4 mb-8 p-5 text-neutral-800 border-1 dark:border-gray-700 border-gray-300 rounded-3xl shadow-xl transition-all duration-500 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-900`}>
                <div className='flex flex-row'>
                    <FontAwesomeIcon icon={faBullhorn} className="p-2 dark:text-white" />
                    <h2 className="mb-4 text-xl font-semibold text-neutral-800 dark:text-white">Announcements</h2>
                </div>

                <div 
                onClick={() => setShowAnnounceModal(true)}
                className="absolute flex flex-row items-center justify-around px-5 py-1 transition-all duration-500 cursor-pointer top-5 right-5 rounded-3xl hover:bg-zuccini-600 active:bg-zuccini-500" >
                    <FontAwesomeIcon icon={faPlus} className="mr-2 dark:text-white" />
                    <h1 className="text-lg dark:text-white">New</h1>
                </div>
                
                <div className="p-4 transition-all duration-500 rounded-lg bg-neutral-300 dark:bg-gray-950/50">
                    <p className="p-5 font-light text-center text-gray-700 transition-all duration-500 dark:text-white">No new announcements</p>
                </div>
            </section>

            {showAnnounceModal && (
                <AnnouncementModal setShowModal={setShowAnnounceModal} onCreate={handleCreateAnnouncement}/>
            )}

            <section className='grid grid-rows-2 gap-4 mt-4 lg:grid-cols-2 lg:grid-rows-1'>

            {/* Pending Documents */}
            <div className="p-5 mb-8 transition-all duration-500 shadow-xl text-neutral-800 border-1 border-neutral-300 rounded-3xl inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:border-gray-900 dark:bg-gray-900" >
                <div className='flex flex-row'>
                    <FontAwesomeIcon icon={faHourglassHalf}  className="p-2 transition-all duration-500 dark:text-white" />
                    <h2 className="mb-4 text-xl font-semibold transition-all duration-500 text-neutral-800 dark:text-white">Pending Documents</h2>
                </div>
                <div className="flex items-center justify-center p-5 transition-all duration-500 rounded-lg h-60 bg-neutral-300 dark:bg-gray-950/50">
                    <p className="p-5 m-auto text-center text-gray-700 transition-all duration-500 dark:text-white">No pending documents.</p>
                </div>
            </div>
            {/* Audit Logs */}
            
            <div className="p-5 mb-10 transition-all duration-500 shadow-xl text-neutral-800 border-1 dark:border-gray-900 border-neutral-300 rounded-3xl inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-900">
                <div className='flex flex-row'>
                    <FontAwesomeIcon icon={faGears}  className="p-2 transition-all duration-500 dark:text-white" />
                    <h2 className="mb-4 text-xl font-semibold transition-all duration-500 text-neutral-800 dark:text-white">Audit Logs</h2>
                </div>

                <div className="flex items-center justify-center p-4 rounded-lg h-60 bg-neutral-300 dark:border-gray-900 dark:bg-gray-950/50">
                    <p className="p-5 text-center text-gray-700 transition-all duration-500 dark:text-white">No logs at the moment.</p>
                </div> 
            </div>
            </section>


        
        </>
    );
}

export const DashboardLinks = ({icon, text, count}) =>{
    const navigate = useNavigate();

    return (
    
        <div 
        onClick={() => navigate(`/${text}`)}
        className='relative flex flex-row items-center h-20 p-4 m-1 transition-all duration-500 shadow-xl cursor-pointer text-neutral-800 border-1 border-neutral-300 inset-shadow-sm inset-shadow-gray-400 dark:border-gray-800 rounded-3xl dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-900'>
            <div className='flex items-center justify-center p-2 w-12 h-12 bg-[#5ADF9C] rounded-full mr-3'>
                <FontAwesomeIcon icon={icon}  className="text-2xl text-center text-neutral-800" />
            </div>
            <h1 className="text-xl font-semibold transition-all duration-500 text-shadow-sm dark:text-white">{text}</h1>
            <span className="absolute text-lg transition-all duration-500 right-6 dark:text-white">
                {count}
            </span>
        </div>
    
    )
}



export default Dashboard;