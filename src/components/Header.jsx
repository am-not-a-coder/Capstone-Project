import { useState } from 'react';
import {
    faBell,
    faComment,
    faCircleUser,
    faAddressCard,
    faPenToSquare
}
from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


const Header = ({title}) => {
    const [showProfile , setShowProfile] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [showMessages, setShowMessages] = useState(false);

    
    const notifications = [
        {
            title: "Programs",
            content: "BSIT department has completed the Area I",
            alert: true
        },
        {
            title: "New Announcement",
            content: "Admin has uploaded a new announcement",
            alert: false
        },
    ]
    
    return(
        <header className="flex items-center col-start-2 col-span-5 mb-1 text-white p-4 relative">
             <HeaderTitle title={title}/>
             {/* Profile */}
            <div className="absolute top-2 right-2 flex justify-center items-center w-45 h-16 p-1 shadow-[5px_5px_10px_rgba(0,0,0,0.5)] rounded-3xl dark:inset-shadow-sm dark:inset-shadow-zuccini-900 dark:bg-[#19181A]">
                <FontAwesomeIcon 
                    icon={faComment} 
                    className="bg-neutral-300 text-zuccini-800 text-xl p-2 rounded-lg cursor-pointer dark:text-zuccini-700 dark:bg-[#242424] transition-all duration-500 " 
                    onClick={() => {
                        setShowMessages((current) => !current);
                        setShowNotification(false);
                        setShowProfile(false);
                    }} 
            />
                <FontAwesomeIcon 
                    icon={faBell} 
                    className="bg-neutral-300 text-zuccini-800 text-center text-xl p-2 rounded-lg ml-2 cursor-pointer dark:text-zuccini-700 dark:bg-[#242424] transition-all duration-500" 
                    onClick={ () => {
                        setShowNotification ((current) => !current)
                        setShowMessages(false);
                        setShowProfile(false);
                    }}
            />
                <FontAwesomeIcon 
                    icon={faCircleUser}
                    className="text-zuccini-800 text-4xl ml-8 cursor-pointer dark:text-zuccini-700 transition-all duration-500" 
                    onClick={ () => {
                        setShowProfile ((current) => !current);
                        setShowNotification(false);
                        setShowMessages(false);
                    }}
            />
            </div>
            


             {/* Shows the profile tab */}
            {showProfile && (
                <div className='absolute top-20 right-0 flex flex-col p-3 border border-neutral-900 bg-neutral-200 text-neutral-900 transition-all duration-500 dark:bg-[#19181A] min-w-[30%] rounded-2xl z-20'>
                        {/* profile preview */}
                        <div className='flex flex-col justify-center px-5 py-10 mb-5 bg-neutral-300 w-full rounded-xl inset-shadow-sm inset-shadow-neutral-400 dark:text-white dark:bg-woodsmoke-950 dark:inset-shadow-zuccini-900 dark:inset-shadow-sm'>
                            <FontAwesomeIcon 
                                icon={faCircleUser} 
                                className='text-6xl mb-5' 
                        />
                            <h1 className='text-xl text-center font-semibold mb-2' >John Doe</h1>
                            <h2 className='text-md text-center font-extralight'>johndoe123@gmail.com</h2>
                        </div>
                        {/* View Profile */}
                        <div className='flex items-center p-3 mb-5 bg-neutral-300 border-neutral-900 rounded-xl inset-shadow-xs inset-shadow-neutral-400  w-full text-xl transition-all duration-300 hover:text-white hover:bg-zuccini-700 dark:bg-woodsmoke-950 dark:text-white  dark:inset-shadow-zuccini-900 dark:inset-shadow-sm'>
                            <FontAwesomeIcon 
                                icon={faAddressCard} 
                                className='mr-4'
                        />
                            <h1 className='font-light'>View Profile</h1>
                        </div>
                        {/* Edit Profile */}
                        <div className='flex items-center p-3 bg-neutral-300 border-neutral-900 rounded-xl inset-shadow-xs inset-shadow-neutral-400 w-full text-xl transition-all duration-300 hover:text-white hover:bg-zuccini-700 dark:bg-woodsmoke-950 dark:text-white dark:inset-shadow-zuccini-900 dark:inset-shadow-sm'>
                            <FontAwesomeIcon 
                                icon={faPenToSquare} 
                                className='mr-5'
                        />
                            <h1 className='font-light'>Edit Profile</h1>
                        </div>
                </div>
            )}
            
            {/* Shows the Notification Tab*/}
            {showNotification && (
                 <div className='absolute top-20 right-0 flex flex-col p-3 border border-neutral-900 bg-neutral-200 text-neutral-900 transition-all duration-500 dark:text-white dark:inset-shadow-xs dark:inset-shadow-zuccini-800 dark:bg-[#19181A] min-w-[50%] rounded-2xl z-20'>
                        {/* Notification tab */}
                        <h1 className='text-xl font-medium mb-1'>
                            Notifications
                        </h1>
                       <div className='flex flex-col min-h-[300px] p-3 bg-neutral-300 w-full rounded-xl inset-shadow-sm inset-shadow-neutral-400 transition-all duration-500 dark:text-white dark:bg-woodsmoke-950 dark:inset-shadow-zuccini-900 dark:inset-shadow-sm'>
                            {notifications && notifications.length > 0 ? (
                            notifications.map((notification, index) => (
                                <Notifications key={index} notifTitle={notification.title} content={notification.content} alert={notification.alert}/>
                            )) 
                        ) : ( <h1 className='text-center text-neutral-600'>No new notifications</h1> 
                        )}
                        </div>
                </div>
            )}

            {/* Messages */}
            {showMessages && (
                 <div className='absolute top-20 right-0 flex flex-col p-3 border border-neutral-900 bg-neutral-200 text-neutral-900 dark:bg-[#19181A] min-w-[38%] rounded-2xl z-20'>
                        
                        <div className='flex flex-col justify-center px-5 py-10 min-h-[300px] bg-neutral-300 w-full rounded-xl dark:text-white dark:bg-woodsmoke-950 dark:inset-shadow-xs dark:inset-shadow-zuccini-800'>
                            
                        </div>
                        {/* View Profile */}
                       
                </div>
            )}

        </header>
    )

};

//generates the Header Title

export const HeaderTitle = ({title}) => {
    return(
     <h1 className="ml-2 text-neutral-900 text-5xl font-semibold text-shadow-lg dark:text-white">{title}</h1>   
    )

}

//generates the notification div

export const Notifications = ({notifTitle, content, alert}) => {
    return(
        
    <div className='flex items-center w-full min-h-[50px] p-3 border mb-2 rounded-xl bg-neutral-200 shadow-md transition-transform duration-200 cursor-pointer hover:shadow-lg hover:scale-101 dark:border-none dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm '>
        {/* Hole */}
        <div className="h-5 w-5 bg-neutral-300 inset-shadow-sm inset-shadow-neutral-400 rounded-full mr-5 transition-all duration-500 dark:bg-woodsmoke-950 dark:inset-shadow-xs dark:inset-shadow-zuccini-600"></div>
        <div>
            <h1 className='flex items-center text-md font-bold'>
                {notifTitle} 
                {alert && (
                <span className='h-2.5 w-2.5 bg-blue-500 rounded-full ml-2'>{alert}</span>)}
            </h1>
            
            <p className='ml-5 text-md truncate'>{content}</p>
        </div>
    </div>
    )
}


export default Header;