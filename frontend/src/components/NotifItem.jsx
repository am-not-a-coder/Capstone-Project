import React from 'react'
import { useNavigate } from 'react-router-dom';

const NotificationItem = ({ notifTitle, content, date, alert, picture, link, onDelete}) => {
  const navigate = useNavigate(); 

  // Handle click to navigate to the link
  const handleClick = () => {
    if (link) {
      navigate(link);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); //prevents to navigate
    onDelete(); //calls the delete function passed as prop
  }

  return (
    <div 
    onClick={handleClick}
    className='relative flex items-center w-full min-h-[50px] p-3 border mt-2 rounded-xl bg-neutral-200 shadow-md transition-transform duration-200 cursor-pointer hover:shadow-lg hover:scale-101 dark:hover:shadow-md dark:hover:shadow-zuccini-800 dark:border-none dark:bg-woodsmoke-950 dark:inset-shadow-sm dark:inset-shadow-zuccini-700'>

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
            <span className='h-2 w-2 bg-blue-500 rounded-full ml-2'></span>
          )}

          
        </h1>

        <p className='ml-5 truncate text-md'>{content}</p>
        
        {/* Date and Delte buttonn */}
        <div className='absolute top-2 right-5 flex flex-col items-end ml-5 mt-1 text-neutral-500 dark:text-white'>
          <span>{date}</span>

          {/* Delete button */}
          <button
            onClick={handleDeleteClick}
            className='px-2 text-base font-medium text-red-400 cursor-pointer rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-800 mt-1 w-fit'
          >
            Delete 
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationItem