import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import NotificationItem from '../components/NotifItem';
import { apiGet, apiPost, apiDelete } from '../utils/api_utils';
import { getCurrentUser } from '../utils/auth_utils';
import { getSocket } from '../utils/websocket_utils';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/api/notifications');
      if (response && response.success) {
        const notifications = response.data?.notifications || response.notifications || [];
        setNotifications(notifications);
      } else {
        console.error('Failed to fetch notifications:', response);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await apiGet('/api/notifications/unread-count');
      if (response && response.success) {
        // You can use this count for a badge in your header
        console.log('Unread notifications:', response.count);
      } else {
        console.log('Unread notifications: 0 (API error)');
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      console.log('Unread notifications: 0 (Network error)');
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await apiPost(`/api/notifications/${notificationId}/read`, {});
      if (response.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.notificationID === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Delete single notification
  const handleDelete = async (notificationId) => {
    try {
      const response = await apiDelete(`/api/notifications/${notificationId}`);
      if (response.success) {
        setNotifications(prev => 
          prev.filter(notif => notif.notificationID !== notificationId)
        );
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Delete all notifications
  const handleDeleteAll = async () => {
    try {
      const response = await apiDelete('/api/notifications');
      if (response.success) {
        setNotifications([]);
        setConfirmDelete(false);
      }
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  };

  // Set up real-time notifications
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    const socket = getSocket();
    if (socket) {
      // Join notification room
      socket.emit('join_notifications');

      // Listen for new notifications
      socket.on('new_notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        fetchUnreadCount(); // Update unread count
      });

      return () => {
        socket.off('new_notification');
      };
    }
  }, []);

  // Filter notifications based on view type
  const filteredNotifications = notifications ? (view === 'all'
    ? notifications
    : notifications.filter((notif) => !notif.isRead)) : [];

  if (loading) {
    return (
      <div className="relative border border-neutral-400 rounded-[20px] min-w-[950px] shadow-md p-2 pb-4 bg-neutral-200 text-neutral-900 inset-shadow-sm inset-shadow-gray-400 dark:text-white dark:bg-gray-900 dark:shadow-md dark:shadow-zuccini-800">
        <div className="flex justify-center items-center h-32">
          <div className="text-lg">Loading notifications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative border border-neutral-400 rounded-[20px] min-w-[950px] shadow-md p-2 pb-4 bg-neutral-200 text-neutral-900 inset-shadow-sm inset-shadow-gray-400 dark:text-white dark:bg-gray-900 dark:shadow-md dark:shadow-zuccini-800">
      {/* All and Unread Filter */}
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

      {/* Delete All Notifications */}
      <button
        onClick={() => setConfirmDelete(true)}
        className='absolute z-0 px-2 text-base font-bold text-red-500 rounded-full cursor-pointer top-5 right-5 hover:bg-neutral-300 dark:hover:bg-neutral-800'
      >
        Delete All
      </button>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Delete All Notifications?</h3>
            <p className="mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete All
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className='grid gap-1 pt-3'>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationItem 
              key={notification.notificationID}
              picture={notification.sender?.profilePic || '/default-avatar.png'}
              notifTitle={notification.title}
              content={notification.content}
              date={new Date(notification.createdAt).toLocaleDateString()}
              alert={!notification.isRead}
              link={notification.link}
              onDelete={() => handleDelete(notification.notificationID)}
              onMarkRead={() => markAsRead(notification.notificationID)}
            />
          ))
        ) : (
          <p className='text-lg italic text-center text-gray-500'>No notifications</p>
        )}
      </div>
    </div>
  );
};

export default Notification;