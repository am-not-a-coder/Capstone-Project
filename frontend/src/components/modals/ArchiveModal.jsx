import{
    faChevronDown,
    faChevronUp,    
    faBoxArchive,
    faXmark,
    faArchive,
    faRotateLeft,
    faTrash
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

const ArchiveModal = ({ showModal, onClose, archivedData, onRestore, onPermanentDelete }) => {

    const [isExpanded, setIsExpanding] = useState(false);
    
  const [expandedAreas, setExpandedAreas] = useState({});
  const [expandedSubareas, setExpandedSubareas] = useState({});
  const [expandedCriteriaGroups, setExpandedCriteriaGroups] = useState({});

  if (!showModal) return null;

  const toggleArea = (areaID) => {
    setExpandedAreas(prev => ({ ...prev, [areaID]: !prev[areaID] }));
  };

  const toggleSubarea = (subareaID) => {
    setExpandedSubareas(prev => ({ ...prev, [subareaID]: !prev[subareaID] }));
  };

  const toggleCriteriaGroup = (groupKey) => {
    setExpandedCriteriaGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const renderCriteria = (criteria, subareaID) => {
    const groups = [
      { name: 'Inputs', items: criteria.inputs || [], key: `${subareaID}-inputs` },
      { name: 'Processes', items: criteria.processes || [], key: `${subareaID}-processes` },
      { name: 'Outcomes', items: criteria.outcomes || [], key: `${subareaID}-outcomes` }
    ];

    return groups.map(group => {
      const isOpen = expandedCriteriaGroups[group.key];
      
      return (
        <div key={group.key} className='ml-5'>
          <div 
            onClick={() => toggleCriteriaGroup(group.key)}
            className='flex flex-row justify-between p-3 py-4 mb-2 transition-all duration-300 border shadow-md cursor-pointer rounded-xl border-neutral-400 text-neutral-800 hover:scale-101 dark:text-white hover:border-neutral-500 dark:bg-gray-900/50 dark:border-gray-700 dark:hover:border-gray-600'
          >
            <h3 className='text-sm font-semibold'>{group.name}</h3>
            <FontAwesomeIcon 
              icon={isOpen ? faChevronUp : faChevronDown} 
              className='text-sm'
            />
          </div>

          <div className={`flex flex-col ml-3 overflow-hidden transition-all duration-400 ease-in-out ${
            isOpen ? 'max-h-[2000px] opacity-100 mb-2' : 'max-h-0 opacity-0'
          }`}>
            {group.items.length > 0 ? group.items.map((item, idx) => (
              <div 
                key={idx}
                className='relative flex flex-col gap-2 p-3 mb-2 border shadow-sm rounded-xl border-neutral-300 text-neutral-800 dark:text-white dark:bg-gray-800/50 dark:border-gray-600'
              >
                <span className='text-sm break-words whitespace-pre-wrap'>
                  {item.content}
                </span>
                <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
                  <span>Area ID: {item.criteriaID}</span>
                  {item.docName && (
                    <span className='italic'>File: {item.docName}</span>
                  )}
                </div>
              </div>
            )) : (
              <div className='p-3 mb-2 text-sm text-center text-gray-500 dark:text-gray-400'>
                No criteria found
              </div>
            )}
          </div>
        </div>
      );
    });
  };

    return(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full h-full max-h-[90vh] overflow-y-auto scrollbar-primary">
                {/* Header */}
                <div className="relative p-8 pb-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="text-center">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl">
                            <FontAwesomeIcon icon={faBoxArchive} className="text-2xl"/>
                        </div>
                        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                            Archive
                        </h1>
                        {/* <p className="text-gray-600 dark:text-gray-400">
                            Add new {activeForm.toLowerCase()} to your accreditation system
                        </p> */}
                    </div>

                    {/* Exit button */}
                    <button   
                        onClick={onClose}                      
                        className="absolute flex items-center justify-center w-10 h-10 transition-colors duration-200 bg-gray-100 rounded-full top-6 right-6 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                       <FontAwesomeIcon icon={faXmark} className="text-xl text-gray-400"/>
                    </button>
                </div>
                
                <div className='relative flex flex-col w-full max-w-5xl max-h-[90vh] bg-white border border-gray-300 shadow-2xl dark:bg-gray-800 dark:border-gray-600 rounded-2xl'>
        {/* Content */}
          {archivedData && archivedData.length > 0 ? (
            <div className='space-y-3'>
              {archivedData.map((area) => (
                <div key={area.areaID} className='mb-4'>
                  {/* Area Container */}
                  <div className='relative flex flex-row items-center justify-between p-4 transition-all duration-300 border shadow-md cursor-pointer border-neutral-400 rounded-2xl text-neutral-800 hover:scale-101 dark:text-white hover:border-neutral-500 dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600'>
                    <div onClick={() => toggleArea(area.areaID)} className='flex items-center flex-1'>
                      <h2 className='text-lg font-semibold'>{area.title}</h2>
                    </div>

                    <div className='flex items-center gap-3'>
                      <button
                        onClick={() => onRestore?.(area.areaID, 'area')}
                        className='px-3 py-2 text-sm text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700'
                        title='Restore'
                      >
                        <FontAwesomeIcon icon={faRotateLeft} className='mr-2' />
                        Restore
                      </button>
                      <button
                        onClick={() => onPermanentDelete?.(area.areaID, 'area')}
                        className='px-3 py-2 text-sm text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700'
                        title='Delete Permanently'
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                      <FontAwesomeIcon 
                        icon={expandedAreas[area.areaID] ? faChevronUp : faChevronDown}
                        onClick={() => toggleArea(area.areaID)}
                        className='ml-2 cursor-pointer'
                      />
                    </div>
                  </div>

                  {/* Subareas */}
                  <div className={`ml-5 overflow-hidden transition-all duration-400 ease-in-out ${
                    expandedAreas[area.areaID] ? 'max-h-[3000px] opacity-100 mt-3' : 'max-h-0 opacity-0'
                  }`}>
                    {area.subareas && area.subareas.length > 0 ? (
                      area.subareas.map((subarea) => (
                        <div key={subarea.subareaID} className='mb-3'>
                          {/* Subarea Container */}
                          <div className='flex flex-row items-center justify-between p-3 py-4 mb-2 transition-all duration-300 border shadow-md cursor-pointer rounded-xl border-neutral-400 text-neutral-800 hover:scale-101 dark:text-white hover:border-neutral-500 dark:bg-gray-950/50 dark:border-gray-700 dark:hover:border-gray-600'>
                            <h3 
                              onClick={() => toggleSubarea(subarea.subareaID)}
                              className='flex-1 font-semibold text-md'
                            >
                              {subarea.title}
                            </h3>

                            <div className='flex items-center gap-3'>
                              <button
                                onClick={() => onRestore?.(subarea.subareaID, 'subarea')}
                                className='px-3 py-1 text-sm text-white transition-colors bg-blue-600 rounded hover:bg-blue-700'
                                title='Restore'
                              >
                                <FontAwesomeIcon icon={faRotateLeft} />
                              </button>
                              <button
                                onClick={() => onPermanentDelete?.(subarea.subareaID, 'subarea')}
                                className='px-3 py-1 text-sm text-white transition-colors bg-red-600 rounded hover:bg-red-700'
                                title='Delete Permanently'
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                              <FontAwesomeIcon 
                                icon={expandedSubareas[subarea.subareaID] ? faChevronUp : faChevronDown}
                                onClick={() => toggleSubarea(subarea.subareaID)}
                                className='cursor-pointer'
                              />
                            </div>
                          </div>

                          {/* Criteria Groups */}
                          <div className={`overflow-hidden transition-all duration-400 ease-in-out ${
                            expandedSubareas[subarea.subareaID] ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            {renderCriteria(subarea.criteria || {}, subarea.subareaID)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className='p-4 text-center text-gray-500 dark:text-gray-400'>
                        No archived subareas
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center p-12 text-center'>
              <FontAwesomeIcon icon={faArchive} className='mb-4 text-6xl text-gray-400 dark:text-gray-600' />
              <h3 className='mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300'>
                No Archived Items
              </h3>
              <p className='text-gray-500 dark:text-gray-400'>
                Your archive is currently empty
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-3 p-6 border-t border-gray-300 dark:border-gray-600'>
          <button
            onClick={onClose}
            className='px-6 py-2 text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          >
            Close
          </button>
        </div>
      </div>
                
      </div>
        
    )
}

export default ArchiveModal;