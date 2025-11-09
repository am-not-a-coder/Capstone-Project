import{faCalendarPlus, faAngleRight, faGraduationCap, faBullhorn, faPlus, faGears, faHourglassHalf, faCalendarDays, faTrash} from '@fortawesome/free-solid-svg-icons'
import {Link, Navigate, Route, useNavigate} from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiDelete, API_URL } from '../utils/api_utils'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'
import { getCurrentUser, adminHelper } from '../utils/auth_utils'
import AnnouncementModal from '../components/modals/AnnouncementModal'
import StatusModal from '../components/modals/StatusModal'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import CircularProgressBar from '../components/CircularProgressBar'


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
		setAnnouncementsLoading(true)
		const response = await fetch(`${API_URL}/api/announcements`, {
			method: 'GET',
			credentials: 'include',
			headers: {'Content-Type': 'application/json'}
		})
		const data = await response.json();
		if (data && Array.isArray(data)) {setAnnouncements(data)} 
		else {
			console.log('📢 No announcements or invalid response')
			setAnnouncements([])
		}
	} 
	catch(error) {
		console.error('Error fetching announcements:', error)
		setAnnouncements([])
	} 
	finally {setAnnouncementsLoading(false)}
}

	useEffect(()=> {
		const fetchCounts = async () => {
			try{
				setCountLoading(true)
				const response = await apiGet('/api/count')
				if (response.success) {setCount(response.data)} 
				else {
					console.error("Failed fetching counts", response.error)
					// Keep default values (0) if API fails
				}
			} 
			catch(err){
				console.error("Failed fetching counts", err)
				// Keep default values (0) if API fails
			} 
			finally {setCountLoading(false)}
		}
		fetchCounts()
		fetchAnnouncements()
		// Check if this is a fresh login (not a page refresh or navigation)
		const hasShownWelcome = sessionStorage.getItem(key)
		if (!hasShownWelcome && user?.employeeID) {
			toast.success(`Welcome, ${user.lastName} | ${user.employeeID}!`, { duration: 2000, icon: '🎊' })    
			sessionStorage.setItem(key, 'true')
		}  
	}, [])

	const handleCreateAnnouncement = async (announcement) => {
		console.log("New announcement:", announcement)
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
			fetchAnnouncements()
		} 
		catch(err){ 
			console.error('Posting announcement to server failed, ', err)
			setShowStatusModal(true)
			setStatusMessage("Failed to post announcement.")
			setStatusType("error")
		}
	}

	// Delete announcement function
	const handleDeleteAnnouncement = async (announcementId) => {
		if (!isAdmin) {
			toast.error('Only admins can delete announcements')
			return
		}        
	
		try {
			const response = await apiDelete(`/api/announcement/delete/${announcementId}`)
			console.log('🗑️ Delete response:', response)
			if (response.success) {
					toast.success('Announcement deleted successfully')
					setShowDeleteConfirm(false)
					fetchAnnouncements() // Refresh the list
			} 
			else {toast.error(response.error || 'Failed to delete announcement')}
		} 
		catch(error) {
			console.error('Error deleting announcement:', error)
			toast.error('Failed to delete announcement')
		}
	}

	// Fetch logs
	const [logs, setLogs] = useState([])
	useEffect(()=> {
		const fetchLogs = async ()=> {
			try {
				const response = await apiGet('/api/auditLogs')
				const logsData = response?.data?.logs || response?.data?.data?.logs || []
				setLogs(Array.isArray(logsData) ? logsData : [])
			} 
			catch(err) {
				console.error('Error getting logs ', err)
				setLogs([])
			}
		} 
		fetchLogs()
	}, [])

	// Fetch pending documents
	const [pendingDocs, setPendingDocs] = useState([])
	useEffect(()=> {
		const fetchPendingDocs = async ()=> {
			try {
				const response = await apiGet('/api/pendingDocs')
				const pd = response?.data?.pendingDocs || response?.data?.data?.pendingDocs || []
				setPendingDocs(Array.isArray(pd) ? pd : [])
			} 
			catch(err) {
				console.error('Error getting pending documents ', err)
				setPendingDocs([])
			}
		} 
		fetchPendingDocs()
		console.log('Pending docs: ', pendingDocs)
	}, [])

	// Function to get the location of pending doc from its filePath
	function parseDocumentPath(pendingDoc) {
		if (!pendingDoc?.pendingDocPath || typeof pendingDoc.pendingDocPath !== 'string') {
			console.warn('⚠️ Invalid pendingDocPath:', pendingDoc)
			return {
			programCode: '',
			areaName: '',
			subareaName: '',
			criteria: '',
			criteriaNum: '',
			documentName: ''
			}
		}
		const pathParts = pendingDoc.pendingDocPath.split('/')
		const programIndex = pathParts.findIndex(part => part === 'Programs')
		return {
			programCode: pathParts[programIndex + 1] || '',
			areaName: pathParts[programIndex + 2] || '',
			subareaName: pathParts[programIndex + 3] || '',
			criteria: pathParts[programIndex + 4] || '',
			criteriaNum: pathParts[programIndex + 5] || '',
			documentName: pathParts[programIndex + 6] || ''
		}
	}

