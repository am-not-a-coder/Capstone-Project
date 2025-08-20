import React from 'react'
import avatar1 from '../assets/avatar1.png';
import MessagesItem from '../components/MessagesItem';
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { getCurrentUser } from '../utils/auth_utils';
import { apiGet, apiPost } from '../utils/api_utils';

const Messages = () => {
  //state to hold messages/conversations
  const [messages, setMessages] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserSelector, setShowUserSelector] = useState(false);

  // Helper function to get profile picture URL
  const getProfilePicUrl = (profilePic) => {
    if (!profilePic) return avatar1; // Default avatar if no profile pic
    if (profilePic.startsWith('http')) return profilePic; // Already full URL
    
    // Extract filename from path (handles both "/uploads/file.jpg" and "file.jpg")
    const filename = profilePic.split('/').pop();
    return `http://localhost:5000/api/preview/${filename}`;
  };

  //state to manage view type
  const [view, setView] = useState('all'); //'all' or 'unread'

  //state to track which conversation is currently opeend
  const [selectedConversation, setSelectedConversation] = useState(null);

  //state for real-time messages
  const [realTimeMessages, setRealTimeMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  //socket reference
  const socketRef = useRef(null);
  
  // Ref to track current conversation for WebSocket listeners
  const selectedConversationRef = useRef(selectedConversation);

  // Function to load conversations from database
  const loadConversations = async () => {
    try {
      const response = await apiGet('/api/conversations');
      if (response.success) {
        // Convert API data to match UI format
        const formattedConversations = response.data.conversations.map(conv => ({
          id: conv.id,
          profilePic: getProfilePicUrl(conv.profilePic), // Convert path to full URL
          user: conv.conversationName,
          message: conv.latestMessage,
          time: conv.latestMessageTime,
          alert: conv.hasAlert,
          otherUserId: conv.otherUserId
        }));
        setMessages(formattedConversations);
        
        // If no conversations, show user selector
        if (formattedConversations.length === 0) {
          setShowUserSelector(true);
          loadAvailableUsers();
        }
      } else {
        console.error('Error loading conversations:', response.error);
        setShowUserSelector(true);
        loadAvailableUsers();
      }
    } catch (error) {
      console.error('Network error loading conversations:', error);
      setShowUserSelector(true);
      loadAvailableUsers();
    } finally {
      setLoading(false);
    }
  };

  // Function to load available users to message
  const loadAvailableUsers = async () => {
    try {
      const response = await apiGet('/api/users/available');
      if (response.success) {
        console.log('📊 Loaded users:', response.data.users.length, response.data.users);
      console.log('🖼️ Profile pic processing:');
      response.data.users.forEach(user => {
        console.log(`  ${user.name}: "${user.profilePic}" → "${getProfilePicUrl(user.profilePic)}"`);
      });
        setAvailableUsers(response.data.users);
      } else {
        console.error('Error loading users:', response.error);
      }
    } catch (error) {
      console.error('Network error loading users:', error);
    }
  };

  // Function to start a conversation with a user
  const startConversationWithUser = async (otherUserId, userName) => {
    try {
      console.log(`🚀 Starting conversation with ${userName} (${otherUserId})`);
      
      const response = await apiPost('/api/conversations/start', {
        otherUserId: otherUserId
      });
      
      if (response.success) {
        const conversationId = response.data.conversationID;
        console.log(`✅ Conversation created/found: ${conversationId}`);
        
        // Create a conversation object to select
        const newConversation = {
          id: conversationId,
          user: userName,
          profilePic: getProfilePicUrl(availableUsers.find(u => u.employeeID === otherUserId)?.profilePic),
          message: "Start chatting...",
          time: "now",
          alert: false,
          otherUserId: otherUserId
        };
        
        // Add to conversations list and select it
        setMessages(prev => [newConversation, ...prev]);
        setSelectedConversation(newConversation);
        setShowUserSelector(false);
        
      } else {
        console.error('Error starting conversation:', response.error);
        alert('Failed to start conversation. Please try again.');
      }
    } catch (error) {
      console.error('Network error starting conversation:', error);
      alert('Network error. Please check your connection.');
    }
  };

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Function to load historical messages for a conversation
  const loadHistoricalMessages = async (conversationId) => {
    try {
      console.log(`📚 Loading historical messages for conversation ${conversationId}`);
      const response = await apiGet(`/api/conversations/${conversationId}/messages`);
      
      if (response.success) {
        const currentUser = getCurrentUser();
        
        console.log('🔍 Historical messages raw data:', response.data.messages);
        console.log('🔍 Current user for historical:', currentUser.employeeID);
        
        const formattedMessages = response.data.messages.map(msg => {
          const isCurrentUserCheck = msg.senderID === currentUser.employeeID;
          console.log(`🔍 Historical message from ${msg.senderID}, current user: ${currentUser.employeeID}, isCurrentUser: ${isCurrentUserCheck}`);
          
          return {
            messageContent: msg.messageContent,
            senderID: msg.senderID,
            senderName: msg.senderName || 'Unknown',
            sentAt: msg.sentAt,
            isCurrentUser: isCurrentUserCheck
          };
        });
        
        console.log(`✅ Loaded ${formattedMessages.length} historical messages:`, formattedMessages);
        setRealTimeMessages(formattedMessages);
      } else {
        console.error('Failed to load historical messages:', response.error);
        setRealTimeMessages([]);
      }
    } catch (error) {
      console.error('Error loading historical messages:', error);
      setRealTimeMessages([]);
    }
  };

  // Update ref when selectedConversation changes
  useEffect(() => {
    console.log('🔄 Selected conversation changed:', selectedConversation);
    selectedConversationRef.current = selectedConversation;
    
    // Load historical messages when opening a conversation
    if (selectedConversation) {
      console.log(`🔍 Loading historical messages for conversation ${selectedConversation.id}`);
      loadHistoricalMessages(selectedConversation.id);
    } else {
      console.log('❌ No conversation selected, clearing messages');
      setRealTimeMessages([]);
    }
  }, [selectedConversation]);

  // WebSocket Connection
  useEffect(() => {
    const currentUser = getCurrentUser();

    // Create connection
    console.log('🔌 Connecting to WebSocket... Current user:', currentUser.employeeID);
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    // Connection events
    socketRef.current.on('connect', (data) => {
      console.log(`✅ Connected to WebSocket!`);
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket');
      setIsConnected(false);
    });

    // Listen for backend welcome message
    socketRef.current.on('connected', (data) => {
      console.log(data.message);
      console.log('👤 Your user ID:', data.user_id);
    });

    // Remove any existing listeners to prevent duplicates
    socketRef.current.off('receive_message');
    
    // Listen for incoming messages
    socketRef.current.on('receive_message', (messageData) => {
      console.log('📨 New message received:', messageData);
      
      // Transform WebSocket message format to UI format
      const currentUser = getCurrentUser();
      const isCurrentUserCheck = messageData.employeeID === currentUser.employeeID;
      
      console.log('🔍 Message received from:', messageData.employeeID);
      console.log('🔍 Current user ID:', currentUser.employeeID);
      console.log('🔍 Is current user?', isCurrentUserCheck);
      
      const formattedMessage = {
        messageContent: messageData.text,
        senderID: messageData.employeeID,
        senderName: messageData.user,
        sentAt: new Date(messageData.timestamp).toISOString(),
        isCurrentUser: isCurrentUserCheck
      };
      
      console.log('📨 Formatted message:', formattedMessage);
      
      // Only add message if it's for the currently selected conversation
      const currentConversation = selectedConversationRef.current;
      if (currentConversation && messageData.conversationId == currentConversation.id) {
        console.log(`✅ Message belongs to current conversation ${currentConversation.id}`);
        setRealTimeMessages(prev => [...prev, formattedMessage]);
        
        // Update conversation list with latest message
        setMessages(prev => prev.map(conv => 
          conv.id == messageData.conversationId ? {
            ...conv, 
            message: messageData.text,
            time: 'now'
          } : conv
        ));
      } else {
        console.log(`❌ Message filtered out - not for current conversation (${currentConversation?.id}), got conversationId: ${messageData.conversationId}`);
      }
    });

    // Listen for online users
    socketRef.current.on('users_online', (users) => {
      console.log('👥 Online users:', users);
      setOnlineUsers(users);
    });

    // Listen for typing indicators
    socketRef.current.on('user_typing', (data) => {
      console.log('✍️ User typing:', data);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log('🔌 Disconnecting WebSocket...');
        socketRef.current.off('receive_message');
        socketRef.current.off('users_online');
        socketRef.current.off('connected');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Only run once - keep WebSocket connected

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

  // Enhanced sendMessage function - saves to database AND sends via WebSocket
  const sendMessage = async () => {
    if (!newMessage.trim()) {
      console.log('❌ Cannot send empty message');
      return;
    }

    if (!selectedConversation) {
      console.log('❌ No conversation selected');
      return;
    }

    const currentUser = getCurrentUser();
    const messageText = newMessage.trim();
    
    try {
      console.log(`📤 Sending message to conversation ${selectedConversation.id}`);
      
      // 1. Save message to database via API
      const response = await apiPost(`/api/conversations/${selectedConversation.id}/messages`, {
        messageContent: messageText
      });

      if (response.success) {
        console.log('✅ Message saved to database');
        
        // 2. Also send via WebSocket for real-time updates
        if (socketRef.current && isConnected) {
          const messageData = {
            text: messageText,
            user: `${currentUser.firstName} ${currentUser.lastName}`,
            employeeID: currentUser.employeeID,
            conversationId: selectedConversation.id,
            timestamp: Date.now(),
            room: selectedConversation.id
          };
          socketRef.current.emit('send_message', messageData);
          console.log('✅ Message sent via WebSocket');
        }

        // 3. Add message to real-time messages for immediate display
        const newMessageObj = {
          messageContent: messageText,
          senderID: currentUser.employeeID,
          senderName: `${currentUser.firstName} ${currentUser.lastName}`,
          sentAt: new Date().toISOString(),
          isCurrentUser: true
        };
        setRealTimeMessages(prev => [...prev, newMessageObj]);
        
        // 4. Clear input
        setNewMessage('');

      } else {
        console.error('❌ Failed to save message:', response.error);
        alert('Failed to send message. Please try again.');
      }

    } catch (error) {
      console.error('❌ Network error sending message:', error);
      alert('Network error. Please check your connection.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  //filter mesages based on view type
  const filteredMessages = view === 'all' 
  ? messages
  : messages.filter(message => message.alert); //only show unread messages
    
  return (
    <div className="flex flex-row relative border border-neutral-800 rounded-[20px] min-w-[950px] min-h-[90%] shadow-md p-2 pb-4 bg-neutral-200 text-neutral-900 dark:text-white dark:bg-gray-900 dark:inset-shadow-sm dark:inset-shadow-zuccini-800">

      {/* Messages section */}
      <div className={`transition-all duration-300 ${selectedConversation ? 'w-[600px]' : 'w-full'}`}>

      {/* Connection Status */}
      <div className='flex items-center gap-2 mb-2'>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className='text-sm text-gray-600 dark:text-gray-400'>
          {isConnected ? '🔌 Connected' : '❌ Disconnected'}
        </span>
        {onlineUsers.length > 0 && (
          <span className='text-sm text-gray-600 dark:text-gray-400'>
            • {onlineUsers.length} online
          </span>
        )}
      </div>

      <div className='flex gap-2 mt-2 justify-between items-center'>
        <div className='flex gap-2'>
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

        {/* New Chat Button */}
        <button
          onClick={() => {
            setShowUserSelector(!showUserSelector);
            if (!showUserSelector) loadAvailableUsers();
          }}
          className='px-3 py-1 bg-green-500 hover:bg-green-600 text-white font-medium rounded-full transition-colors flex items-center gap-1'
        >
          <span className='text-lg'>+</span>
          New Chat
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
        {loading ? (
          <div className='text-center p-4'>
            <p className='text-gray-500'>Loading conversations...</p>
          </div>
        ) : showUserSelector ? (
          <div className='p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-lg'>
            <div className='flex justify-between items-center mb-4'>
              <p className='text-gray-700 dark:text-gray-300 font-medium'>Start New Conversation:</p>
              <button
                onClick={() => setShowUserSelector(false)}
                className='text-gray-500 hover:text-red-500 text-xl'
              >
                ×
              </button>
            </div>
            <div className='max-h-64 overflow-y-auto space-y-2'>
              {availableUsers.map((user) => (
                <button
                  key={user.employeeID}
                  onClick={() => {
                    startConversationWithUser(user.employeeID, user.name);
                    setShowUserSelector(false);
                  }}
                  className='w-full p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-3'
                >
                  <img 
                    src={getProfilePicUrl(user.profilePic)} 
                    alt={user.name}
                    className='w-8 h-8 rounded-full object-cover'
                    onError={(e) => { e.target.src = avatar1 }}
                  />
                  <div>
                    <p className='font-medium text-sm'>{user.name}</p>
                    <p className='text-xs text-gray-500'>{user.employeeID}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : filteredMessages.length > 0 ? (
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
          <p className='text-lg italic text-gray-500'>No conversations yet. Click "New Chat" to start messaging!</p>
        )}
        </div>
      </div>
      
      {/* Converstaion Area this will only show if a conversation is selected */}
      {selectedConversation && (  
        <div className='w-2/3 ml-4 border border-neutral-400 rounded-xl bg-white dark:bg-gray-800 flex flex-col'>

          {/* Chat Header */}
          <div className='p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center'>
            <div className='flex items-center space-x-3'>
              <img 
                src={selectedConversation.profilePic} 
                alt={selectedConversation.user}
                className='w-10 h-10 rounded-full object-cover'
                onError={(e) => { e.target.src = avatar1 }}
              />
              <div>
                <h3 className='font-semibold text-lg'>{selectedConversation.user}</h3>
                <p className='text-sm text-gray-500'>
                  {onlineUsers.includes(selectedConversation.otherUserId) ? '🟢 Online' : '⚫ Offline'}
                </p>
              </div>
            </div>
            <button
              className='px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors'
              onClick={handleCloseConversation}
            >
              Close
            </button>
          </div>

          {/* Messages Area */}
          <div className='flex-1 p-4 overflow-y-auto min-h-[400px] max-h-[500px] space-y-3'>
            {realTimeMessages.length > 0 ? (
              realTimeMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-lg ${
                    msg.isCurrentUser 
                      ? 'bg-blue-500 text-white rounded-br-sm' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                  }`}>
                    <p>{msg.messageContent}</p>
                    <p className={`text-xs mt-1 ${
                      msg.isCurrentUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {new Date(msg.sentAt).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className='flex items-center justify-center h-full text-gray-500'>
                <div className='text-center'>
                  <p className='text-lg'>💬</p>
                  <p>No messages yet</p>
                  <p className='text-sm'>Start the conversation!</p>
                </div>
              </div>
            )}
          </div>

          {/* Message Input Area */}
          <div className='p-4 border-t border-gray-200 dark:border-gray-700'>
            <div className='flex space-x-2'>
              <input
                type='text'
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${selectedConversation.user}...`}
                className='flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                           focus:outline-none focus:ring-2 focus:ring-blue-500'
                disabled={!isConnected}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || !isConnected}
                className='px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 
                           text-white rounded-lg transition-colors font-medium
                           disabled:cursor-not-allowed'
              >
                Send
              </button>
            </div>
            {!isConnected && (
              <p className='text-xs text-red-500 mt-2'>
                ⚠️ Disconnected - reconnecting...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Messages