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
import { apiGet, apiPost, apiDelete } from '../utils/api_utils';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast'
import { getCurrentUser, adminHelper } from '../utils/auth_utils';
import AnnouncementModal from '../components/modals/AnnouncementModal';
import StatusModal from '../components/modals/StatusModal';

const Dashboard = () => {
    
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("success");

    const [showAnnounceModal, setShowAnnounceModal] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(true);
    const isAdmin = adminHelper()
    const [count, setCount] = useState({
        employees: 0,
        programs: 0,
        institutes: 0,
        deadlines: 0
    })
    const user = getCurrentUser()
    const key = user?.employeeID ? `welcomeShown:${user.employeeID}` : 'WelcomeShown'
    // Fetch announcements
    const fetchAnnouncements = async () => {
        try {
            setAnnouncementsLoading(true);
            console.log('📢 Fetching announcements...');
            const response = await fetch('http://localhost:5000/api/announcements', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            console.log('📢 Response status:', response.status);
            console.log('📢 Response ok:', response.ok);
            const data = await response.json();
            console.log('📢 Announcements response:', data);
            console.log('📢 Is array?', Array.isArray(data));
            console.log('📢 Data length:', data ? data.length : 'no data');
            if (data && Array.isArray(data)) {
                setAnnouncements(data);
                console.log('📢 Announcements set:', data);
            } else {
                console.log('📢 No announcements or invalid response');
                setAnnouncements([]);
            }
        } catch (error) {
            console.error('Error fetching announcements:', error);
            setAnnouncements([]);
        } finally {
            setAnnouncementsLoading(false);
        }
    };

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
        fetchAnnouncements();

        // Check if this is a fresh login (not a page refresh or navigation)
        const hasShownWelcome = sessionStorage.getItem(key)
        if (!hasShownWelcome && user?.employeeID) {
            toast.success(`Welcome, ${user.lastName} | ${user.employeeID}!`, { duration: 2000, icon: '🎊' })    
            sessionStorage.setItem(key, 'true')
          }  
    }, [])

      const handleCreateAnnouncement = async (announcement) => {
      console.log("New announcement:", announcement);
      // Here you can push it to state, API call, etc.
        
        try {
        const response = await apiPost('/api/announcement/post', {
            title: announcement.title, 
            message: announcement.message, 
            duration: announcement.duration,            
        })

        setShowStatusModal(true)
        setStatusMessage(response.data.message)
        setStatusType("success")
        
        // Refresh announcements after creating new one
        fetchAnnouncements();

        } catch(err){ 
            console.error('Posting announcement to server failed, ', err)
            setShowStatusModal(true)
            setStatusMessage("Failed to post announcement.")
            setStatusType("error")
        }
	};

    // Delete announcement function
    const handleDeleteAnnouncement = async (announcementId) => {
        if (!isAdmin) {
            toast.error('Only admins can delete announcements');
            return;
        }

        if (window.confirm('Are you sure you want to delete this announcement?')) {
            try {
                console.log('🗑️ Deleting announcement:', announcementId);
                const response = await apiDelete(`/api/announcement/delete/${announcementId}`);
                console.log('🗑️ Delete response:', response);
                
                if (response.success) {
                    toast.success('Announcement deleted successfully');
                    fetchAnnouncements(); // Refresh the list
                } else {
                    toast.error(response.error || 'Failed to delete announcement');
                }
            } catch (error) {
                console.error('Error deleting announcement:', error);
                toast.error('Failed to delete announcement');
            }
        }
    };

    
    return (
        <>
        <Toaster />

            {showStatusModal && (
                <StatusModal message={statusMessage} type={statusType} showModal={showStatusModal} onClick={()=>setShowStatusModal(false)} />
            )} 

            {/* Dashboard links */}
            <section className='grid grid-rows-4 gap-1 mt-20 mb-5 lg:mt-8 lg:grid-cols-4 lg:grid-rows-1'>   
                <DashboardLinks icon={faUsers} text="Users" page="Users" count={count.employees}/>            
                <DashboardLinks icon={faGraduationCap} text="Programs" page="Programs" count={count.programs}/>            
                <DashboardLinks icon={faSchool} text="Institutes" page="Institutes" count={count.institutes}/>               
                <DashboardLinks icon={faCalendarDays} text="Deadlines" page="Tasks" count={count.deadlines} />            
            </section>

            {/* Announcements */}
            <section className={` relative mt-4 mb-8 p-5 text-neutral-800 border-1 dark:border-gray-700 border-gray-300 rounded-3xl shadow-xl transition-all duration-500 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-900`}>
                <div className='flex flex-row items-center'>
                    <FontAwesomeIcon icon={faBullhorn} className="p-2 dark:text-white" />
                    <h2 className="mb-4 text-xl font-semibold text-neutral-800 dark:text-white">Announcements</h2>
                </div>

                { isAdmin &&(<div 
                onClick={() => {
                    if (!isAdmin) { toast.error('Admins only'); return }
                    setShowAnnounceModal(true)
                }}
                className="absolute flex flex-row items-center justify-around px-5 py-1 transition-all duration-500 cursor-pointer top-5 right-5 rounded-3xl hover:bg-zuccini-600 active:bg-zuccini-500" >
                    <FontAwesomeIcon icon={faPlus} className="mr-2 dark:text-white" />
                    <h1 className="text-lg dark:text-white">New</h1>
                </div>)}
                
                <div className="p-4 transition-all duration-500 rounded-lg bg-neutral-300 dark:bg-gray-950/50">
                    {console.log('📊 Dashboard render - announcements:', announcements, 'loading:', announcementsLoading)}
                    {announcementsLoading ? (
                        <p className="p-5 font-light text-center text-gray-700 transition-all duration-500 dark:text-white">Loading announcements...</p>
                    ) : announcements && announcements.length > 0 ? (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {announcements.map((announcement, index) => (
                                <div key={index} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-gray-800 dark:text-white">{announcement.announceTitle}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {announcement.duration ? new Date(announcement.duration).toLocaleDateString() : 'No date'}
                                            </span>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => handleDeleteAnnouncement(announcement.announceID)}
                                                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{announcement.announceText}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">By: {announcement.author}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="p-5 font-light text-center text-gray-700 transition-all duration-500 dark:text-white">No new announcements</p>
                    )}
                </div>
            </section>

            {showAnnounceModal && (
                <AnnouncementModal setShowModal={setShowAnnounceModal} onCreate={handleCreateAnnouncement}/>
            )}

            { isAdmin && (
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
            )}

        
        </>
    );
}

export const DashboardLinks = ({icon, text, page, count}) =>{
    const navigate = useNavigate();

    return (
    
        <div 
        onClick={() => navigate(`/${page}`)}
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