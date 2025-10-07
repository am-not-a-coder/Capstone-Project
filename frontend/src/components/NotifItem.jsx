import React from 'react'
import { useNavigate } from 'react-router-dom';

const NotificationItem = ({ 
  picture, 
  notifTitle, 
  content, 
  date, 
  alert, 
  link, 
  onDelete, 
  onMarkRead,
  onClose,
  type
}) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (alert && onMarkRead) {
      onMarkRead(); // Mark as read when clicked
    }
    if (link) {
      // Use client-side navigation for internal links
      const isAbsolute = /^(?:[a-z]+:)?\/\//i.test(link);
      if (isAbsolute) {
        window.location.href = link;
      } else {
        navigate(link);
      }
    }
    if (onClose) {
      onClose(); // Close dropdown if in header
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent triggering the main click handler
    if (onDelete) {
      onDelete();
    }
  };

  const isAnnouncement = String(type).toLowerCase() === 'announcement';

  return (
    <div 
      onClick={handleClick}
      className={`relative flex items-center w-full min-h-[70px] p-3 mt-1 rounded-xl shadow-md transition-transform duration-200 cursor-pointer inset-shadow-sm hover:shadow-lg hover:scale-101
        ${isAnnouncement 
          ? 'border border-blue-400 bg-blue-50 dark:bg-gray-900 dark:border-blue-700' 
          : 'border border-neutral-400 bg-neutral-200 inset-shadow-gray-400 dark:bg-gray-950 dark:shadow-sm dark:shadow-zuccini-900'}`}
    >
      {/* Leading visual */}
      {isAnnouncement ? (
        <div className='flex items-center justify-center w-10 h-10 mr-3 text-xl rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'>
          📢
        </div>
      ) : (
        <img 
          src={picture} 
          alt="profile picture"
          className='w-10 h-10 mr-3 rounded-full'
        />
      )}

      {/* Notification content */}
      <div className='w-full'>
        <h1 className='flex items-center font-bold text-md'>
          {isAnnouncement ? `Announcement: ${notifTitle}` : notifTitle}
          {alert && (
            <span className={`${isAnnouncement ? 'bg-blue-500' : 'bg-blue-500'} w-2 h-2 ml-2 rounded-full`}></span>
          )}
        </h1>
        <p className={`truncate text-md ${isAnnouncement ? '' : 'ml-5'}`}>{content}</p>

        {/* Date and Delete button */}
        <div className='absolute flex flex-col items-end mt-1 ml-5 top-2 right-5 text-neutral-500 dark:text-white'>
          <span>{date}</span>
          <button
            onClick={handleDeleteClick}
            className='px-2 mt-1 text-base font-medium text-red-400 rounded-full cursor-pointer hover:bg-neutral-300 dark:hover:bg-neutral-800 w-fit'
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationItem