const EventModal = ({ title, date, content, onClick, showModal }) => {
  return (
    <div className={`absolute top-[25%] left-15 p-5 max-h-[50%] max-w-[75%] inset-0 z-50 flex flex-col justify-center bg-neutral-200 border border-black shadow-2xl rounded-xl dark:border-gray-800 dark:bg-gray-950 dark:inset-shadow-sm dark:inset-shadow-zuccini-900 ${showModal ? 'fade-in' : 'fade-out'}`}>

        <h2 className="mb-4 text-xl font-bold">{title}</h2>
        <p className="mb-2"><strong>Date:</strong> {date}</p>
        <p className=""><strong>Description:</strong> {content}</p>

        <button className="place-self-end w-[150px] rounded-lg p-4 mt-5 font-semibold text-white bg-blue-500 hover:bg-blue-400" onClick={onClick}>Close</button>
      
    </div>
  );
};

export default  EventModal;
