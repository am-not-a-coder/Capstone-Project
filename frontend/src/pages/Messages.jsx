import avatar1 from '../assets/avatar1.png';
import avatar2 from '../assets/avatar2.png';
import avatar3 from '../assets/avatar3.png';
import MessagesItem from '../components/MessagesItem';
import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquareXmark, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
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
    <div className="flex flex-row relative border border-neutral-800 rounded-[20px] min-w-[950px] min-h-[90%] shadow-md p-2 pb-4 bg-neutral-200 text-neutral-900 dark:text-white dark:bg-gray-900 dark:inset-shadow-sm dark:inset-shadow-zuccini-800">

      {/* Messages section */}
      <div className={`transition-all duration-300 ${selectedConversation ? 'w-[600px]' : 'w-full'}`}>

      <div className='flex gap-4 mt-2'>
        <button
          onClick={handleViewAll}
          className={`px-4 py-1 font-medium transition-colors rounded-full cursor-pointer ${view === 'all' ? 'bg-blue-500 text-white' : 'text-black bg-neutral-300 dark:text-white dark:bg-neutral-800' } `}
        >
          See All
        </button>

        <button
          onClick={handleViewActive}
          className={`px-4 py-1 font-medium transition-colors rounded-full cursor-pointer ${view === 'active' ? 'bg-green-600 text-white' : 'text-black bg-neutral-300 dark:text-white dark:bg-neutral-800' }`}
        >
          Active Users
        </button>
      </div>
      
      {/* delete all messages, this only renders in see all */}
      {view === 'all' && (
        <button
        onClick={handleDeleteAll}
        className='absolute z-0 px-2 text-base font-bold text-red-500 rounded-full cursor-pointer top-5 right-5 hover:bg-neutral-300 dark:hover:bg-neutral-800'>
        Delete All
      </button>
      )}

      {/* Messages List */}
      <div className='grid gap-1 pt-3'>
        {view === 'all' ? (
          <>
            {/* Pinned New Message item */}
            <div
              key={'new_message_button'}
              className='flex items-center gap-3 p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer'
              onClick={() => setShowNewMsgModal(true)}
            >
              <div className='flex flex-col'>
                <div className='font-medium text-neutral-900 dark:text-white'>New Message</div>
                <div className='text-sm text-neutral-500'>Start a new conversation</div>
              </div>
            </div>

            {filteredMessages.length > 0 ? (
              filteredMessages.map((item, index) => {
                //if in 'see all', item is a messg obj, if in 'active users', item is a user obj
                const messageObj = view === 'all'
                ? item
                : messages.find(msg => msg.id === item.id);

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
                    isSelected={selectedConversation ?.id === item.id} //check if this messg is selelcted
                    showMessagePreview={view === 'all'}
                  />
                )
              })
            ) : (
              <p className='text-lg italic text-gray-500 text-center'>No new messages</p>
            )}
          </>
        ) : (
          filteredMessages.length > 0 ? (
            filteredMessages.map((item, index) => {
              // in active users view, item is a user obj
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
            <p className='text-lg italic text-gray-500 text-center'>No active users</p>
          )
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
              <div className={`w-2.5 h-2.5 mr-2 rounded-full ${selectedDotClass}`}></div>
              <p className='text-neutral-700 text-sm dark:text-neutral-400'>
                {selectedText}
              </p>
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
            {conversationThreads[selectedConversation.conversationId]?.map((msg) => (
              <div key={msg.id}>
                {msg.sender === "sent" ? (
                  //Sent messages (right side)
                  <div className='flex justify-end mb-4'>
                    <div className='flex flex-col items-end'>
                      <div className='flex items-start gap-2'>
                        <div className='text-white px-4 py-3 bg-blue-500 max-w-xs shadow-sm rounded-2xl'>
                          <p className='text-sm'>{msg.message}</p>
                        </div>
                        <button
                          title='Delete for me'
                          className='text-xs px-2 py-1 rounded bg-neutral-300 hover:bg-neutral-400 text-neutral-800 dark:bg-neutral-700 dark:text-white'
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

      {/* New Message Modal */}
      {showNewMsgModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div className='w-[560px] max-h-[70vh] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-neutral-300 dark:border-neutral-700 p-4 flex flex-col'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-lg font-semibold text-neutral-900 dark:text-white'>Start a new message</h3>
              <button className='px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700' onClick={() => setShowNewMsgModal(false)}>Close</button>
            </div>
            <input
              type='text'
              placeholder='Search user by name...'
              className='mb-3 px-3 py-2 rounded border border-neutral-300 dark:border-neutral-600 dark:bg-neutral-900'
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
            <div className='overflow-y-auto flex-1 pr-1'>
              {allUsers
                .filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()))
                .map(u => (
                  <div
                    key={u.id}
                    className='flex items-center gap-3 p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer'
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
                    <img src={u.profilePic} className='w-8 h-8 rounded-full' />
                    <div className='flex-1'>
                      <div className='font-medium text-neutral-900 dark:text-white'>{u.name}</div>
                      <div className='text-xs text-neutral-500'>{u.isOnline ? 'Online' : 'Offline'}</div>
                    </div>
                  </div>
                ))}
              {allUsers.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).length === 0 && (
                <div className='text-sm text-neutral-500'>No users found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Messages