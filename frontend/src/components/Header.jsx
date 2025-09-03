import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react';    
import {
    faBell,
    faComment,
    faCircleUser,
    faAddressCard,
    faPenToSquare
}
from '@fortawesome/free-solid-svg-icons';
import avatar1 from '../assets/avatar1.png';
import avatar2 from '../assets/avatar2.png';
import avatar3 from '../assets/avatar3.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';



const Header = ({title}) => {
    //location detection
    const location = useLocation();

    const [showProfile , setShowProfile] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [showMessages, setShowMessages] = useState(false);

    //state for message read status
    const [messageReadStatus, setMessageReadStatus] = useState({});

    //closes tab when clicked outside

    const profileRef = useRef(null);
    const notifRef = useRef(null);
    const messageRef = useRef(null);
    const iconContainerRef = useRef(null)

    useEffect( () => {
        const handleOutsideClick = (e) => {
            if (
                iconContainerRef.current &&
                !iconContainerRef.current.contains(e.target) &&
                (!profileRef.current || !profileRef.current.contains(e.target)) &&
                (!notifRef.current || !notifRef.current.contains(e.target)) &&
                (!messageRef.current || !messageRef.current.contains(e.target))
            ){
                setShowProfile(false)
                setShowNotification(false)
                setShowMessages(false)
            }

        }

        document.addEventListener('mousedown', handleOutsideClick)
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
        }

    },[showProfile, showNotification, showMessages])

    //closes tab when scrolling
    useEffect(() => {
        const handleScroll = () =>{
            setShowProfile(false)
            setShowNotification(false)
            setShowMessages(false)
        }
        window.addEventListener('scroll', handleScroll)

        //gets the scrollable main div
        const mainScroll = document.getElementById('main-scroll');
        if(mainScroll){
            mainScroll.addEventListener('scroll', handleScroll)
        }
        
        return () => {
        window.removeEventListener('scroll', handleScroll)
        mainScroll.removeEventListener('scroll', handleScroll)
        }
    },[])
        


    //static notif data
    const notifications = [
        {
            profilePic: avatar1,
            title: "Programs",
            content: "BSIT department has completed the Area I.",
            date: "06/20/2025",
            alert: true,
            link: "/Programs"
        },
        {
            profilePic: avatar2,
            title: "New Announcement",
            content: "Admin has uploaded a new announcement.",
            date: "06/20/2025",
            alert: false,
            link: "/Dashboard"
        },
        {
            profilePic: avatar3,
            title: "Documents",
            content: "New document has been uploaded to the system.",
            date: "06/29/2025",
            alert: true,
            link: "/Documents"
        }
    ]
    //static message data
    const messages = [
        {
            id: 1,
            profilePic: avatar1,
            user: 'Miguel Derick Pangindian',
            message: 'WHY DID YOU REDEEM IT?!?!?',
            time: '3m',
            alert: !messageReadStatus[1] //check if read
        },
        {
            id: 2,
            profilePic: avatar2,
            user: 'Jayson Permejo',
            message: "Hello? How are you, I'm under the water, I'm so much drowning, bulululul",
            time: '5h',
            alert: !messageReadStatus[2]
        },
        {
            id: 3,
            profilePic: avatar3,
            user: 'Rafael Caparic',
            message: "Nothing beats a jet2 holiday!",
            time: '4d',
            alert: false
        }
    ]



    return(
        <header className="fixed z-10 flex items-center w-full col-span-5 col-start-2 p-4 pl-10 mb-3 -mt-5 lg:relative lg:pl-5">
             <HeaderTitle title={title}/>
             {/* Profile, messages, notifications */}
        <div className='w-full'>
            <div 
            ref={iconContainerRef}
            className="absolute top-0 right-0 flex items-center justify-around w-full p-2 bg-gray-200 border border-gray-300 shadow-lg lg:rounded-3xl lg:top-4 lg:right-10 lg:w-45 lg:h-16 h-19 dark:bg-gray-900 dark:border-gray-800 dark:inset-shadow-sm dark:inset-shadow-zuccini-900 ">
                {/* Message button */}
                <FontAwesomeIcon 
                    icon={faComment} 
                    className="p-2 text-lg transition-all duration-500 rounded-lg cursor-pointer inset-shadow-sm inset-shadow-gray-400 bg-neutral-300 text-zuccini-800 lg:text-xl dark:text-zuccini-700 dark:bg-gray-800 dark:shadow-sm dark:shadow-zuccini-800"
                    onClick={() => {
                        setShowMessages((current) => !current);
                        setShowNotification(false);
                        setShowProfile(false);
                    }} 
            />
                {/* Notification button */}
                <FontAwesomeIcon 
                    icon={faBell} 
                    className="p-2 ml-2 text-xl text-center transition-all duration-500 rounded-lg cursor-pointer inset-shadow-sm inset-shadow-gray-400 bg-neutral-300 text-zuccini-800 dark:text-zuccini-700 dark:bg-gray-800 dark:shadow-sm dark:shadow-zuccini-800" 
                    onClick={ () => {
                        setShowNotification ((current) => !current)
                        setShowMessages(false);
                        setShowProfile(false);
                    }}
            />
                {/* Profile button */}
                <FontAwesomeIcon 
                    icon={faCircleUser}
                    className="ml-2 text-4xl transition-all duration-500 rounded-full p-0.5 cursor-pointer inset-shadow-sm inset-shadow-gray-400 lg:ml-6 text-zuccini-800 dark:shadow-sm dark:shadow-zuccini-600 dark:text-zuccini-700" 
                    onClick={ () => {
                        setShowProfile ((current) => !current);
                        setShowNotification(false);
                        setShowMessages(false);
                    }}
            />
            </div>
            
            {/* Shows the profile tab */}
            {showProfile && (
                <div 
                ref={profileRef} 
                className="fixed top-24 right-8 flex flex-col p-5 bg-gray-300 dark:bg-gray-900 
                            border border-gray-200 dark:border-gray-700 shadow-2xl w-[340px] 
                            rounded-2xl z-20 transition-all duration-500"
                >
                {/* Header */}
                <h1 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
                    Profile
                </h1>

                {/* Profile Preview */}
                <div className="flex flex-col items-center border-neutral-400 border p-6 mb-6 rounded-xl bg-gray-200 inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-950/50 dark:shadow-md dark:shadow-zuccini-800 ">
                    <FontAwesomeIcon 
                    icon={faCircleUser} 
                    className="mb-4 text-7xl text-gray-400 dark:text-gray-700" 
                    />
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">John Doe</h1>
                    <h2 className="text-sm text-gray-600 dark:text-gray-400">johndoe123@gmail.com</h2>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <Link 
                    to="/Profile" 
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 transition-all duration-200 rounded-xl bg-gray-100 inset-shadow-sm inset-shadow-gray-400 hover:bg-zuccini-700 hover:text-white dark:bg-gray-950/50 dark:shadow-md dark:shadow-zuccini-900 dark:text-gray-200 dark:hover:bg-zuccini-800"
                    >
                    <FontAwesomeIcon icon={faAddressCard} className="text-lg" />
                    <span className="font-medium">View Profile</span>
                    </Link>

                    <Link 
                    to="/Profile#edit-profile" 
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 transition-all duration-200 rounded-xl bg-gray-200 inset-shadow-sm inset-shadow-gray-400 hover:bg-zuccini-700 hover:text-white dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-950/50 dark:text-gray-200 dark:hover:bg-zuccini-800"
                    >
                    <FontAwesomeIcon icon={faPenToSquare} className="text-lg" />
                    <span className="font-medium">Edit Profile</span>
                    </Link>
                </div>
                </div>
                )}

            
            {/* Shows the Notification Tab*/}
            {showNotification && (
                 <div ref={notifRef}  className='fixed top-25 right-8 flex flex-col w-[300px] min-w-[35%] p-3 border-2 border-neutral-500 bg-neutral-200 text-neutral-900 transition-all duration-500 dark:border-gray-800 dark:text-white dark:inset-shadow-xs dark:inset-shadow-zuccini-800 dark:bg-gray-900 rounded-2xl z-20'>
                        {/* Notification tab */}
                        <div className='flex items-center justify-between'>
                            <h1 className='mb-1 ml-2 text-2xl font-medium'>
                                Notifications
                            </h1>
                            <Link className='px-2 ml-2 text-lg font-medium text-blue-500 hover:bg-neutral-300 dark:hover:bg-neutral-800'
                            to='/Notification'
                            onClick={() => (setShowNotification(false))}
                            >See All
                            </Link>
                        </div>
                       <div className='flex flex-col min-h-[300px] p-3 bg-neutral-300 w-full rounded-xl inset-shadow-sm inset-shadow-neutral-400 transition-all duration-500 dark:text-white dark:border-gray-800 dark:bg-gray-950 dark:inset-shadow-zuccini-900 dark:inset-shadow-sm'>
                            {notifications && notifications.length > 0 ? (
                            notifications.map((notification, index) => (
                                <Notifications key={index} picture={notification.profilePic} notifTitle={notification.title} content={notification.content} date={notification.date} alert={notification.alert} link={notification.link} onClose={() => setShowNotification(false)}/>
                            )) 
                        ) : ( <h1 className='text-xl text-center text-neutral-600'>No new notifications</h1> 
                        )}
                        </div>
                </div>
            )}

            {/* Messages */}
            {showMessages && (
                <div ref={messageRef} className='z-1000 fixed top-25 right-8 flex flex-col min-w-[40%] p-3 border-2 border-neutral-500 dark:border-gray-800 bg-neutral-200 text-neutral-900  dark:bg-gray-900 rounded-2xl '>  
                    <div className='flex items-center justify-between'>      
                        <h1 className='mb-1 ml-2 text-2xl font-medium dark:text-white'>
                            Messages
                        </h1>
                        <Link className='px-2 ml-2 text-lg font-medium text-blue-500 hover:bg-neutral-300 dark:hover:bg-neutral-800'
                        to='/Messages'
                        onClick={() => setShowMessages(false)}
                        >See All
                        </Link>
                    </div>    
                    <div className='flex flex-col p-3 min-h-[300px] bg-neutral-300 w-full rounded-xl dark:text-white dark:bg-gray-950 dark:inset-shadow-xs dark:inset-shadow-zuccini-800'>
                        {messages && messages.length > 0 ? (
                            messages.map((message, index) => (
                                <Messages key={index} picture={message.profilePic} userName={message.user} message={message.message} time={message.time} alert={message.alert} messagesId={message.id} onMarkAsRead={(id) => setMessageReadStatus(prev => ({...prev, [id]: true}))} onClose={() => setShowMessages(false)}/>
                            ))
                        ) : (
                            <h1 className='text-xl text-center text-neutral-600'>No new messages</h1>
                        )}
                    </div>
                </div>
            )}
        </div>
        </header>
    )

};

