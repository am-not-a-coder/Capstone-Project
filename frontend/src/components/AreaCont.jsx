import { useState, useEffect } from 'react';
import { faChevronDown, faChevronUp, faSave, faTimes, faTrash, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CircularProgressBar from './CircularProgressBar';

// AreaCont Component with Edit capabilities
export default function AreaCont({
  areaID,  
  title, 
  doneCount, 
  doneTotal, 
  onClick, 
  isExpanded, 
  onIconClick, 
  progress, 
  editMode,
  onSaveEdit,
  onDelete
}) {
  const parseAreaName = (fullAreaName) => {
    const colonIndex = fullAreaName.indexOf(':');
    if (colonIndex === -1) {
      return { areaNum: '', areaName: fullAreaName };
    }
    
    const areaNum = fullAreaName.substring(0, colonIndex).trim();
    const areaName = fullAreaName.substring(colonIndex + 1).trim();
    
    return { areaNum, areaName };
  };

  const [localAreaName, setLocalAreaName] = useState('');
  const [localAreaNum, setLocalAreaNum] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Re-parse whenever title changes
  useEffect(() => {
    const parsed = parseAreaName(title);
    setLocalAreaName(parsed.areaName);
    setLocalAreaNum(parsed.areaNum);
  }, [title]);

  const handleSave = async (e) => {
    e.stopPropagation();
    await onSaveEdit(areaID, localAreaName, localAreaNum);
    setIsEditing(false);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    // Re-parse from the original title
    const parsed = parseAreaName(title);
    setLocalAreaName(parsed.areaName);
    setLocalAreaNum(parsed.areaNum);
    setIsEditing(false);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();    
    await onDelete(areaID);
  };


  return (
    <>
    <div className='relative flex flex-row justify-between min-w-full p-2 mb-2 transition-all duration-300 border shadow-md cursor-pointer md:p-3 md:py-5 border-neutral-300 rounded-2xl text-neutral-800 hover:scale-101 dark:text-white hover:border-neutral-500 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600'>        
      {editMode && isEditing ? (
        <div className='flex flex-col w-full gap-2' onClick={(e) => e.stopPropagation()}>
          <div className='flex gap-2'>
            <input 
              type='text'
              value={localAreaNum}
              onChange={(e) => setLocalAreaNum(e.target.value)}
              placeholder="Area Number (e.g., I, II, III)"
              className='w-32 p-2 border border-gray-500 rounded-xl'
            />
            <input 
              type='text'
              value={localAreaName}
              onChange={(e) => setLocalAreaName(e.target.value)}
              placeholder="Area Name"
              className='flex-1 p-2 border border-gray-500 rounded-xl'
            />
          </div>
          <div className='flex gap-2'>
            <button
              onClick={handleSave}
              className='px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700'
            >
              <FontAwesomeIcon icon={faSave} className='mr-2' />
              Save
            </button>
            <button
              onClick={handleCancel}
              className='px-4 py-2 text-white bg-gray-600 rounded-lg hover:bg-gray-700'
            >
              <FontAwesomeIcon icon={faTimes} className='mr-2' />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div onClick={onClick} className='flex items-center flex-1'>
             <h1 className='w-2/3 font-semibold text-md md:text-lg md:w-full'>{title}</h1>  
          </div>

          <p className={`${editMode && !isEditing ? 'right-[20%]' : 'right-[18%]'} opacity-70 font-semibold absolute bottom-1 text-sm md:text-md md:bottom-5`}>{doneCount} / {doneTotal}</p>

          <div className='flex items-center gap-3 mr-3'>
            {editMode && !isEditing ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className='px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700'
                  title='Edit Area'
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className='px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700'
                  title='Delete Area'
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              <FontAwesomeIcon 
                            icon={isExpanded ? faChevronUp : faChevronDown} 
                            onClick={e => {
                                e.stopPropagation();
                                if (onIconClick) onIconClick(e);
                            }}
                            className='cursor-pointer'
                        />
              </>
            ) : (
            <div className='relative'>
              <div className='mr-3'>                
                         <CircularProgressBar circleWidth="50" strokeColor="stroke-zuccini-500" progress={progress} placement={`absolute -right-5 md:right-15 scale-70 md:scale-100 -top-2 md:-top-3 `}/>
                        <FontAwesomeIcon 
                            icon={isExpanded ? faChevronUp : faChevronDown} 
                            onClick={e => {
                                e.stopPropagation();
                                if (onIconClick) onIconClick(e);
                            }}
                            className='mt-10 cursor-pointer -mr-9 md:m-0'
                        />
                    </div>             
            </div>
            )}
            
            
          </div>
        </>
      )}
    </div>
    
    {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"> 
         <div className='absolute flex flex-col items-center justify-center p-4 border border-gray-200 shadow-lg bg-red-50 w-100 rounded-xl dark:bg-gray-700 dark:border-gray-600 fade-in'>
            <div className='flex items-center justify-center mb-4 bg-red-200 rounded-full inset-shadow-sm w-18 h-18 inset-shadow-red-300'>
                <FontAwesomeIcon icon={faTriangleExclamation} className="m-auto text-4xl text-red-500"/>
            </div>
            
            <h3 className='mb-2 text-xl font-bold text-gray-900 dark:text-white'>
                Delete User
            </h3>
            <span className='mb-6 text-center text-gray-600 break-words dark:text-gray-300'>
               Are you sure you want to delete "<strong>{title}</strong>"? This will delete all criteria within it.
            </span>

            <div className='flex gap-4'>
                <button 
                    className='px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700' 
                    onClick={handleDelete}
                >
                    Yes
                </button>
                <button 
                    className='px-4 py-2 text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 dark:text-white dark:bg-gray-600 dark:hover:bg-gray-700' 
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    No
                </button>
            </div>                                    
         </div>
        </div>
        )} 
    </>
  );
}