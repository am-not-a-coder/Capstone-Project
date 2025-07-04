import { Link } from 'react-router-dom'
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


const Header = ({title}) => {
    const [showProfile , setShowProfile] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [showMessages, setShowMessages] = useState(false);

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
            title: "Programs",
            content: "BSIT department has completed the Area I",
            date: "06/20/2025",
            alert: true
        },
        {
            title: "New Announcement",
            content: "Admin has uploaded a new announcement",
            date: "06/20/2025",
            alert: false
        },
    ]
    //static message data
    const messages = [
        {
            profilePic: avatar1,
            user: 'Miguel Derick Pangindian',
            message: 'WHY DID YOU REDEEM IT?!?!?',
            time: '3m',
            alert: true
        },
        {
            profilePic: avatar2,
            user: 'Jayson Permejo',
            message: "Hello? How are you, I'm under the water, I'm so much drowning, bulululul",
            time: '5h',
            alert: true
        },
        {
            profilePic: avatar3,
            user: 'Rafael Caparic',
            message: "Nothing beats a jet2 holiday!",
            time: '4d',
            alert: true
        }
    ]



    return(
        <header className="relative flex items-center col-span-5 col-start-2 p-4 mb-3 text-white">
             <HeaderTitle title={title}/>
             {/* Profile, messages, notifications */}
        <div className='relative w-full'>
            <div 
            ref={iconContainerRef}
            className="fixed top-4 right-10 flex justify-center items-center w-45 h-16 p-1 shadow-[5px_5px_10px_rgba(0,0,0,0.5)] bg-neutral-200 rounded-3xl dark:inset-shadow-sm dark:inset-shadow-zuccini-900 dark:bg-[#19181A] z-20">
                {/* Message button */}
                <FontAwesomeIcon 
                    icon={faComment} 
                    className="bg-neutral-300 text-zuccini-800 text-xl p-2 rounded-lg cursor-pointer dark:text-zuccini-700 dark:bg-[#242424] transition-all duration-500 "
                    onClick={() => {
                        setShowMessages((current) => !current);
                        setShowNotification(false);
                        setShowProfile(false);
                    }} 
            />
                {/* Notification button */}
                <FontAwesomeIcon 
                    icon={faBell} 
                    className="bg-neutral-300 text-zuccini-800 text-center text-xl p-2 rounded-lg ml-2 cursor-pointer dark:text-zuccini-700 dark:bg-[#242424] transition-all duration-500" 
                    onClick={ () => {
                        setShowNotification ((current) => !current)
                        setShowMessages(false);
                        setShowProfile(false);
                    }}
            />
                {/* Profile button */}
                <FontAwesomeIcon 
                    icon={faCircleUser}
                    className="ml-8 text-4xl transition-all duration-500 cursor-pointer text-zuccini-800 dark:text-zuccini-700" 
                    onClick={ () => {
                        setShowProfile ((current) => !current);
                        setShowNotification(false);
                        setShowMessages(false);
                    }}
            />
            </div>
            
            {/* Shows the profile tab */}
            {showProfile && (
                <div ref={profileRef} className='fixed top-25 right-8 flex flex-col p-3 border-2 border-neutral-500 bg-neutral-200 text-neutral-900 transition-all duration-500 dark:border-zuccini-950 dark:bg-[#19181A] w-[350px] rounded-2xl z-20'>
                     <h1 className='mb-1 ml-2 text-2xl font-medium dark:text-white'>
                        Profile
                    </h1>
                        {/* profile preview */}
                        <div className='flex flex-col justify-center w-full px-5 py-10 mb-5 border rounded-lg dark:bg-woodsmoke-950 dark:inset-shadow-zuccini-900 dark:inset-shadow-sm'>
                            <FontAwesomeIcon 
                                icon={faCircleUser} 
                                className='mb-5 text-6xl dark:text-white' 
                        />
                            <h1 className='mb-2 text-xl font-semibold text-center dark:text-white'>John Doe</h1>
                            <h2 className='text-center text-md font-extralight dark:text-white'>johndoe123@gmail.com</h2>
                        </div>
                        {/* View Profile */}
                        <Link to='/Profile' className='flex items-center w-full p-3 mb-5 text-xl transition-all duration-300 bg-neutral-300 border-neutral-900 rounded-xl inset-shadow-xs inset-shadow-neutral-400 hover:text-white hover:bg-zuccini-700 dark:bg-woodsmoke-950 dark:text-white dark:inset-shadow-zuccini-900 dark:inset-shadow-sm'>
                            <FontAwesomeIcon 
                                icon={faAddressCard} 
                                className='mr-4'
                        />
                            <h1 className='font-light'>View Profile</h1>
                        </Link>
                        {/* Edit Profile */}
                        <Link to="/Profile#edit-profile" className='flex items-center w-full p-3 text-xl transition-all duration-300 bg-neutral-300 border-neutral-900 rounded-xl inset-shadow-xs inset-shadow-neutral-400 hover:text-white hover:bg-zuccini-700 dark:bg-woodsmoke-950 dark:text-white dark:inset-shadow-zuccini-900 dark:inset-shadow-sm'>
                            <FontAwesomeIcon 
                                icon={faPenToSquare} 
                                className='mr-5'
                        />
                            <h1 className='font-light'>Edit Profile</h1>
                        </Link>
                </div>
            )}
            
            
            {/* Shows the Notification Tab*/}
            {showNotification && (
                 <div ref={notifRef}  className='fixed top-25 right-8 flex flex-col w-[300px] min-w-[35%] p-3 border-2 border-neutral-500 bg-neutral-200 text-neutral-900 transition-all duration-500 dark:border-zuccini-950 dark:text-white dark:inset-shadow-xs dark:inset-shadow-zuccini-800 dark:bg-[#19181A] rounded-2xl z-20'>
                        {/* Notification tab */}
                        <h1 className='mb-1 ml-2 text-2xl font-medium'>
                            Notifications
                        </h1>
                       <div className='flex flex-col min-h-[300px] p-3 bg-neutral-300 w-full rounded-xl inset-shadow-sm inset-shadow-neutral-400 transition-all duration-500 dark:text-white dark:bg-woodsmoke-950 dark:inset-shadow-zuccini-900 dark:inset-shadow-sm'>
                            {notifications && notifications.length > 0 ? (
                            notifications.map((notification, index) => (
                                <Notifications key={index} notifTitle={notification.title} content={notification.content} date={notification.date} alert={notification.alert}/>
                            )) 
                        ) : ( <h1 className='text-xl text-center text-neutral-600'>No new notifications</h1> 
                        )}
                        </div>
                </div>
            )}

            {/* Messages */}
            {showMessages && (
                <div ref={messageRef} className='fixed top-25 right-8 flex flex-col min-w-[40%] p-3 border-2 border-neutral-500 bg-neutral-200 text-neutral-900 dark:border-zuccini-950 dark:bg-[#19181A] rounded-2xl z-20'>            
                    <h1 className='mb-1 ml-2 text-2xl font-medium dark:text-white'>
                        Messages
                    </h1>
                    <div className='flex flex-col p-3 min-h-[300px] bg-neutral-300 w-full rounded-xl dark:text-white dark:bg-woodsmoke-950 dark:inset-shadow-xs dark:inset-shadow-zuccini-800'>
                        {messages && messages.length > 0 ? (
                            messages.map((message, index) => (
                                <Messages key={index} picture={message.profilePic} userName={message.user} message={message.message} time={message.time} alert={message.alert}/>
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
     <h1 className="ml-2 text-5xl font-semibold text-neutral-900 text-shadow-lg dark:text-white">{title}</h1>   
    )

}

//generates the notification div

export const Notifications = ({notifTitle, content, date, alert}) => {
    return(
        
    <div className='relative flex items-center w-full min-h-[50px] p-3 border mb-2 rounded-xl bg-neutral-200 shadow-md transition-transform duration-200 cursor-pointer hover:shadow-lg hover:scale-101 dark:border-none dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm '>
        {/* Hole */}
        <div className="w-5 h-5 mr-5 transition-all duration-500 rounded-full bg-neutral-300 inset-shadow-sm inset-shadow-neutral-400 dark:bg-woodsmoke-950 dark:inset-shadow-xs dark:inset-shadow-zuccini-600"></div>
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

export const Messages = ({picture, userName, message, time, alert}) => {

    return (
        <div className='relative flex items-center w-full min-h-[50px] p-3 border mb-2 rounded-xl bg-neutral-200 shadow-md transition-transform duration-200 cursor-pointer hover:shadow-lg hover:scale-101 dark:border-none dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm '>
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