//generates the Header Title

export const HeaderTitle = ({title}) => {
    return(
     <h1 className="z-[60] fixed lg:relative top-3 ml-2 text-2xl lg:text-5xl font-semibold text-neutral-900 text-shadow-md dark:text-shadow-zuccini-900 dark:text-white">{title}</h1>   
    )

}

//generates the notification div

export const Notifications = ({notifTitle, content, date, alert, picture, link, onClose}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if(link) {
            navigate(link); // Navigate to the specified link
        }
        onClose(); //auto close dropdown
    };

    return(
        
    <div 
    onClick={handleClick}
    className='relative flex items-center w-full min-h-[50px] p-3 border mb-2 rounded-xl bg-neutral-200 shadow-md transition-transform duration-200 cursor-pointer hover:shadow-lg hover:scale-101 dark:border-none dark:bg-gray-900 dark:inset-shadow-zuccini-900 dark:inset-shadow-sm'>
        {/* Hole */}
        <img 
        src={picture} 
        alt="profile picture" 
        className='w-10 h-10 mr-3 rounded-full'
        />
        <div>
            <h1 className='flex items-center font-bold text-md'>
                {notifTitle}
                {alert && (
                <span className='h-2.5 w-2.5 bg-blue-500 rounded-full ml-2'>{alert}</span>)}
            </h1>
             <p className='absolute text-sm font-light top-2 right-5 text-neutral-500 dark:text-white'>{date}</p>
            <p className='ml-5 truncate text-md'>{content}</p>
           
        </div>
    </div>
    )
}

//generates the message div

export const Messages = ({picture, userName, message, time, alert, messagesId, onMarkAsRead, onClose}) => {
    const navigate = useNavigate();
    const location = useLocation(); //get current location

    //handles click navigation to messgs page with specfiic convo
    const handleMessageClick = () => {
        onMarkAsRead(messagesId); //mark as read
        onClose(); //auto close dropdown
        navigate(`/Messages?openConversation=${messagesId}`);
        
    }

    return (
        <div 
        onClick={handleMessageClick}
        className='relative flex items-center w-full min-h-[50px] p-3 border mb-2 rounded-xl bg-neutral-200 shadow-md transition-transform duration-200 cursor-pointer hover:shadow-lg hover:scale-101 dark:border-none dark:bg-gray-900 dark:inset-shadow-zuccini-900 dark:inset-shadow-sm '>
            <img 
            src={picture} 
            alt="profile picture"
            className='w-10 h-10 mr-3 rounded-full'
            />

            <div className="flex flex-col w-[50%]">
             <h1 className='flex items-center font-bold text-md'>
                {userName}
                {alert && (
                <span className='h-2.5 w-2.5 bg-blue-500 rounded-full ml-2'>{alert}</span>)}
                <p className='ml-2 text-sm font-light text-neutral-500 dark:text-white'>{time}</p>
            </h1>
            <p className='ml-3 text-sm font-light truncate'>{message}</p>
            </div>
        </div>
    )
}



export default Header;