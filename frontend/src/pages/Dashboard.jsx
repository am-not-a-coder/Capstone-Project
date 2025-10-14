import{
    faUsers,
    faGraduationCap,
    faSchool,
    faBullhorn,
    faPlus,
    faGears,
    faHourglassHalf,
    faCalendarDays,
    faTrash
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {useNavigate} from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete, API_URL } from '../utils/api_utils';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { getCurrentUser, adminHelper } from '../utils/auth_utils';
import AnnouncementModal from '../components/modals/AnnouncementModal';
import StatusModal from '../components/modals/StatusModal';

const Dashboard = () => {
    
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("success");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

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
    const [countLoading, setCountLoading] = useState(true)
    const user = getCurrentUser()
    const key = user?.employeeID ? `welcomeShown:${user.employeeID}` : 'WelcomeShown'
    // Fetch announcements
    const fetchAnnouncements = async () => {
        try {
            setAnnouncementsLoading(true);
            console.log('📢 Fetching announcements...');
            const response = await fetch(`${API_URL}/api/announcements`, {
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
                setCountLoading(true);
                const response = await apiGet('/api/count');
                if (response.success) {
                    setCount(response.data);
                } else {
                    console.error("Failed fetching counts", response.error);
                    // Keep default values (0) if API fails
                }
            } catch(err){
                console.error("Failed fetching counts", err)
                // Keep default values (0) if API fails
            } finally {
                setCountLoading(false);
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
    
        try {
            console.log('🗑️ Deleting announcement:', announcementId);
            const response = await apiDelete(`/api/announcement/delete/${announcementId}`);
            console.log('🗑️ Delete response:', response);
            
            if (response.success) {
                toast.success('Announcement deleted successfully');
                setShowDeleteConfirm(false);
                fetchAnnouncements(); // Refresh the list
            } else {
                toast.error(response.error || 'Failed to delete announcement');
            }
        } catch (error) {
            console.error('Error deleting announcement:', error);
            toast.error('Failed to delete announcement');
        }
        
    };

    // Fetch logs
    const [logs, setLogs] = useState([])
    useEffect(()=> {
        const fetchLogs = async ()=> {
            try {
                const response = await apiGet('/api/auditLogs')
                const logsData = response?.data?.logs || response?.data?.data?.logs || []
                setLogs(Array.isArray(logsData) ? logsData : [])
            } catch(err) {
                console.error('Error getting logs ', err)
                setLogs([])
            }
        } 
        fetchLogs()
    }, [logs])

    // Fetch pending documents
    const [pendingDocs, setPendingDocs] = useState([])
    useEffect(()=> {
        const fetchPendingDocs = async ()=> {
            try {
                const response = await apiGet('/api/pendingDocs')
                const pd = response?.data?.pendingDocs || response?.data?.data?.pendingDocs || []
                setPendingDocs(Array.isArray(pd) ? pd : [])
            } catch(err) {
                console.error('Error getting pending documents ', err)
                setPendingDocs([])
            }
        } 
        fetchPendingDocs()
    }, [])
    
    return (
        <>
        <Toaster />

            {showStatusModal && (
                <StatusModal message={statusMessage} type={statusType} showModal={showStatusModal} onClick={()=>setShowStatusModal(false)} />
            )} 

            {/* Dashboard links */}
            <section className='grid grid-rows-4 gap-1 mt-20 mb-5 lg:mt-8 lg:grid-cols-4 lg:grid-rows-1'>   
                <DashboardLinks icon={faUsers} text="Users" page="Users" count={count?.employees || 0} loading={countLoading}/>            
                <DashboardLinks icon={faGraduationCap} text="Programs" page="Programs" count={count?.programs || 0} loading={countLoading}/>            
                <DashboardLinks icon={faSchool} text="Institutes" page="Institutes" count={count?.institutes || 0} loading={countLoading}/>               
                <DashboardLinks icon={faCalendarDays} text="Deadlines" page="Tasks" count={count?.deadlines || 0} loading={countLoading}/>            
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
                                <div key={index} className="p-4 bg-gray-100 border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-gray-800 dark:text-white">{announcement.announceTitle}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {announcement.duration ? new Date(announcement.duration).toLocaleDateString() : 'No date'}
                                            </span>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => {
                                                        setShowDeleteConfirm(true);
                                                        setSelectedAnnouncement(announcement);
                                                    }}
                                                    className="px-2 py-1 text-xs text-red-600 transition-colors rounded hover:bg-red-100 dark:hover:bg-red-900"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">{announcement.announceText}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">By: {announcement.author}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="p-5 font-light text-center text-gray-700 transition-all duration-500 dark:text-white">No new announcements</p>
                    )}
                </div>
            </section>

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"> 
                    <div className='absolute flex flex-col items-center justify-center p-4 border border-gray-200 shadow-lg bg-red-50 w-100 rounded-xl dark:bg-gray-700 dark:border-gray-600 fade-in'>
                        <div className='flex items-center justify-center mb-4 bg-red-200 rounded-full inset-shadow-sm w-18 h-18 inset-shadow-red-300'>
                            <FontAwesomeIcon icon={faTrash} className="m-auto text-4xl text-red-500"/>
                        </div>
                        
                        <h3 className='mb-2 text-xl font-bold text-gray-900 dark:text-white'>
                            Delete Announcement
                        </h3>
                        <span className='mb-6 text-center text-gray-600 break-words dark:text-gray-300'>
                        Are you sure you want to delete "<strong>{selectedAnnouncement.announceTitle}</strong>"? 
                        </span>

                        <div className='flex gap-4'>
                            <button 
                                className='px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700' 
                                onClick={() => handleDeleteAnnouncement(selectedAnnouncement.announceID)}
                            >
                                Yes
                            </button>
                            <button 
                                className='px-4 py-2 text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 dark:text-white dark:bg-gray-600 dark:hover:bg-gray-700' 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteConfirm(false);
                                }}
                            >
                                No
                            </button>
                        </div>                                    
                    </div>
                </div>
                )}

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
                    <div className="flex flex-col gap-1 p-3 overflow-y-auto transition-all duration-500 rounded-lg h-60 bg-neutral-300 dark:bg-gray-950/50">
                        {pendingDocs.map((pendingDoc)=> (
                            <div 
                                key={pendingDoc.pendingDocID}
                                className='p-3 mb-1 transition-all duration-500 bg-gray-100 rounded-lg shadow-xl cursor-pointer hover:bg-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700'
                            >
                                <p  className="text-gray-700 dark:text-white">{pendingDoc.pendingDocName}</p>
                            </div>
                        ))}
                    </div>
                </div>
                 {/* Audit Logs */}                
                    <div className="p-5 mb-10 transition-all duration-500 shadow-xl text-neutral-800 border-1 dark:border-gray-900 border-neutral-300 rounded-3xl inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-900">
                        <div className='flex flex-row'>
                            <FontAwesomeIcon icon={faGears} className="p-2 transition-all duration-500 dark:text-white" />
                            <h2 className="mb-4 text-xl font-semibold transition-all duration-500 text-neutral-800 dark:text-white">Audit Logs</h2>
                        </div>

                    {/* Display logs */}                    
                        <div className="overflow-auto rounded-lg h-60 bg-neutral-300 dark:bg-gray-950/50">
                            <table className="w-full">
                                <thead className="sticky top-0 border-b border-gray-400 bg-neutral-400 dark:bg-gray-900 dark:border-gray-800">
                                    <tr>
                                        <th className="px-4 py-2 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase dark:text-gray-300">
                                            Action
                                        </th>
                                        <th className="px-4 py-2 text-xs font-semibold tracking-wider text-right text-gray-700 uppercase dark:text-gray-300">
                                            Date & Time
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-400 dark:divide-gray-800">
                                    {logs.map((log) => {
                                        const isLogin = log.action.includes('LOGGED IN');
                                        const isDelete = log.action.includes('DELETED');
                                        const isRate = log.action.includes('RATED');
                                        const isCreate = log.action.includes('CREATED');
                                        const isUpload = log.action.includes('UPLOADED');
                                        const isLoggedOut = log.action.includes('LOGGED OUT');
                                        const isEdit = log.action.includes('EDITED');
                                        const isDownload = log.action.includes('DOWNLOADED');
                                        const isUpdate = log.action.includes('UPDATED');

                                        return (
                                            <tr 
                                                key={log.logID} 
                                                className="transition-colors duration-150 hover:bg-gray-400 dark:hover:bg-gray-800/70"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {isLogin && (
                                                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                                                                Login
                                                            </span>
                                                        )}
                                                        {isDelete && (
                                                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                                                                Delete
                                                            </span>
                                                        )}
                                                        {isRate && (
                                                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-orange-200 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
                                                                Rate
                                                            </span>
                                                        )}
                                                        {isCreate && (
                                                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                                Create
                                                            </span>
                                                        )}
                                                        {isUpload && (
                                                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-purple-200 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                                                                Upload
                                                            </span>
                                                        )}
                                                        {isLoggedOut && (
                                                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                                                Logout
                                                            </span>
                                                        )}
                                                        {isEdit && (
                                                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-teal-200 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                                                                Edit
                                                            </span>
                                                        )}
                                                        {isUpdate && (
                                                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-teal-200 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">
                                                                Update
                                                            </span>
                                                        )}
                                                        {isDownload && (
                                                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                                Download
                                                            </span>
                                                        )}
                                                        <span className="text-sm text-gray-700 transition-all duration-500 dark:text-white">
                                                            {log.action}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-700 transition-all duration-500 dark:text-white">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

        
        </>
    );
}

export const DashboardLinks = ({icon, text, page, count, loading = false}) =>{
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
                {loading ? '...' : count}
            </span>
        </div>
    
    )
}



export default Dashboard;