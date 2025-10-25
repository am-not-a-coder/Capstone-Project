import{
    faPenToSquare,    
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

export default function TemplateCard({title, status, description, createdBy, createdAt, onClick, editTemplate}) {

  const [showDetails, setShowDetails] = useState(false);

  return (
    <div 
    onClick={onClick}
    className="relative min-w-[200px] cursor-pointer min-h-lg h-full p-6 hover:scale-101 transition-all duration-300 bg-gray-100 border border-gray-100 shadow-sm rounded-xl hover:shadow-md dark:border-gray-800 dark:bg-gray-800/80">
      {/* Preview Section */}
      <div className="relative p-6 mb-4 rounded-lg bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-950/70 dark:to-gray-900">
        {/* Edit Button */}
        <div 
          title="Edit Template"
          onClick={editTemplate}
          className="absolute flex items-center justify-center w-12 h-12 transition-all duration-300 rounded-full shadow-lg hover:scale-105 -right-2 -bottom-1 bg-cyan-400"
        >
          <FontAwesomeIcon icon={faPenToSquare} className="text-xl text-white"/>
        </div>
        
        {/* Template Preview */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="w-16 h-16 bg-white rounded shadow-sm dark:bg-gray-700" />
            <div className="w-16 h-16 bg-white rounded shadow-sm dark:bg-gray-700" />
          </div>
          <div className="space-y-2">
            <div className="w-full h-2 bg-white rounded shadow-sm dark:bg-gray-700" />
            <div className="w-3/5 h-2 bg-white rounded shadow-sm dark:bg-gray-700" />
          </div>
          <div className="w-4/5 h-2 bg-white rounded shadow-sm dark:bg-gray-700" />
        </div>
      </div>

      {/* Card Content */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title || "Accreditation Template 2025"}
          </h3>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${status === "Applied" ? "bg-cyan-100 text-cyan-600 dark:bg-cyan-800 dark:text-cyan-50" : "bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-50"}`}>
            {status}
          </span>
        </div>
        
       <button 
            onClick={(e) => e.stopPropagation()}
            className="flex items-start justify-between w-full text-sm text-gray-600 transition-colors hover:text-gray-900">
              <span
                onClick={() => setShowDetails(prev => !prev)}
                className={`flex flex-col items-start text-left overflow-y-hidden dark:text-gray-300 dark:hover:text-gray-400 ${showDetails ? '' : 'h-5'}`}>
                <p><strong>Created By:</strong> {createdBy}{showDetails ? '' : '...'}</p>
                <p><strong>Created At:</strong> {createdAt}</p>
                <p><strong>Description:</strong> {description || "N/A"}</p>
              </span>                       
        </button>
      </div>
    </div>
  );
}