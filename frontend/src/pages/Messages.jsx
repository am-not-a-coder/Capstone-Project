import avatar1 from '../assets/avatar1.png';
import avatar2 from '../assets/avatar2.png';
import avatar3 from '../assets/avatar3.png';
import MessagesItem from '../components/MessagesItem';
import { useState, useEffect } from 'react';



//static message data with id to track converstaion
const messagesData = [
    {
      id: 1,
      profilePic: avatar1,
      user: 'Miguel Derick Pangindian',
      message: 'WHY DID YOU REDEEM IT?!?!?',
      time: '3m',
      alert: true
    },
    {
      id: 2,
      profilePic: avatar2,
      user: 'Jayson Permejo',
      message: "Hello? How are you, I'm under the water, I'm so much drowning, bulululul",
      time: '5h',
      alert: false
    },
    {
      id: 3,
      profilePic: avatar3,
      user: 'Rafael Caparic',
      message: "Nothing beats a jet2 holiday!",
      time: '4d',
      alert: false
    }
  ];

const Messages = () => {
  //state to hold messages
  const [messages, setMessages] = useState(messagesData);

  //state to manage view type
  const [view, setView] = useState('all'); //'all' or 'unread'

  //state to track which conversation is currently opeend
  const [selectedConversation, setSelectedConversation] = useState(null);

  //handles delete one message
  const handleDelete = (indexToRemove) => {
    setMessages(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  //handles delete all messages
  const handleDeleteAll = () => {
    setMessages([]);
  }

  //handle opening a conversation
  const handleOpenConversation = (messagesData) => {
    console.log('Opening converstaion with:', messagesData.user); //for debuging
    setSelectedConversation(messagesData); //store selected mess. data
  };

  //handle closing a converstaion
  const handleCloseConversation = () => {
    console.log('Closing conversation') //for debug
    setSelectedConversation(null); //clear selecttion
  };

  //filter mesages based on view type
  const filteredMessages = view === 'all' 
  ? messages
  : messages.filter(message => message.alert); //only show unread messages
    
  return (
    <div className="flex flex-row relative border border-neutral-800 rounded-[20px] min-w-[950px] min-h-[90%] shadow-md p-2 pb-4 bg-neutral-200 text-neutral-900 dark:text-white dark:bg-gray-900 dark:inset-shadow-sm dark:inset-shadow-zuccini-800">

      {/* Messages section */}
      <div className={`transition-all duration-300 ${selectedConversation ? 'w-[600px]' : 'w-full'}`}>

      <div className='flex gap-4 mt-2'>
        <button
          onClick={() => setView('all')}
          className={`px-4 py-1 font-medium transition-colors rounded-full cursor-pointer ${view === 'all' ? 'bg-blue-500 text-white' : 'text-black bg-neutral-300 dark:text-white dark:bg-neutral-800' } `}
        >
          All
        </button>

        <button
          onClick={() => setView('unread')}
          className={`px-4 py-1 font-medium transition-colors rounded-full cursor-pointer ${view === 'unread' ? 'bg-blue-500 text-white' : 'text-black bg-neutral-300 dark:text-white dark:bg-neutral-800' }`}
        >
          Unread
        </button>
      </div>
      
      {/* delete all messages */}
      <button
        onClick={handleDeleteAll}
        className='absolute z-0 px-2 text-base font-bold text-red-500 rounded-full cursor-pointer top-5 right-5 hover:bg-neutral-300 dark:hover:bg-neutral-800'>
        Delete All
      </button>

      {/* Messages List */}
      <div className='grid gap-1 pt-3'>
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message, index) => (
            <MessagesItem
              key={message.id}
              picture={message.profilePic}
              userName={message.user}
              message={message.message}
              time={message.time}
              alert={message.alert}

              onDelete={() => handleDelete(index)}
              onOpenConversation={() => handleOpenConversation(message)}
              isSelected={selectedConversation ?.id === message.id} //check if this messg is selelcted
            />
          ))
        ) : (
          <p className='text-lg italic text-gray-500'>No new messages</p>
        )}
        </div>
      </div>
      
      {/* Converstaion Area this will only show if a conversation is selected */}
      {selectedConversation && (  
        <div className='w-2/3 ml-4 border border-neutral-400 rounded-xl bg-white dark:bg-gray-800'>

          <div className='p-4'>
            <h3>{selectedConversation.user}</h3>
            <button
            className='mt-2 px-3 py-1 bg-red-500 text-white rounded'
            onClick={handleCloseConversation}
            >Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Messages