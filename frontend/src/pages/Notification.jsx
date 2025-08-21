import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import NotificationItem from '../components/NotifItem';
import avatar1 from '../assets/avatar1.png';
import avatar2 from '../assets/avatar2.png';
import avatar3 from '../assets/avatar3.png';


const notificationData = [
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
  },
  {
    profilePic: avatar1,
    title: "Accreditation",
    content: "Accreditation for BSCS program is due next month.",
    date: "05/15/2025",
    alert: false,
    link: "/Accreditation"
  },
  {
    profilePic: avatar2,
    title: "Users",
    content: "New user has registered in the system.",
    date: "06/20/2025",
    alert: true,
    link: "/Users"
  }
];

const Notification = () => {
  // state to hokld notifications
  const [notifications, setNotifications] = useState(notificationData);

  const [view, setView] = useState('all'); // state to manage view type

  const [confirmDelete, setConfirmDelete] = useState(false); // state to manage confirm delete

  //handles delete one notifcation
  const handleDelete = (indexToRemove) => {
    setNotifications(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  //handles delete all notfications
  const handleDeleteAll = () => {
    setNotifications([]);
  }

  // filter notifications based on veiew type
  const filteredNotifications = view === 'all'
    ? notifications
    : notifications.filter((notif) => notif.alert); // only show alerts if "unread" is selected

  return (
      <div className="relative border border-neutral-400 rounded-[20px] min-w-[950px] shadow-md p-2 pb-4 bg-neutral-200 text-neutral-900 inset-shadow-sm inset-shadow-gray-400 dark:text-white dark:bg-gray-900 dark:shadow-md dark:shadow-zuccini-800">

        {/* All and Unread Filter*/}
        <div className='flex gap-4 mt-2'>
          <button
            onClick={() => setView('all')}
            className={`px-4 py-1 font-medium transition-colors rounded-full cursor-pointer ${view === 'all' ? 'bg-blue-500 text-white' : 'text-black bg-neutral-300 dark:text-white dark:bg-neutral-800'}`}
          >
            All
          </button>

          <button
            onClick={() => setView('unread')}
            className={`px-4 py-1 font-medium transition-colors rounded-full cursor-pointer ${view === 'unread' ? 'bg-blue-500 text-white' : 'text-black bg-neutral-300 dark:text-white dark:bg-neutral-800'}`}
          >
            Unread
          </button>
        </div>

        {/* Delete All Notificatios */}
        <button
          onClick={handleDeleteAll}
          className='absolute z-0 px-2 text-base font-bold text-red-500 rounded-full cursor-pointer top-5 right-5 hover:bg-neutral-300 dark:hover:bg-neutral-800'
        >
          Delete All
        </button>

        
        
        {/* Notifications List */}
        <div className='grid gap-1 pt-3'>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <NotificationItem 
                key={index}
                picture={notification.profilePic}
                notifTitle={notification.title}
                content={notification.content}
                date={notification.date}
                alert={notification.alert}
                link={notification.link}

                onDelete={() => handleDelete(index)}
              />
            ))
          ) : (
            <p className='text-lg italic text-gray-500'>No new notifications</p>
          )}
        </div>
      </div>
  );
};

export default Notification;