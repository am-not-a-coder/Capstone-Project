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
  onClose 
}) => {
  const handleClick = () => {
    if (alert && onMarkRead) {
      onMarkRead(); // Mark as read when clicked
    }
    if (link) {
      // Navigate to the link
      window.location.href = link;
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

  return (
    <div 
    onClick={handleClick}
    className='relative flex items-center w-full min-h-[70px] p-3 border border-neutral-400 mt-1 rounded-xl bg-neutral-200 shadow-md transition-transform duration-200 cursor-pointer inset-shadow-sm inset-shadow-gray-400 hover:shadow-lg hover:scale-101 dark:hover:shadow-md dark:hover:shadow-zuccini-800 dark:bg-gray-950 dark:shadow-sm dark:shadow-zuccini-900'>

      {/* Profile Pic */}
      <img 
        src={picture} 
        alt="profile picture"
        className='w-10 h-10 mr-3 rounded-full'
      />
      
      {/* Notification contnent */}
      <div className='w-full'>
        <h1 className='flex items-center font-bold text-md'>
          {notifTitle}
          {alert && (
            <span className='w-2 h-2 ml-2 bg-blue-500 rounded-full'></span>
          )}
        </h1>

        <p className='ml-5 truncate text-md'>{content}</p>
        
        {/* Date and Delte buttonn */}
        <div className='absolute flex flex-col items-end mt-1 ml-5 top-2 right-5 text-neutral-500 dark:text-white'>
          <span>{date}</span>

          {/* Delete button */}
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