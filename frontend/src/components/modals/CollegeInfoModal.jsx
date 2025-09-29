import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faGraduationCap,
  faUser,
  faCode
} from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { apiGet } from '../../utils/api_utils';

const CollegeInfoModal = ({ college, isOpen, onClose }) => {

  //if modal is not open or no college data, dont render anything
  if (!isOpen || !college) return null;

  // state for fetched programs and loading
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch programms when modal opens
  useEffect(() => {
    if (!isOpen || !college) return;

    const fetchPrograms = async () => {
      setLoading(true);
      try {
        const response = await apiGet(`/api/institute/programs?instID=${college.instID}`);

        if (response.success && Array.isArray(response.data.programs)) {
          setPrograms(response.data.programs);
        } else {
          console.error('Failed to fetch programs:', response.error);
          setPrograms([]);
        }
      } catch (err) {
        console.error("Error occurred when fetching programs", err);
        setPrograms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [isOpen, college]);


  return (
    // modal backdrop
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 duration-300 bg-black/50 backdrop-blur-md animate-in fade-in'>

      {/* Modal Container */}
      <div className='bg-white border border-gray-200/20 max-w-5xl w-full max-h-[95vh] overflow-hidden rounded-3xl shadow-2xl dark:bg-gray-900 dark:border-gray-700/30 animate-in slide-in-from-bottom-4 duration-300'>

        {/* Headr section */}
        <div className='relative border-b bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200/30 dark:from-gray-800 dark:to-gray-900 dark:border-gray-700/30'>
          <button
          onClick={onClose}
          className='absolute z-10 flex items-center justify-center w-10 h-10 transition-all duration-200 border rounded-full top-4 right-4 bg-white/80 border-gray-200/50 hover:bg-white dark:border-gray-700/50 dark:bg-gray-800/80 dark:hover:bg-gray-800 backdrop-blur-sm hover:scale-105'
          >
            <FontAwesomeIcon icon={faXmark} className='w-5 h-5 text-gray-600 dark:text-gray-400'/>
          </button>
        

          {/* Logo & Name section */}
          <div className='flex flex-col items-start gap-8 p-8 lg:flex-row'>
            {/* Logo */}
            <div className='flex-shrink-0'>
              <div className='w-32 h-32 overflow-hidden bg-white border-4 border-white shadow-xl rounderd-2xl dark:border-gray-800 dark:bg-gray-800'>
                <img 
                  src={college.img} 
                  alt={`${college.name} logo`}
                  className='object-cover w-full h-full' 
                />
              </div>
              {/* Decorative gradient ring */}
              <div className='absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl -z-10 opacity-20'></div>
            </div>

            {/* College Infor */}
            <div className='flex-1 min-w-0 space-y-4'>

              {/* College name */}
              <div>
                <h1 className='mb-2 text-3xl font-bold leading-tight text-gray-900 lg:text-4xl dark:text-white'>
                  {college.name}
                </h1>

                {/* College code badge */}
                <div className='inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full dark:bg-blue-900/30 '>
                  <FontAwesomeIcon icon={faCode} className='w-4 h-4 text-blue-600 dark:text-blue-400'/>
                  <span className='font-semibold text-blue-700 dark:text-blue-300'>
                    {college.code}
                  </span>
                </div>
              </div>

              {/* Institue Head */}
              <div className='flex items-center gap-3 p-4 bg-white border backdrop-blur-sm rounded-xl border-gray-200/50 dark:bg-gray-800/60 dark:border-gray-700/50'>
                <div className='flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30'>
                  <FontAwesomeIcon icon={faUser} className='w-5 h-5 text-emerald-600 dark:text-emerald-400'/>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>Institute Head</p>
                  <p className='text-lg font-semibold text-gray-900 dark:text-white'>
                    {college.instituteHead}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Programs section */}
        <div className='p-8 max-h-[60vh] overflow-y-auto'>
          <div className='p-6 border bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-gray-200/50 dark:border-gray-700/50 dark:from-gray-800 dark:to-gray-900'>

            {/* Programs header */}
            <div className='flex items-center gap-3 mb-6'>
              <div className='flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl'>
                <FontAwesomeIcon icon={faGraduationCap} className='w-6 h-6 text-purple-600 dark:text-purple-400'/>
              </div>
              <div>
                <h3 className='text-xl font-bold text-gray-900 dark:text-white'>
                  Academic Programs
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  {loading ? 'Loading programs...' : `${programs.length} program${programs.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            

            {/* Display filtered fetched programs */}
            {loading ? (
              <div className='flex items-center justify-center py-12'>
                <div className='w-8 h-8 border-b-2 border-purple-600 rounded-full animate-spin'></div>
                <span className='ml-3 text-gray-500'>Loading programs...</span>
              </div>
            ) : programs.length > 0 ? (
              <div className='grid gap-3'>
                  {programs.map((program, index) => (
                    <div
                      key={program.programID}
                      className='flex items-center gap-4 p-4 transition-all duration-200 bg-white border dark:bg-gray-800 rounded-xl hover:border-purple-200 border-gray-200/50 hover:shadow-md dark:border-gray-700/50 dark:hover:border-purple-700/50 '
                    >
                      {/* Programs index */}
                      <div className='flex items-center justify-center w-8 h-8 text-sm font-semibold text-purple-600 bg-purple-100 rounded-lg dark:bg-purple-900/30'>
                        {index + 1}
                      </div>

                      {/* Programs detaisl */}
                      <div className='flex-1 min-w-0 '>
                        <h4 className='mb-1 font-semibold text-gray-900 dark:text-white leading-light'>
                          {program.programName}
                        </h4>
                        <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:text-gray-300 dark:bg-gray-700'>
                          {program.programCode}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className='py-12 text-center'>
                <div className='flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full dark:bg-gray-800 '>
                  <FontAwesomeIcon icon={faGraduationCap} className='w-8 h-8 text-gray-400'/>
                </div>
                <p className='text-lg font-medium text-gray-500 dark:text-gray-400'>
                  No programs found
                </p>
                <p className='mt-1 text-sm text-gray-400 dark:text-gray-500'>
                  This college doesn't have any programs listed yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CollegeInfoModal