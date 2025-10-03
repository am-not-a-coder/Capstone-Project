import avatar1 from '../assets/avatar1.png';
import avatar2 from '../assets/avatar2.png';
import avatar3 from '../assets/avatar3.png';
import MessagesItem from '../components/MessagesItem';
import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPaperPlane, faMessage, faTrash, faComments } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useSearchParams } from 'react-router-dom';
import { apiGet, apiPost, apiDelete } from '../utils/api_utils';
import { subscribePresence, getOnlineIds, getSocket } from '../utils/websocket_utils';
import { getCurrentUser } from '../utils/auth_utils'


const Messages = () => {
  
  //Parameter handling
  const [searchParams] = useSearchParams();
  const openConversationId = searchParams.get('openConversation')


  //state to hold messages
  const [messages, setMessages] = useState([]);

  //state to hold individual conversation threads
  const [conversationThreads, setConversationThreads] = useState({});

  //state to manage view type
  const [view, setView] = useState('all'); //'all' or 'unread'

  //state to track which conversation is currently opeend
  const [selectedConversation, setSelectedConversation] = useState(null);

  //state for input field
  const [newMessage, setNewMessage] = useState("");

  //state for auto open mssg
  const [autoOpenEnabled, setAutoOpenEnabled] = useState(true);

  const [conversation, setConversation] = useState([])
  const [loading, setLoading] = useState(false)
  const [onlineIds, setOnlineIds] = useState(() => getOnlineIds())
  const isSelectedOnline = selectedConversation ? onlineIds.has(String(selectedConversation.id)) : false;
  const [userStatus, setUserStatus] = useState(() => new Map())

  // New Message modal state
  const [showNewMsgModal, setShowNewMsgModal] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')

  const selectedStatus = selectedConversation
    ? (userStatus.get(String(selectedConversation.id)) || 'active')
    : 'active'
  const selectedDotClass = !isSelectedOnline
    ? 'bg-gray-400'
    : (selectedStatus === 'away' ? 'bg-orange-500' : 'bg-green-500')
  const selectedText = !isSelectedOnline
    ? 'Offline'
    : (selectedStatus === 'away' ? 'Away' : 'Active now')

  useEffect(() => {
    const socket = getSocket()
    const onBroadcast = ({ userID, status}) => {
        setUserStatus(prev => {
          const next = new Map(prev)
          next.set(String(userID), status || 'active')
          return next
        })
    }
    socket.on('broadcast', onBroadcast)
    return () => socket.off('broadcast', onBroadcast)
  }, [])

  //Effect for auto open convo from URL
  useEffect(() => {
    if (openConversationId) {
      const messageToOpen = messages.find(msg => String(msg.id) === String(openConversationId));

      if (messageToOpen) {
        handleOpenConversation(messageToOpen); //auto open convo

        window.history.replaceState({}, '', '/Messages'); //Clears URL
      }
    }
  }, [openConversationId, messages]);

  // Auto open the recent mssg
  useEffect(() => {
    // opens only if there;s no current selected messg and when there's messgs
    if (autoOpenEnabled && !selectedConversation && messages.length > 0 && view === 'all') {
      handleOpenConversation(messages[0]); // opens recent 
    }
  }, [messages, selectedConversation, autoOpenEnabled, view]);

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

  useEffect(() => {
    let mounted = true
    const fetchConversations = async () => {
      try {
        setLoading(true)
        const res = await apiGet('/api/conversations')
        if (!mounted) return
        if (res?.success) {
          const msgs = (res.data.conversations || []).map(c => ({
            id: String(c.otherParticipant.employeeID),
            conversationId: String(c.conversationID),
            profilePic: c.otherParticipant.profilePic || avatar1,
            user: c.otherParticipant.name || 'Unknown',
            message: '',
            time: '',
            alert: false
          }))
          setMessages(msgs)
          setConversation(res.data.conversations)
          const threadsInit = {}
          msgs.forEach(m => { threadsInit[m.conversationId] = [] })
          setConversationThreads(threadsInit)
        }

      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchConversations()
    return () => { mounted = false }
  }, [])

  // Load users when opening the New Message modal
  useEffect(() => {
    let mounted = true
    const loadUsers = async () => {
      if (!showNewMsgModal) return
      try {
        const res = await apiGet('/api/users')
        if (!mounted || !res?.success) return
        const list = (res.data?.users || []).map(u => ({
          id: String(u.employeeID),
          name: u.name || `${u.fName || ''} ${u.lName || ''}`.trim(),
          profilePic: u.profilePic || avatar1,
          isOnline: !!u.isOnline,
          status: u.status || 'active'
        }))
        setAllUsers(list)
      } catch {}
    }
    loadUsers()
    return () => { mounted = false }
  }, [showNewMsgModal])

  useEffect(() => {
    let mounted = true
    const seedPresence = async () => {
      try {
        const res = await apiGet('/api/users/online-status')
        if (!mounted || !res?.success) return
        const ids = new Set((res.data?.users || [])
          .filter(u => u.online_status)
          .map(u => String(u.employeeID)))
        // if you have a presence store setter:
        // setOnlineIds(ids) from websocket_utils, or local setOnlineIds(ids)
        setOnlineIds(ids)
        // Seed status map for away/active snapshot
        setUserStatus(prev => {
          const next = new Map(prev)
          ;(res.data?.users || []).forEach(u => {
            next.set(String(u.employeeID), u.status || 'active')
          })
          return next
        })
      } catch {}
    }
    seedPresence()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const unsubscribe = subscribePresence((ids) => {
      console.log('Online IDs updated:', Array.from(ids))
      setOnlineIds(ids)
    })
    
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const socket = getSocket()
  
    const handleNewMessage = (data) => {
      const { conversationID, message } = data
      const currentId = getCurrentUser()?.employeeID
      if (!currentId) return
  
      if (String(message.senderID) === String(currentId)) {
        // We already appended optimistically; skip duplicate
        return
      }
  
      const normalized = {
        id: message.id,
        message: message.content,
        time: message.createdAt ? 'now' : '',
        sender: 'received',
        profilePic: (selectedConversation?.conversationId === String(conversationID)
          ? (selectedConversation?.profilePic || avatar1)
          : avatar1)
      }
  
      setConversationThreads(prev => ({
        ...prev,
        [conversationID]: [...(prev[conversationID] || []), normalized]
      }))
    }
  
    socket.on('new_message', handleNewMessage)
    return () => socket.off('new_message', handleNewMessage)
  }, [selectedConversation])

  useEffect(() => {
    const socket = getSocket()
    const onDeleted = ({ conversationID }) => {
      // If we are viewing this conversation, close it
      if (selectedConversation?.conversationId === String(conversationID)) {
        setSelectedConversation(null)
        setAutoOpenEnabled(false)
      }
      // Remove from cache and list
      setConversationThreads(prev => {
        const copy = { ...prev }; delete copy[String(conversationID)]; return copy
      })
      setMessages(prev => prev.filter(m => m.conversationId !== String(conversationID)))
    }
    socket.on('conversation_deleted', onDeleted)
    return () => socket.off('conversation_deleted', onDeleted)
  }, [selectedConversation])

  const fetchMessages = async (conversationId) => {
    try {
      const res = await apiGet(`/api/conversations/${conversationId}/message`)
      if (res?.success) {
        const currentId = getCurrentUser()?.employeeID
        const otherPic =
          selectedConversation?.conversationId === String(conversationId)
            ? (selectedConversation?.profilePic || avatar1)
            : avatar1
  
        const formatted = (res.data?.messages || []).map(msg => {
          const isOwn = String(msg.senderID) === String(currentId)
          return {
            id: msg.id,
            message: msg.content,
            time: msg.createdAt ? 'now' : '',
            sender: isOwn ? 'sent' : 'received',
            profilePic: isOwn ? null : otherPic
          }
        })
  
        setConversationThreads(prev => ({
          ...prev,
          [conversationId]: formatted
        }))
      }
    } catch (e) {
      console.error('Error fetching messages:', e)
    }
  }

  //handles delete one message
  const handleDeleteConversation = async () => {
    const conversationId = selectedConversation?.conversationId
    if (!conversationId) return
    if (!window.confirm('Delete this conversation?')) return
  
    const socket = getSocket()
    socket.emit('leave_conversation', { conversationID: conversationId })
  
    const res = await apiDelete(`/api/conversations/${conversationId}`)
    if (res?.success) {
      // remove from left list
      setMessages(prev => prev.filter(m => m.conversationId !== conversationId))
      // remove thread cache
      setConversationThreads(prev => {
        const copy = { ...prev }; delete copy[conversationId]; return copy
      })
      // clear selection
      setSelectedConversation(null)
      setAutoOpenEnabled(false)
    }
  }

  //handles delete all messages
  const handleDeleteAll = () => {
    setMessages([]);
  };

  //handle opening a conversation
  const handleOpenConversation = (data) => {
  const conv = conversation.find(c => String(c.otherParticipant.employeeID) === String(data.id))
  const conversationId = data.conversationId
    ? String(data.conversationId)
    : (conv ? String(conv.conversationID) : undefined)

  // Leave previous room if any
  const socket = getSocket()
  const prevId = selectedConversation?.conversationId
  if (prevId) {
    socket.emit('leave_conversation', { conversationID: prevId })
  }

  const msgData = messages.find(msg => msg.id === data.id) || {
    ...data,
    conversationId,
    message: "", time: "", alert: false
  }
  const selection = { ...msgData, conversationId }
  setSelectedConversation(selection)

  if (conversationId) {
    socket.emit('join_conversation', { conversationID: conversationId })
    fetchMessages(conversationId)
  }

  if (msgData.alert) {
    setMessages(prev => prev.map(msg => msg.id === msgData.id ? { ...msg, alert: false } : msg))
  }
}

  //handle closing a converstaion
  const handleCloseConversation = () => {
    const socket = getSocket()
    const prevId = selectedConversation?.conversationId
    if (prevId) {
      socket.emit('leave_conversation', { conversationID: prevId })
    }
    setSelectedConversation(null)
    setAutoOpenEnabled(false)
  }

  //handle send message function
  const handleSendMessage = async () => {
    console.log('clicked')
    if (newMessage.trim() === "") return
    const conversationId = selectedConversation?.conversationId
    console.log('[send] convoId:', conversationId, 'text:', newMessage)
    if (!conversationId) return
  
    const optimistic = {
      id: Date.now(),
      profilePic: null,
      user: "You",
      message: newMessage.trim(),
      time: "now",
      alert: false,
      sender: "sent"
    }
  
    // Optimistic: append in the correct thread
    setConversationThreads(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), optimistic]
    }))
    // Update preview
    setMessages(prev => prev.map(m => m.id === selectedConversation.id
      ? { ...m, message: `You: ${newMessage.trim()}`, time: "now", alert: false }
      : m
    ))
    setNewMessage("")
  
    try {
      await apiPost(`/api/conversations/${conversationId}/message`, { content: optimistic.message })
      // Recipient will get WS new_message; this tab is already updated optimistically
    } catch (e) {
      console.error('Send failed:', e)
      // Optional: rollback optimistic append here
    }
  }

  //handle enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  //Converstation area keeps open in 'all' view
  const handleViewAll = () => {
    setView('all');
    setSelectedConversation(null);
    setAutoOpenEnabled(true); // enbale auto open again when switchign to 'see all'
  };

  const handleViewActive = () => {
    setView('active');
    //close convo area when switching view
    setSelectedConversation(null);
    setAutoOpenEnabled(false); //disable when in active users
  };

  //filter mesages based on view type
  const filteredMessages = view === 'all' 
  ? messages
  : messages.filter(user => onlineIds.has(String(user.id))); //show users
    
  return (
    <>      

      {/* Main Content */}
      <div className="flex flex-row gap-4 flex-1 min-h-[600px]">
        {/* Messages List Section */}
        <div className={`bg-gray-200 dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-5 transition-all duration-300 ${selectedConversation ? 'w-[400px]' : 'flex-1'}`}>
          
          {/* View Toggle Buttons */}
          <div className='flex gap-3 mb-4'>
            <button
              onClick={handleViewAll}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg ${view === 'all' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
            >
              <FontAwesomeIcon icon={faComments} />
              See All
            </button>

            <button
              onClick={handleViewActive}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-lg ${view === 'active' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
            >
              <FontAwesomeIcon icon={faMessage} />
              Active Users
            </button>
          </div>
          
          {/* Delete All Button - Only in See All view */}
          {view === 'all' && (
            <button
              onClick={handleDeleteAll}
              className='flex items-center gap-2 px-3 py-2 mb-3 text-sm font-medium text-red-600 transition-all rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'>
              <FontAwesomeIcon icon={faTrash} />
              Delete All
            </button>
          )}

          {/* Messages List */}
          <div className='space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]'>
            {view === 'all' ? (
              <>
                {/* Pinned New Message Button */}
                <div
                  className='flex items-center gap-3 p-3 transition-all border cursor-pointer bg-emerald-50 border-emerald-200 rounded-xl hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:hover:bg-emerald-900/30'
                  onClick={() => setShowNewMsgModal(true)}
                >
                  <div className='flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500'>
                    <FontAwesomeIcon icon={faMessage} className='text-xl text-white' />
                  </div>
                  <div className='flex flex-col'>
                    <div className='font-semibold text-gray-800 dark:text-white'>New Message</div>
                    <div className='text-sm text-gray-500 dark:text-gray-400'>Start a new conversation</div>
                  </div>
                </div>

                {filteredMessages.length > 0 ? (
                  filteredMessages.map((item) => {
                    const messageObj = view === 'all' ? item : messages.find(msg => msg.id === item.id);

                    return (
                      <MessagesItem
                        key={item.id}
                        picture={item.profilePic}
                        userName={item.user}
                        message={messageObj ? messageObj.message : ""}
                        time={messageObj ? messageObj.time : ""}
                        alert={messageObj ? messageObj.alert : false}
                        isOnline={onlineIds.has(String(item.id))}
                        status={userStatus.get(String(item.id)) || 'active'}
                        
                        onDelete={view === 'all' ? () => handleDeleteConversation() : undefined}
                        onOpenConversation={() => handleOpenConversation(item)}
                        isSelected={selectedConversation?.id === item.id}
                        showMessagePreview={view === 'all'}
                      />
                    )
                  })
                ) : (
                  <div className='flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500'>
                    <FontAwesomeIcon icon={faMessage} className='mb-3 text-5xl' />
                    <p className='text-lg font-medium'>No messages yet</p>
                  </div>
                )}
              </>
            ) : (
              filteredMessages.length > 0 ? (
                filteredMessages.map((item) => {
                  return (
                    <MessagesItem 
                      key={item.id}
                      picture={item.profilePic}
                      userName={item.user}
                      message=""
                      time=""
                      alert={false}
                      isOnline={onlineIds.has(String(item.id))}
                      status={userStatus.get(String(item.id)) || 'active'}
                      onOpenConversation={() => handleOpenConversation(item)}
                      isSelected={selectedConversation?.id === item.id}
                      showMessagePreview={false}
                    />
                  );
                })
              ) : (
                <div className='flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500'>
                  <FontAwesomeIcon icon={faMessage} className='mb-3 text-5xl' />
                  <p className='text-lg font-medium'>No active users</p>
                </div>
              )
            )}
          </div>
        </div>
        
        {/* Conversation Area */}
        {selectedConversation && (  
          <div className='flex flex-col flex-1 bg-white border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700 rounded-2xl'>

            {/* Conversation Header */}
            <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
              <div className='flex items-center gap-3'>
                {/* Profile Picture */}
                <img 
                  src={selectedConversation.profilePic}
                  className='w-12 h-12 rounded-full ring-2 ring-emerald-500'
                  alt="Profile Picture" 
                />

                {/* Name and Status */}
                <div>
                  <h2 className='text-lg font-semibold text-gray-800 dark:text-white'>
                    {selectedConversation.user}
                  </h2>
                  
                  <div className='flex items-center gap-2'>
                    <div className={`w-2 h-2 rounded-full ${selectedDotClass}`}></div>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      {selectedText}
                    </p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleCloseConversation}
                className='flex items-center justify-center w-10 h-10 text-white transition-all bg-red-500 rounded-full hover:bg-red-600'
                title='Close Chat'
              >
                <FontAwesomeIcon icon={faXmark} className='text-xl' />
              </button>
            </div>

            {/* Messages Display Area */}
            <div className='flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900' style={{maxHeight: 'calc(100vh - 300px)'}}>
              {conversationThreads[selectedConversation.conversationId]?.map((msg) => (
                <div key={msg.id}>
                  {msg.sender === "sent" ? (
                    // Sent Messages (Right Side)
                    <div className='flex justify-end mb-4'>
                      <div className='flex flex-col items-end'>
                        <div className='flex items-start gap-2'>
                          <div className='max-w-md px-4 py-3 text-white shadow-sm rounded-2xl bg-emerald-600'>
                            <p className='text-sm'>{msg.message}</p>
                          </div>
                          <button
                            title='Delete for me'
                            className='px-2 py-1 text-xs text-gray-800 transition-all bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                            onClick={async () => {
                              if (!window.confirm('Delete this message for you only?')) return
                              try {
                                const res = await apiDelete(`/api/messages/${msg.id}`)
                                if (res && res.success) {
                                  const convId = selectedConversation?.conversationId
                                  if (!convId) return
                                  setConversationThreads(prev => ({
                                    ...prev,
                                    [convId]: (prev[convId] || []).filter(m => m.id !== msg.id)
                                  }))
                                  window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', msg: 'Message deleted for you' } }))
                                } else {
                                  window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'error', msg: (res && res.error) || 'Failed to delete message' } }))
                                }
                              } catch (e) {
                                window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'error', msg: 'Failed to delete message' } }))
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                        <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>You • {msg.time}</p>
                      </div>
                    </div>
                  ) : (
                    // Received Messages (Left Side)
                    <div className='flex items-start mb-4'>
                      <img 
                        src={msg.profilePic}
                        alt="Profile Pic" 
                        className='flex-shrink-0 object-cover w-10 h-10 mr-3 rounded-full ring-2 ring-gray-200 dark:ring-gray-700'
                      />
                      <div>
                        <div className='max-w-md px-4 py-3 bg-white shadow-sm dark:bg-gray-700 rounded-2xl'>
                          <p className='text-sm text-gray-800 dark:text-gray-100'>{msg.message}</p>
                          <span className='text-xs text-gray-400 dark:text-gray-500'>{msg.time}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Invisible element to scroll to */}
              <div ref={messageEndRef} />
            </div>

            {/* Message Input Area */}
            <div className='p-4 bg-white border-t border-gray-200 dark:border-gray-700 dark:bg-gray-800'>
              <div className='flex items-center gap-3'>
                {/* Input Field */}
                <input 
                  type="text" 
                  placeholder='Type a message...'
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className='flex-1 px-4 py-3 text-sm placeholder-gray-500 transition-all bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white'
                />

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  className='flex items-center justify-center w-12 h-12 text-white transition-all rounded-full shadow-md bg-emerald-600 hover:bg-emerald-700'
                  title='Send'
                >
                  <FontAwesomeIcon icon={faPaperPlane} className='text-lg' />
                </button>
              </div>
            </div>

          </div>  
        )}
      </div>

      {/* New Message Modal */}
      {showNewMsgModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='w-[560px] max-h-[70vh] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-3'>
                <div className='flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500'>
                  <FontAwesomeIcon icon={faMessage} className='text-lg text-white'/>
                </div>
                <h3 className='text-2xl font-bold text-gray-800 dark:text-white'>
                  New Message
                </h3>
              </div>
              <button 
                className='px-4 py-2 font-semibold text-white transition-all bg-red-500 rounded-lg hover:bg-red-600' 
                onClick={() => setShowNewMsgModal(false)}
              >
                Close
              </button>
            </div>
            
            <input
              type='text'
              placeholder='Search users...'
              className='px-4 py-3 mb-4 transition-all bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white'
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
            
            <div className='flex-1 pr-1 overflow-y-auto'>
              {allUsers
                .filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()))
                .map(u => (
                  <div
                    key={u.id}
                    className='flex items-center gap-3 p-3 transition-all rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                    onClick={async () => {
                      const conv = conversation.find(c => String(c.otherParticipant.employeeID) === String(u.id))
                      if (conv) {
                        const item = {
                          id: String(u.id),
                          conversationId: String(conv.conversationID),
                          profilePic: u.profilePic || avatar1,
                          user: u.name,
                          message: '',
                          time: '',
                          alert: false
                        }
                        setMessages(prev => {
                          if (prev.find(m => m.id === item.id)) return prev
                          return [item, ...prev]
                        })
                        setShowNewMsgModal(false)
                        handleOpenConversation(item)
                        return
                      }
                      try {
                        const res = await apiPost('/api/conversations/start', { participantID: u.id })
                        if (res && res.success && res.data && res.data.conversationID) {
                          const newConvId = String(res.data.conversationID)
                          const item = {
                            id: String(u.id),
                            conversationId: newConvId,
                            profilePic: u.profilePic || avatar1,
                            user: u.name,
                            message: '',
                            time: '',
                            alert: false
                          }
                          setMessages(prev => {
                            if (prev.find(m => m.id === item.id)) return prev
                            return [item, ...prev]
                          })
                          setConversation(prev => ([
                            ...prev,
                            {
                              conversationID: Number(newConvId),
                              otherParticipant: {
                                employeeID: Number(u.id),
                                name: u.name,
                                profilePic: u.profilePic || avatar1
                              },
                              conversationType: 'direct',
                              createdAt: res.data.createdAt || null
                            }
                          ]))
                          setShowNewMsgModal(false)
                          handleOpenConversation(item)
                        }
                      } catch (e) {
                        // no-op; API utils already handle toasts
                      }
                    }}
                  >
                    <img src={u.profilePic} className='w-12 h-12 rounded-full ring-2 ring-gray-200 dark:ring-gray-700' alt={u.name} />
                    <div className='flex-1'>
                      <div className='font-semibold text-gray-800 dark:text-white'>{u.name}</div>
                      <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
                        <div className={`w-2 h-2 rounded-full ${u.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        {u.isOnline ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  </div>
                ))}
              {allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).length === 0 && (
                <div className='py-8 text-center text-gray-500 dark:text-gray-400'>No users found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Messages;