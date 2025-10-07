import React from 'react'

const MessagesItem = ({picture, userName, message, time, alert, onDelete, onOpenConversation, isSelected, isOnline, showMessagePreview, status}) => {

  const handleDeleteClick = (e) => {
    e.stopPropagation(); //prevents opening message
    onDelete(); //calls the delete function passed as prop
  };

  const handleMessageClick = () => {
    onOpenConversation(); //call function passed from parent
  };

    return (
        <div 
        onClick={handleMessageClick}
        className={`relative flex items-center w-full min-h-[50px] p-3 border border-gray-400 mt-2 rounded-xl shadow-md transition-transform duration-200 cursor-pointer hover:shadow-lg hover:scale-101 dark:hover:shadow-md dark:hover:shadow-zuccini-800 dark:border-none dark:inset-shadow-sm dark:inset-shadow-zuccini-700 ${isSelected 
        ? 
        'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-500' //selected appearance
        : 'bg-neutral-200 dark:bg-gray-950' //normal appearance
        }`}>
          <div className='relative'>
            <img 
              src={picture} 
              alt="profile picture"
              className='w-10 h-10 mr-3 rounded-full'
            />

            {(() => {
              const dotClass = !isOnline
                ? 'bg-gray-400'
                : (status === 'away' ? 'bg-orange-500' : 'bg-green-500')
              return (
                <span className={`absolute bottom-0 w-3 h-3 ${dotClass} border-2 border-neutral-600 dark:border-neutral-00 rounded-full right-3`} />
              )
            })()}
          </div>


            {/* Message content */}
            <div className="flex flex-col w-[50%]">
             <h1 className='flex items-center font-bold text-gray-800 truncate text-md dark:text-gray-100'>
                {userName}
                {isOnline && status === 'away' && (
                  <span className='ml-2 px-2 py-0.5 text-[10px] leading-none rounded-full bg-orange-500 text-white'>Away</span>
                )}
                {alert && (
                <span className='h-2.5 w-2.5 bg-blue-500 rounded-full ml-2'>{alert}</span>)}
                {showMessagePreview && (
                  <p className='ml-2 text-sm font-light text-neutral-500 dark:text-white'>{time}</p>
                )}
              </h1>
              {showMessagePreview && (
                <p className='ml-3 text-sm font-light truncate'>{message}</p>
              )}
            
              {showMessagePreview && (
                <div className='absolute right-5 top-5'>
                  <button
                    onClick={handleDeleteClick}
                    className='px-2 mt-1 text-base font-medium text-red-400 rounded-full cursor-pointer hover:bg-neutral-300 dark:hover:bg-neutral-800 w-fit'>
                    Delete
                  </button>
                </div>
              )}
            </div>
        </div>
    )
}

export default MessagesItem