// Navigate to accreditation with parsed path information
const navigate = useNavigate()
function handlePendingDocClick(pathInfo) {
	navigate('/Accreditation', {
		state: {
			programCode: pathInfo.programCode,
			areaName: pathInfo.areaName,
			subareaName: pathInfo.subareaName,
			criteria: pathInfo.criteria,
			criteriaNum: pathInfo.criteriaNum,
			documentName: pathInfo.documentName
		}
	})
}

// Fetch all areas
const [allAreas, setAllAreas]= useState([])
useEffect(() => {
	const fetchArea = async () => {
		try{
			const res = await apiGet('/api/area', {withCredentials: true})
			Array.isArray(res.data.area) ? setAllAreas(res.data.area) : setAllAreas([]);
			Array.isArray(res.data.area) ? setAreaProgressList(res.data.area) : setAreaProgressList([]);
		} catch(err) {console.error("Failed to fetch area", err)}
	}
	fetchArea()
	}, [])

// Filter areas for form options
const [filteredAreaOptions, setFilteredAreaOptions] = useState([])
const [program, setProgram] = useState("")
useEffect(()=> {
	if(program){
		const filteredAreas = allAreas.filter((area) => String(area.programID) === String(program))
		setFilteredAreaOptions(filteredAreas)
		setSelectedAreaOption("")
	} 
	else {setFilteredAreaOptions([])}
}, [program, allAreas])

// Fetch programs for form option
const [programOption, setProgramOption] = useState([])
useEffect(() => {
	const fetchProgram = async () => {
		try{
			const res = await apiGet('/api/program', {withCredentials: true})
			Array.isArray(res.data.programs) ? setProgramOption(res.data.programs) : setProgramOption([]);
		} catch(err) {console.error("Error occurred when fetching program", err)}
	}
	fetchProgram();
}, [])

const [dueDate, setDueDate] = useState("")
const [content, setContent] = useState("")
const [selectedAreaOption, setSelectedAreaOption] = useState("")


// Creation of deadline
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
		const res = await apiPost('/api/deadline', formData, {withCredentials: true}) 
		setStatusMessage(res.data.message)
		setShowStatusModal(true)
		setStatusType("success")
		setSelectedArea("")
		setProgram("")
		setContent("")
		setCriteria("")
		setDueDate("")
		// refetch deadline data
		const deadlineRes = await apiGet("api/deadlines", {withCredentials: true})
		Array.isArray(deadlineRes.data.deadline) ? setDeadLines(deadlineRes.data.deadline) : setDeadLines([])  
		// refetch event data
		const eventRes = await apiGet("/api/events", {withCredentials: true})
		Array.isArray(eventRes.data) ? setEvent(eventRes.data) : setEvent([])
	}
	catch(err) {
		setStatusMessage("Server error. Please try again")
		setShowStatusModal(true);
		setStatusType("error")
		console.log(err.res?.data || err.message)
	}
} 

// Fetch deadlines
const [deadLines, setDeadLines] = useState([])
useEffect(() => {
	const fetchDeadline = async () => {
		try{
			const res = await apiGet("/api/deadlines", {withCredentials: true})
			Array.isArray(res.data.deadline) ? setDeadLines(res.data.deadline) : setDeadLines([])
		} catch (err){console.error("Error occurred when fetching deadlines! ", err)}
	}
	fetchDeadline()
}, [])

// FETCH EVENTS (FOR CALENDAR)
const [event, setEvent] = useState([])
useEffect(() => {
	const fetchEvents = async () => {
		try{
			const res = await apiGet("/api/events", {withCredentials: true})
			Array.isArray(res.data) ? setEvent(res.data) : setEvent([]) 
		} catch (err){console.error("Error occurred when fetching events! ", err)}
	}
	fetchEvents()
}, [])

// Event modal
const [showEventModal, setShowEventModal] = useState(false)
const handleEventClick = (clickInfo) => {
	setSelectedEvent({
		title: clickInfo.event.title,
		date: clickInfo.event.startStr,
		color: clickInfo.event.extendedProps.color,
		content: clickInfo.event.extendedProps.content,
	})
	setShowEventModal(true)
}
const handleCloseModal = () =>{setSelectedEvent(null); setShowEventModal(false)}

// View deadline
const [showDeadline, setShowDeadline] = useState(false)
const handleViewDeadline = (selectedDeadline) => {    
	const criteriaItem = criteriaOption.find(c => c.criteriaID === selectedDeadline.criteriaID)
	const criteriaName = criteriaItem ? criteriaItem.criteriaName : 'N/A'
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
	setShowDeadline(true)
}
const handleCloseDeadline = () =>{setSelectedDeadline(null); setShowDeadline(false)}

const [areaProgressList, setAreaProgressList] = useState([]) // displays the area in tasks
const uniqueAreas = areaProgressList.filter((area, index, self) => index === self.findIndex(a => a.areaID === area.areaID))

return (
	<>
	{/* Container */}
	<div className="relative w-full p-5 border bg-neutral-200 border-neutral-300 text-neutral-800 rounded-[20px] inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-900 dark:shadow-sm dark:shadow-zuccini-900">
		{/* Area Progress */}
		<h1 className="mx-3 mb-3 text-xl font-semibold transition-all duration-500 dark:text-white">Area Progress</h1>
		<section className="relative grid grid-cols-3 gap-2 p-3 min-h-[220px] text-neutral-800 border-1 border-gray-400 rounded-lg shadow-2xl overflow-hidden dark:bg-gray-950/50 dark:shadow-md dark:shadow-zuccini-900">
			{/* Areas */}
			{areaProgressList && areaProgressList.length > 0 ? (
			  <>
			  	{uniqueAreas.slice(0,3).map((area) => (                
					<div key={area.areaID}  className="relative mr-4 min-w-[300px] h-[210px] border-neutral-400 dark:border-neutral-800 border rounded-lg shadow-xl dark:shadow-sm dark:shadow-zuccini-700 overflow-hidden transition-all duration-500 hover:scale-105 cursor-pointer">
						<div  className='h-[50%] bg-zuccini-600 dark:bg-zuccini-800'> 
							<div  className='absolute px-5 font-light border border-neutral-400 top-2 right-2 bg-neutral-200 rounded-xl dark:bg-gray-900 dark:text-white'>{area.programCode}</div>
							<CircularProgressBar progress={area.progress} circleWidth="75" positionX={"left-3"} positionY={"top-17"} placement={`absolute top-17 left-3`}/>           
						</div>      
						<div className='text-right h-[50%] p-3 bg-neutral-200 border-t-1 transition-all duration-500  dark:bg-gray-900 dark:text-white dark:border-t-neutral-600'>
							<h1 className='mb-4 text-2xl font-semibold text-wrap'>{area.areaNum}</h1>
							<h2 className='text-lg truncate'>{area.areaTitle}</h2>
						</div>
					</div> 
			  	))}
				<div onClick={() => navigate('/Progress')} className='absolute right-0 col-start-3 flex items-center justify-center min-w-[275px] h-full overflow-hidden opacity-90 transition-all duration-500 hover:min-w-[278px] hover:opacity-95 hover:scale-110 bg-gradient-to-r from-transparent via-neutral-800 to-neutral-900 dark:bg-gradient-to-r dark:from-transparent dark:via-gray-800 dark:to-gray-900 cursor-pointer' >
					<h1 className='z-10 text-xl font-semibold text-neutral-200'>View All</h1>
				</div>
			  	</>        
		 	) : (<p className="col-span-3 m-auto text-lg text-center text-gray-500 font-extralight">No areas found.</p>)}
		</section>
	</div>
	

	{/* shows status when creating deadline */}
	{showStatusModal && (
		<StatusModal message={statusMessage} type={statusType} showModal={showStatusModal} onClick={()=>setShowStatusModal(false)} />
	)}

	<Toaster />
	{showStatusModal && (<StatusModal message={statusMessage} type={statusType} showModal={showStatusModal} onClick={()=>setShowStatusModal(false)} />)} 

	{/* Dashboard links */}
	<section className='grid grid-rows-[auto_1fr] gap-1 mt-20 lg:mt-8 lg:grid-cols-4 lg:grid-rows-1'>   
		<DashboardLinks icon={faGraduationCap} text="Programs" page="Programs" count={count?.programs || 0} loading={countLoading}/>            
		<DashboardLinks icon={faCalendarDays} text="Deadlines" page="Tasks" count={count?.deadlines || 0} loading={countLoading}/>            
	</section>

	{/* Announcements */}
	<section className={` relative mt-4 mb-8 p-3 md:p-5 text-neutral-800 border-1 dark:border-gray-700 border-gray-300 rounded-3xl shadow-xl transition-all duration-500 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-900`}>
		<div className='flex flex-row items-center'>
			<FontAwesomeIcon icon={faBullhorn} className="p-2 dark:text-white" />
			<h2 className="mb-1 lg:mb-4 text-md lg:text-xl font-semibold text-neutral-800 dark:text-white">Announcements</h2>
		</div>

		{isAdmin && (
			<div onClick={() => {if (!isAdmin){toast.error('Admins only'); return} setShowAnnounceModal(true)}} className="absolute flex flex-row items-center justify-around px-2 md:px-5 py-0 md:py-1 transition-all duration-500 cursor-pointer top-4 md:top-5 right-5 rounded-3xl hover:bg-zuccini-600 active:bg-zuccini-500" >
				<FontAwesomeIcon icon={faPlus} className="mr-2 dark:text-white" />
				<h1 className="text-lg dark:text-white" >New</h1>
			</div>
		)}
				
		<div className="p-4 transition-all duration-500 rounded-lg bg-neutral-300 dark:bg-gray-950/50">
			{announcementsLoading ? (<p className="p-5 font-light text-center text-gray-700 transition-all duration-500 dark:text-white">Loading announcements...</p>) : announcements && announcements.length > 0 ? (
				<div className="space-y-3 max-h-[400px] overflow-y-auto" >
					{announcements.map((announcement, index) => (
						<div key={index} className="p-2 md:p-4 bg-gray-100 border border-gray-300 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
							<div className="flex flex-col md:flex-row items-start justify-between mb-2">
								<h3 className="font-semibold text-gray-800 dark:text-white">{announcement.announceTitle}</h3>
								<div className="flex items-center gap-2">
									<span className="text-sm text-gray-500 dark:text-gray-400">
										{announcement.duration ? new Date(announcement.duration).toLocaleDateString() : 'No date'}
									</span>
									<button onClick={() => {setShowDeleteConfirm(true); setSelectedAnnouncement(announcement)}}	className="px-2 py-1 text-xs text-red-600 transition-colors rounded hover:bg-red-100 dark:hover:bg-red-900" >Delete</button>
								</div>
							</div>

							<p className="mb-2 text-sm text-gray-600 dark:text-gray-300">{announcement.announceText}</p>
							<p className="text-xs text-gray-500 dark:text-gray-400">By: {announcement.author}</p>
						</div>
					))}
				</div>
			) : (<p className="p-5 font-light text-center text-gray-700 transition-all duration-500 dark:text-white">No new announcements</p>)}
		</div>
	</section>

	{showDeleteConfirm && (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"> 
			<div className='absolute flex flex-col items-center justify-center p-4 border border-gray-200 shadow-lg bg-red-50 w-100 rounded-xl dark:bg-gray-700 dark:border-gray-600 fade-in'>
				<div className='flex items-center justify-center mb-4 bg-red-200 rounded-full inset-shadow-sm w-18 h-18 inset-shadow-red-300'><FontAwesomeIcon icon={faTrash} className="m-auto text-4xl text-red-500"/></div>
				<h3 className='mb-2 text-xl font-bold text-gray-900 dark:text-white'>Delete Announcement</h3>
				<span className='mb-6 text-center text-gray-600 break-words dark:text-gray-300'>Are you sure you want to delete "<strong>{selectedAnnouncement.announceTitle}</strong>"?</span>
				<div className='flex gap-4'>
					<button onClick={() => handleDeleteAnnouncement(selectedAnnouncement.announceID)} className='px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700' >Yes</button>
					<button onClick={(e) => {e.stopPropagation();setShowDeleteConfirm(false)}} className='px-4 py-2 text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 dark:text-white dark:bg-gray-600 dark:hover:bg-gray-700' >No</button>
				</div>                                    
			</div>
		</div>
	)}

	{showAnnounceModal && (<AnnouncementModal setShowModal={setShowAnnounceModal} onCreate={handleCreateAnnouncement}/>)}

	{ isAdmin && (
		<section  className='grid gap-4 mt-4 grid-cols-1 md:grid-cols-2 grid-rows-2 lg:grid-rows-1' >

			{/* Pending Documents */}
			<div className="p-3 md:p-5 mb-5 transition-all duration-500 shadow-xl text-neutral-800 border-1 border-neutral-300 rounded-3xl inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:border-gray-900 dark:bg-gray-900" >
				<div className='flex flex-row'>
					<FontAwesomeIcon icon={faHourglassHalf}  className="p-2 transition-all duration-500 dark:text-white" />
					<h2 className="mb-4 text-xl font-semibold transition-all duration-500 text-neutral-800 dark:text-white">Pending Documents</h2>
				</div>
				<div className="overflow-auto gap-1 relative whitespace-nowrap flex flex-col p-2 rounded-lg h-60 bg-neutral-300 dark:border-gray-900 dark:bg-gray-950/50" >
					{pendingDocs.filter(doc => doc.pendingDocPath && typeof doc.pendingDocPath === 'string').map((pendingDoc)=> {
						const pathInfo = parseDocumentPath(pendingDoc)
						return (
							<p onClick={()=> handlePendingDocClick(pathInfo)} key={pendingDoc.pendingDocID} className=" text-gray-800 w-fit border-b border-gray-400 cursor-pointer hover:bg-gray-400 dark:text-white">
								<span className='font-semibold'>{pendingDoc.pendingDocName}</span><br/>
								{pathInfo.programCode}/{pathInfo.areaName}/{pathInfo.subareaName}/{pathInfo.criteria}/{pathInfo.criteriaNum}
							</p>
						)
					})}
				</div>
			</div>

			{/* Audit Logs */}                
			<div className="p-3 md:p-5 mb-5 transition-all duration-500 shadow-xl text-neutral-800 border-1 dark:border-gray-900 border-neutral-300 rounded-3xl inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-900">
				<div className='flex flex-row'>
					<FontAwesomeIcon icon={faGears} className="p-2 transition-all duration-500 dark:text-white" />
					<h2 className="mb-4 text-xl font-semibold transition-all duration-500 text-neutral-800 dark:text-white">Audit Logs</h2>
				</div>

				{/* Display logs */}                    
				<div className="overflow-auto rounded-lg h-60 bg-neutral-300 dark:bg-gray-950/50">
					<table className="w-full">
						<thead className="sticky top-0 border-b border-gray-400 bg-neutral-400 dark:bg-gray-900 dark:border-gray-800">
							<tr>
								<th className="px-4 py-2 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase dark:text-gray-300">Action</th>
								<th className="px-4 py-2 text-xs font-semibold tracking-wider text-right text-gray-700 uppercase dark:text-gray-300">Date & Time</th>
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
									<tr key={log.logID}	className="transition-colors duration-150 hover:bg-gray-400 dark:hover:bg-gray-800/70" >
										<td className="px-4 py-3">
											<div className="flex items-center gap-2">
												{isLogin && (<span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-200 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Login</span>)}
												{isDelete && (<span className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300">Delete</span>)}
												{isRate && (<span className="px-2 py-0.5 rounded-md text-xs font-medium bg-orange-200 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">Rate</span>)}
												{isCreate && (<span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Create</span>)}
												{isUpload && (<span className="px-2 py-0.5 rounded-md text-xs font-medium bg-purple-200 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">Upload</span>)}
												{isLoggedOut && (<span className="px-2 py-0.5 rounded-md text-xs font-medium bg-amber-200 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Logout</span>)}
												{isEdit && (<span className="px-2 py-0.5 rounded-md text-xs font-medium bg-teal-200 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">Edit</span>)}
												{isUpdate && (<span className="px-2 py-0.5 rounded-md text-xs font-medium bg-teal-200 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300">Update</span>)}
												{isDownload && (<span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Download</span>)}
												<span className="text-sm text-gray-700 transition-all duration-500 dark:text-white">{log.action}</span>
											</div>
										</td>
										<td className="px-4 py-3 text-sm text-right text-gray-700 transition-all duration-500 dark:text-white">{new Date(log.createdAt).toLocaleString()}</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	)}

	{/* Submission deadline section */}
	<section  className=' mb-5 grid grid-cols-1 gap-3 md:gap-6 md:grid-cols-2 grid-rows-[auto_1fr] w-full text-gray-900' >

		{/* Create deadline */}
		<div className="relative shadow-xl col-span-2 pt-3 px-3 min-h-[100px] border border-neutral-300 rounded-2xl transition-all duration-500 inset-shadow-sm inset-shadow-gray-400 dark:shadow-sm dark:shadow-zuccini-900 dark:bg-gray-900" >
			<h1 className="mx-3 my-1 font-medium text-md"><FontAwesomeIcon icon={faCalendarPlus} className="mr-2" />Create Submission Deadlines</h1>
			<form onSubmit={handleCreateDeadline}  className='grid grid-cols-1 grid-rows-[auto_1fr] md:grid-cols-4 md:grid-rows-1 md:gap-x-2' >

				{/* Select Department */}
				<div className="min-h-[100px] p-3 flex flex-col justify-center">
					<label htmlFor ="program"  className='mb-1 `text-lg font-extralight' >Program</label>
					<select name="program" id="program" value={program} onChange={(e)=> {setProgram(e.target.value)}} required  className='p-2 font-semibold transition-all duration-500 cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-gray-950/50' >
						<option value="">Select a Program</option>
						{programOption.map((program) => (
							<option key={program.programID} value={program.programID}>{program.programName}</option>
						))}
					</select>
				</div>
				
				{/* Select Area */}
				<div className="min-h-[100px] p-3 flex flex-col justify-center">
					<label htmlFor="area"  className='mb-1 text-lg font-extralight' >Area</label>
					<select name="area" id="area" value={selectedAreaOption} onChange={(e)=> {setSelectedAreaOption(e.target.value)}} required  className='p-2 font-semibold transition-all duration-500 cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-gray-950/50' >
						<option value="">Select an Area</option>
						{filteredAreaOptions.filter((area, index, self) => index === self.findIndex(a => a.areaID === area.areaID)).map((area) => (
							<option key={area.areaID} value={area.areaID}>{area.areaName}</option>
						))}
					</select>
				</div>

				{/* Select date of deadline */}
				<div  className="min-h-[100px] p-3 flex flex-col justify-center" >
					<label htmlFor="due_date"  className='mb-1 text-lg font-extralight' >Deadline</label>
					<input type="date" name="due_date" id="due_date" value={dueDate} onChange={(e)=> {setDueDate(e.target.value)}} required  className='p-2 font-semibold transition-all duration-500 border cursor-pointer dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none bg-neutral-300 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-gray-950/50' />  
				</div>

				{/* Create Deadline Btn*/}
				<input type="submit" value="Create Deadline" className='px-6 py-2 font-semibold text-gray-600 transition-colors duration-500 border-gray-500 shadow-xl cursor-pointer from-gray-300/50 via-gray-200 to-gray-400/50 dark:text-gray-200 hover:text-gray-200 place-self-center rounded-xl bg-gradient-to-br hover:from-zuccini-400 hover:via-zuccini-500 hover:to-zuccini-700 dark:from-gray-800/50 dark:via-gray-700 dark:to-gray-900/50' />

				{/* Deadline description */}
				<div className='flex flex-col md:col-span-4 px-3 py-3 '>
					<label htmlFor="content"  className='mb-1 text-lg font-extralight' >Description</label>
					<textarea name="content" value={content} id="content" placeholder={"Input the deadline description"} onChange={(e)=> {setContent(e.target.value)}} required  className='scrollbar-hide placeholder-neutral-500 whitespace-pre-line resize-y w-full min-h-[200px] px-4 py-3 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-gray-950/50 dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none' />
				</div>
			</form>
		</div>

		{/* Deadlines */}
		<div className="relative flex row-start-2 flex-col items-center p-3 border rounded-2xl shadow-xl inset-shadow-sm border-neutral-300 inset-shadow-gray-400 dark:bg-gray-900 dark:shadow-sm dark:shadow-zuccini-900">                    
			<div className='grid w-full grid-cols-3 font-medium text-center dark:text-white '>
				<h2>Program</h2>
				<h2>Task</h2>
				<h2>Deadline</h2>
			</div>

			{/* Deadline container */}
			<div className='flex flex-col items-center min-h-[500px] border-neutral-400 min-w-full p-1 bg-neutral-300 rounded-md border relative dark:bg-gray-950/50 ' >
				{deadLines && deadLines.length > 0 ? deadLines.map((deadline) => (
					<div key={deadline.deadlineID} onClick={() => handleViewDeadline(deadline)}  className='relative grid grid-cols-3 justify-center mt-2 border p-2  rounded-lg bg-neutral-200 transition-all duration-500 dark:bg-gray-900 hover:bg-neutral-300 dark:hover:bg-[#232228] cursor-pointer' >
						<div className='flex items-center px-2' >
							<FontAwesomeIcon icon={faAngleRight} className="mr-3 dark:text-white" />
							<h2 className='mb-1 text-2xl font-semibold tracking-widest text-center transition-all duration-500 text-neutral-600 text-wrap dark:text-white'>{deadline.programCode}</h2>
						</div>
						<h2 className='font-light transition-all duration-500 text-md place-self-center text-neutral-600 text-wrap dark:text-white'>{deadline.areaName}</h2>
						<h2 className='transition-all duration-500 text-md place-self-center text-neutral-600 dark:text-white'>{deadline.due_date}</h2>
		  			</div>
					)) : (<p className="m-auto text-lg text-center text-gray-500 font-extralight">No deadlines ahead.</p>
				)}            
			</div>

			{/* Display deadlines */}
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
		<div className="relative p-3 row-start-3 md:row-start-2 transition-all duration-500 bg-transparent border rounded-2xl shadow-xl border-neutral-300 inset-shadow-sm inset-shadow-gray-400 dark:shadow-sm dark:shadow-zuccini-900 dark:text-white dark:bg-gray-900 ">
			<FullCalendar 
				plugins={[dayGridPlugin]}
				initialView='dayGridMonth'
				headerToolbar={{start: 'title', center: '', end: 'today prev next'}}
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
	</>
)}

export const DashboardLinks = ({icon, text, page, count, loading = false}) =>{
	const navigate = useNavigate()
	return (
		<div onClick={() => navigate(`/${page}`)} className='relative flex flex-row items-center h-20 p-4 m-1 transition-all duration-500 shadow-xl cursor-pointer text-neutral-800 border-1 border-neutral-300 inset-shadow-sm inset-shadow-gray-400 dark:border-gray-800 rounded-3xl dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-900'>
			<div className='flex items-center justify-center p-2 w-12 h-12 bg-[#5ADF9C] rounded-full mr-3'><FontAwesomeIcon icon={icon}  className="text-2xl text-center text-neutral-800" /></div>
			<h1 className="text-xl font-semibold transition-all duration-500 text-shadow-sm dark:text-white">{text}</h1>
			<span className="absolute text-lg transition-all duration-500 right-6 dark:text-white">{loading ? '...' : count}</span>
		</div>
	)
}

export const Area = ({onClick, program, areaTitle, desc, progress, areaColor}) =>{
	return(
		<div onClick={onClick} className="relative mr-4 min-w-[300px] h-[210px] border-neutral-400 dark:border-neutral-800 border rounded-lg shadow-xl dark:shadow-sm dark:shadow-zuccini-700 overflow-hidden transition-all duration-500 hover:scale-105 cursor-pointer">
			<div style={{background: areaColor}}  className='h-[50%]'> 
				<div  className='absolute px-5 font-light border border-neutral-400 top-2 right-2 bg-neutral-200 rounded-xl dark:bg-gray-900 dark:text-white'>{program}</div>
				<CircularProgressBar progress={progress} circleWidth="75" positionX={"left-3"} positionY={"top-17"} placement={`absolute top-17 left-3`}/>           
			</div>      
			<div className='text-right h-[50%] p-3 bg-neutral-200 border-t-1 transition-all duration-500  dark:bg-gray-900 dark:text-white dark:border-t-neutral-600'>
				<h1 className='mb-4 text-2xl font-semibold text-wrap'>{areaTitle}</h1>
				<h2 className='text-lg truncate'>{desc}</h2>
			</div>
		</div> 
	)
}

export default Dashboard