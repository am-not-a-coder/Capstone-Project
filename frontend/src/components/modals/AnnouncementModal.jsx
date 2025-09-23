import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faBullhorn } from "@fortawesome/free-solid-svg-icons";



const AnnouncementModal = ({ setShowModal, onCreate }) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !message) return;
    onCreate({ title, message, duration});
    setTitle("");
    setMessage("");
    setDuration("");
    setShowModal(false);
  };


  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg p-6 transition-all duration-300 bg-gray-200 rounded-3xl shadow-xl dark:bg-gray-900">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faBullhorn} className="text-green-500 dark:text-zuccini-400" />
            <h2 className="text-xl font-semibold text-neutral-800 text-shadow-sm text-shadow-gray-400 dark:text-white">New Announcement</h2>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="p-2 text-gray-600 transition rounded-full cursor-pointer hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 text-gray-800 transition border rounded-xl border-neutral-400 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-green-600 focus:outline-none"
              placeholder="Enter announcement title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Duration</label>
            <input type="date" value={duration} onChange={(e) => setDuration(e.target.value)}
              className="w-full placeholder:opacity-50 px-4 py-2 text-gray-800 transition border rounded-xl border-neutral-400 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-green-600 focus:outline-none"/>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Message
            </label>
            <textarea
              rows="4"
              className="w-full px-4 py-2 text-gray-800 transition border rounded-xl border-neutral-400 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-green-600 focus:outline-none"
              placeholder="Write your announcement here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
          </div>

          {/* Actions */}
          <div className="flex justify-end mt-4 space-x-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 transition rounded-xl cursor-pointer bg-neutral-300 hover:bg-neutral-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold cursor-pointer text-white transition rounded-xl bg-green-600 hover:bg-green-700"
            >
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementModal;
