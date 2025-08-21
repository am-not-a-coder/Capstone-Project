import React from 'react'
import avatar1 from '../assets/avatar1.png';
import avatar2 from '../assets/avatar2.png';
import avatar3 from '../assets/avatar3.png';
import MessagesItem from '../components/MessagesItem';
import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquareXmark, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useSearchParams } from 'react-router-dom';

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
      alert: true
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
  //Parameter handling
  const [searchParams] = useSearchParams();
  const openConversationId = searchParams.get('openConversation');

  //state to hold messages
  const [messages, setMessages] = useState(messagesData);

  //state to hold individual conversation threads
  const [conversationThreads, setConversationThreads] = useState({
    1: [messagesData[0]], //miguel thread
    2: [messagesData[1]], //son thread
    3: [messagesData[2]] //rap thread
  });

  //state to manage view type
  const [view, setView] = useState('all'); //'all' or 'unread'

  //state to track which conversation is currently opeend
  const [selectedConversation, setSelectedConversation] = useState(null);

  //state for input field
  const [newMessage, setNewMessage] = useState("");

  //Effect for auto open convo from URL
  useEffect(() => {
    if (openConversationId) {
      const messageToOpen = messages.find(msg => msg.id === parseInt(openConversationId));

      if (messageToOpen) {
        handleOpenConversation(messageToOpen); //auto open convo

        window.history.replaceState({}, '', '/Messages'); //Clears URL
      }
    }
  }, [openConversationId, messages]);

  //Reference to the messg container
  const messageEndRef = useRef(null);

  //Auto scroll function
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior : "smooth"});
  };

  //Scroll when converstaion changes or new messgs added
  useEffect(() => {
    scrollToBottom();
  }, [conversationThreads, selectedConversation]);

  //handles delete one message
  const handleDelete = (indexToRemove) => {
    //get the messg being deleted
    const messageToDelete = messages[indexToRemove];

    //check if this messg is currently openm 
    if (selectedConversation && selectedConversation.id === messageToDelete.id) {
      setSelectedConversation(null); //close convo
    }

    setMessages(prev => prev.filter((_, index) => index !== indexToRemove)) //delete a message
  };

  //handles delete all messages
  const handleDeleteAll = () => {
    setMessages([]);
  };

  //handle opening a conversation
  const handleOpenConversation = (messagesData) => {
    //Auto switch to 'All' when opening unread mess
    if (view === 'unread') {
      //switch to 'all' view first
      setView('all');
    }
    setSelectedConversation(messagesData); //store selected mess. data

    //Mark messg as read when opened
    if (messagesData.alert) {
      //uopdate main messg list - remove blue dot
      setMessages(prev => 
        prev.map(msg => msg.id === messagesData.id ? {...msg, alert: false} //Mark as read
        : msg 
        )
      );
    }
  };

  //handle closing a converstaion
  const handleCloseConversation = () => {
    setSelectedConversation(null); //clear selecttion
  };

  //handle send message function
  const handleSendMessage = () => {
    if (newMessage.trim() === "") return; //dont send empty message

    const message = {
      id: Date.now(),
      profilePic: null, //no profile pic for sent messages
      user: "You",
      message: newMessage.trim(),
      time: "now",
      alert: false,
      sender: "sent" //mark as sent message
    };
    
    //Add message to specefic convo thread
    setConversationThreads(prev => ({
      ...prev,
      [selectedConversation.id]: [...prev[selectedConversation.id], message]
    }));

    setNewMessage(""); //clear input

    //Scroll to bottom after sending
    setTimeout(() => scrollToBottom(), 100);
  };

  //handle enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  //Converstation area keeps open in 'all' view
  const handleViewAll = () => {
    setView('all');
  };

  const handleViewUnread = () => {
    setView('unread');
    //close convo area when switching view
    setSelectedConversation(null);
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
          onClick={handleViewAll}
          className={`px-4 py-1 font-medium transition-colors rounded-full cursor-pointer ${view === 'all' ? 'bg-blue-500 text-white' : 'text-black bg-neutral-300 dark:text-white dark:bg-neutral-800' } `}
        >
          All
        </button>

        <button
          onClick={handleViewUnread}
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
          <p className='text-lg italic text-gray-500 text-center'>No new messages</p>
        )}
        </div>
      </div>
      
      {/* Converstaion Area this will only show if a conversation is selected */}
      {selectedConversation && (  
        <div className='flex flex-col z-0 w-2/3 ml-4 border border-neutral-400 rounded-xl bg-white dark:bg-gray-800 overflow-hidden'>

          {/* Convo header */}
          <div className='flex items-center p-2 border border-b border-neutral-400 dark:border-neutral-600 bg-neutral-400 dark:bg-neutral-800'>
            
            {/* profile pic */}
            <img 
            src={selectedConversation.profilePic}
            className='w-12 h-12 mr-3 rounded-full'
            alt="Profile Picture" />

            {/* Name and Status*/}
            <div className='flex-1'>
              <h2
              className='font-semibold text-lg text-neutral-900 dark:text-white'
              >{selectedConversation.user}
              </h2>
              
              <div className='flex items-center'>
                <div className='w-2.5 h-2.5 mr-2 bg-green-500 rounded-full'></div>
                <p className='text-neutral-700 text-sm dark:text-neutral-400'>Active now</p>
              </div>
            </div>

            {/* close button */}
            <FontAwesomeIcon icon={faSquareXmark}
              className='p-1.5 text-neutral-900 bg-red-500 hover:text-neutral-700 cursor-pointer text-2xl transition-colors dark:hover:bg-neutral-400 rounded-full'
              onClick={handleCloseConversation}
              title='Close Chat'
            />
          </div>

          {/* Dynamic Messages display */}
          <div className='flex-1 p-4 bg-neutral-300 overflow-y-auto  dark:bg-neutral-900' style={{maxHeight: '400px'}}>
            {/* Display logic - shows only selected conversation */}
            {conversationThreads[selectedConversation.id]?.map((msg) => (
              <div key={msg.id}>
                {msg.sender === "sent" ? (
                  //Sent messages (right side)
                  <div className='flex justify-end mb-4'>
                    <div className='flex flex-col items-end'>
                      <div className='text-white px-4 py-3 bg-blue-500 max-w-xs shadow-sm rounded-2xl'>
                        <p className='text-sm'>{msg.message}</p>
                      </div>
                      <p className='mt-1 text-xs text-neutral-500'>You • {msg.time}</p>
                    </div>
                  </div>
                ) : (
                  //Received messages (left side)
                  <div className='flex items-start mb-4'>
                      <img 
                        src={msg.profilePic}
                        alt="Profile Pic" 
                        className='w-8 h-8 mr-3 rounded-full flex-shrink-0 object-cover'
                      />
                    <div>
                      <div className='bg-white px-4 py-3 dark:bg-neutral-700 rounded-2xl max-w-xs shadow-sm'>
                        <p className='text-sm text-neutral-900 dark:text-neutral-100'>{msg.message}</p>
                        <span className='text-xs text-neutral-400 ml-2'>{msg.time}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Invisble element to scroll to */}
            <div ref={messageEndRef} />
          </div>

          {/* Input area */}
          <div className='p-3 border-t border-neutral-300 bg-white dark:border-neutral-600 dark:bg-gray-700'>
            <div className='flex items-center gap-2'>

              {/* Input field */}
              <input type="text" 
                placeholder='Aa'
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className='flex flex-1 px-4 py-3 border border-neutral-400 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent placeholder-neutral-500 dark:bg-neutral-800 dark:border-neutral-700 dark:placeholder-neutral-400 transition-all'
              />

              {/* Send button */}
              <FontAwesomeIcon icon={faPaperPlane} 
                onClick={handleSendMessage}
                className='p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all dark:border-neutral-200 cursor-pointer'
                title='Send'
              />
            </div>
          </div>

        </div>  
      )}
    </div>
  )
}

export default Messages