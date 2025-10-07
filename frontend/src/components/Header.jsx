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
import { getCurrentUser } from '../utils/auth_utils';
import { apiGet, apiPut, apiDelete } from '../utils/api_utils';
import { getSocket } from '../utils/websocket_utils';
import NotifItem from './NotifItem';
import notificationSound from '../utils/notificationSound';


const Header = ({title}) => {    
    const [showProfile , setShowProfile] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [showMessages, setShowMessages] = useState(false);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(true);

    //state for message read status
    const [messageReadStatus, setMessageReadStatus] = useState({});

    //closes tab when clicked outside

    const profileRef = useRef(null);
    const notifRef = useRef(null);
    const messageRef = useRef(null);
    const iconContainerRef = useRef(null)
    const user = getCurrentUser()

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


    // Fetch notifications for header dropdown
    const fetchNotifications = async () => {
        try {
            setNotificationsLoading(true);
            console.log('🔔 Fetching notifications...');
            const response = await apiGet('/api/notifications?page=1&per_page=5');
            console.log('🔔 Notifications response:', response);
            if (response && response.success && response.data) {
                const notifications = response.data.notifications || [];
                setNotifications(notifications);
                console.log('🔔 Notifications set:', notifications);
            } else {
                console.error('Failed to fetch notifications:', response);
                setNotifications([]);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
        } finally {
            setNotificationsLoading(false);
        }
    };

    // Mark all notifications as read
    const markAllNotificationsAsRead = async () => {
        try {
            console.log('🔔 Marking all notifications as read...');
            const response = await apiPut('/api/notifications/mark-all-read');
            console.log('🔔 Mark as read response:', response);
            if (response && response.success) {
                setUnreadCount(0);
                console.log('🔔 All notifications marked as read - unread count set to 0');
            } else {
                console.error('🔔 Failed to mark notifications as read:', response);
            }
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
          console.log('🔔 Fetching unread count...');
          const response = await apiGet('/api/notifications/unread-count');
          console.log('🔔 Unread count response:', response);
          if (response && response.success && response.data) {
            const count = response.data.count || 0;
            setUnreadCount(count);
            console.log('🔔 Unread count set:', count);
          } else {
            setUnreadCount(0);
          }
        } catch (error) {
          console.error('Failed to fetch unread count:', error);
          setUnreadCount(0);
        }
      };

    // Delete a single notification from header list
    const handleDeleteNotification = async (notificationId, isRead) => {
        try {
            const res = await apiDelete(`/api/notifications/${notificationId}`)
            if (res && res.success) {
                setNotifications(prev => prev.filter(n => n.notificationID !== notificationId))
                if (!isRead) {
                    setUnreadCount((c) => Math.max(0, (c || 0) - 1))
                }
            }
        } catch (e) {
            console.error('Failed to delete notification from header', e)
        }
    }

    //closes tab when scrolling /notif header
    useEffect(() => {
        
          fetchUnreadCount();
          fetchNotifications();
          
          // Listen for real-time updates
          const socket = getSocket();
          if (socket) {
            // Join notification room
            console.log('🔔 Joining notification room...');
            socket.emit('join_notifications', (response) => {
              console.log('🔔 Join notifications response:', response);
            });
            
            socket.on('new_notification', (notification) => {
              console.log('🔔 New notification received:', notification);
              // Play notification sound
              notificationSound.playNotification();
              fetchUnreadCount();
              fetchNotifications();
            });
          }

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

    useEffect(() => {
        let alive = true;
        (async () => {
          try {
            setLoading(true);
            const res = await apiGet('/api/conversations');
            if (!alive) return;
            const conversations = res?.data?.conversations ?? [];
            const withLast = await Promise.all(
                conversations.map(async (c) => {
                    try {
                        const mRes = await apiGet(`/api/conversations/${c.conversationID}/message`);
                        const msgs = mRes?.data?.messages || [];
                        const last = msgs.length > 0 ? msgs[msgs.length - 1] : null;
                        return { ...c, lastMessage: last };
                    } catch {
                        return { ...c, lastMessage: null };
                    }
                })
            );
            const messagesWithAlerts = withLast.map(c => ({ ...c, alert: false }));
            setMessages(messagesWithAlerts);
            // Calculate unread message count (messages with alerts)
            const unreadCount = messagesWithAlerts.filter(c => c.alert).length;
            setUnreadMessageCount(unreadCount);
          } catch (err) {
            if (!alive) return;
            setError('Failed to load messages');
            console.error(err);
          } finally {
            if (alive) setLoading(false);
          }
        })();
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        const socket = getSocket();
        const currentId = getCurrentUser()?.employeeID;
        const onNewMessage = ({ conversationID, message }) => {
            setMessages(prev => {
                const idx = prev.findIndex(p => String(p.conversationID) === String(conversationID));
                if (idx === -1) return prev;
                const copy = [...prev];
                const conv = { ...copy[idx] };
                const isOwn = String(message.senderID) === String(currentId);
                conv.lastMessage = {
                    id: message.id,
                    content: isOwn ? `You: ${message.content}` : message.content,
                    createdAt: message.createdAt
                };
                if (!isOwn && !showMessages) {
                    conv.alert = true
                    // Play message sound
                    notificationSound.playMessageSound();
                }
                copy.splice(idx, 1);
                const updatedMessages = [conv, ...copy];
                // Update unread count
                const unreadCount = updatedMessages.filter(m => m.alert).length;
                setUnreadMessageCount(unreadCount);
                return updatedMessages;
            });
        };
        socket.on('new_message', onNewMessage);
        return () => { socket.off('new_message', onNewMessage); };
    }, []);
        



    return(
        <header className="fixed z-10 flex items-center w-full col-span-5 col-start-2 p-4 pl-10 mb-3 -mt-5 lg:relative lg:pl-5">
             <HeaderTitle title={title}/>
             {/* Profile, messages, notifications */}
        <div className='w-full'>
            <div 
            ref={iconContainerRef}
            className="absolute top-0 right-0 flex items-center justify-around w-full p-2 bg-gray-200 border border-gray-300 shadow-lg lg:rounded-3xl lg:top-4 lg:right-10 lg:w-45 lg:h-16 h-19 dark:bg-gray-900 dark:border-gray-800 dark:inset-shadow-sm dark:inset-shadow-zuccini-900 ">
                {/* Message button */}
                <div className="relative">
                    <FontAwesomeIcon 
                        icon={faComment} 
                        className="p-2 text-lg transition-all duration-500 rounded-lg cursor-pointer inset-shadow-sm inset-shadow-gray-400 bg-neutral-300 text-zuccini-800 lg:text-xl dark:text-zuccini-700 dark:bg-gray-800 dark:shadow-sm dark:shadow-zuccini-800"
                        onClick={() => {
                            setShowMessages((current) => {
                                const next = !current
                                if (next) {
                                    setMessages(prev => prev.map(m => ({ ...m, alert: false })))
                                    setMessageReadStatus({})
                                    setUnreadMessageCount(0); // Clear unread count when opened
                                }
                                return next
                            });
                            setShowNotification(false);
                            setShowProfile(false);
                        }} 
                    />
                    {unreadMessageCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                            {unreadMessageCount}
                        </span>
                    )}
                </div>
                {/* Notification button */}
                <div className="relative">
                    <FontAwesomeIcon 
                        icon={faBell} 
                        className="p-2 ml-2 text-xl text-center transition-all duration-500 rounded-lg cursor-pointer inset-shadow-sm inset-shadow-gray-400 bg-neutral-300 text-zuccini-800 dark:text-zuccini-700 dark:bg-gray-800 dark:shadow-sm dark:shadow-zuccini-800" 
                        onClick={ async () => {
                            setShowNotification ((current) => {
                                const next = !current;
                                if (next) {
                                    // Immediately clear the unread count when opening dropdown
                                    setUnreadCount(0);
                                    console.log('🔔 Notification dropdown opened - unread count set to 0');
                                    // Refresh notifications when opening dropdown
                                    fetchNotifications();
                                    // Mark all notifications as read when opening dropdown
                                    markAllNotificationsAsRead();
                                }
                                return next;
                            })
                            setShowMessages(false);
                            setShowProfile(false);
                        }}
                    />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                            {unreadCount}
                        </span>
                    )}
                </div>
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
                    icon={user.profilePic == null ? faCircleUser : user.profilePic} 
                    className="mb-4 text-7xl text-gray-400 dark:text-gray-700" 
                    />
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</h1>
                    <h2 className="text-sm text-gray-600 dark:text-gray-400">{user.email}</h2>
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
                            {notificationsLoading ? (
                                <h1 className='text-xl text-center text-neutral-600'>Loading notifications...</h1>
                            ) : notifications && notifications.length > 0 ? (
                                notifications.map((notification, index) => (
                                    <NotifItem 
                                        key={notification.notificationID || index} 
                                        picture={notification.sender?.profilePic || avatar1} 
                                        notifTitle={notification.title} 
                                        content={notification.content} 
                                        date={new Date(notification.createdAt).toLocaleDateString()} 
                                        alert={!notification.isRead} 
                                        link={notification.link} 
                                        type={notification.type}
                                        onDelete={() => handleDeleteNotification(notification.notificationID, notification.isRead)}
                                        onClose={() => setShowNotification(false)}
                                    />
                                )) 
                            ) : ( 
                                <h1 className='text-xl text-center text-neutral-600'>No new notifications</h1> 
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
                        {loading ? (
                            <h1 className='text-xl text-center text-neutral-600'>Loading…</h1>
                        ) : error ? (
                            <h1 className='text-xl text-center text-red-500'>{error}</h1>
                        ) : messages && messages.length > 0 ? (
                            messages.map((conv) => (
                                <Messages
                                    key={conv.conversationID}
                                    picture={conv.otherParticipant?.profilePic || avatar1}
                                    userName={conv.otherParticipant?.name || 'Conversation'}
                                    message={conv.lastMessage?.content || ''}
                                    time={conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt).toLocaleString() : ''}
                                    alert={!!conv.alert}
                                    messagesId={conv.conversationID}
                                    onMarkAsRead={(id) => setMessageReadStatus(prev => ({...prev, [id]: true}))}
                                    onClose={() => setShowMessages(false)}
                                />
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