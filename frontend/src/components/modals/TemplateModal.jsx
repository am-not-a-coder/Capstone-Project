import {
    faChevronLeft,    
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useState } from "react";
import { apiGet } from "../../utils/api_utils";

export const ApplyTempModal = ({programCode, onClick, onApply, loading, createTemp}) => {

    const [templates, setTemplates] = useState([]);    
    const [showTemplateDetails, setShowTemplateDetails] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    

    

     const handleApplyTemplate = async (templateID) => {
        await onApply(templateID);
        // Close the template details modal after successful application
        setShowTemplateDetails(false);
        setSelectedTemplate(null);
    };


    return(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            {showTemplateDetails && selectedTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">                                                                       
                        <div                             
                            className="relative w-full max-w-2xl max-h-[90vh] h-full bg-gray-100 rounded-lg shadow flex flex-col"
                        >     
                            {/* Scrollable content area */}
                            <div className="flex-1 p-4 mb-5 overflow-y-auto">
                                <h1 className="text-xl font-bold text-zuccini-700">{selectedTemplate.templateName}</h1>
                                <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                                <p className="mb-3 text-xs text-gray-500">
                                    Created by {selectedTemplate.createdBy} on{" "}
                                    {new Date(selectedTemplate.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric"
                                    })}
                                </p>

                                {/* Areas */}
                                {selectedTemplate.areas?.map((area) => (
                                    <div key={area.areaID} className="mb-3">
                                        <h2 className="px-3 py-2 text-lg font-semibold rounded-md bg-zuccini-500">
                                            {area.areaName}
                                        </h2>

                                        {/* Subareas */}
                                        <div className="mt-2 ml-4 space-y-2">
                                            {area.subareas?.map((sub) => (
                                                <div key={sub.subareaID} className="pl-3 border-l-2 border-gray-300">
                                                    <h3 className="font-medium text-gray-700">{sub.subareaName}</h3>

                                                    {/* Criteria */}
                                                    <ul className="ml-4 text-sm text-gray-600 list-disc">
                                                        {sub.criteria?.map((crit) => (
                                                            <li key={crit.criteriaID}>{crit.criteriaContent}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Fixed button at bottom */}
                            <div className="flex justify-end p-4 bg-transparent border-t gap-x-5">
                                <button 
                                    disabled={loading}
                                    onClick={() => {
                                        setSelectedTemplate(null)
                                        setShowTemplateDetails(false)
                                    }}
                                    className={`p-2 px-4 font-medium text-white transition-colors duration-300 bg-gray-400 rounded-full cursor-pointer hover:bg-gray-500 ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleApplyTemplate(selectedTemplate.templateID)}
                                    disabled={loading}
                                    className={`p-2 px-4 font-medium text-white transition-colors duration-300 rounded-full cursor-pointer ${loading ? 'bg-gray-400' : 'bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500'}`}
                                >
                                    <FontAwesomeIcon icon={faSpinner} className={`${loading ? 'animate-spin block mr-2 opacity-100 ' : 'w-0 opacity-0'} `}/>
                                    Use Template
                                </button>
                            </div>
                        </div>
            
                </div>
            )}
            
         <div className="bg-gray-200 p-4 h-full dark:bg-gray-900 text-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto scrollbar-primary">
            <div className="relative flex flex-col items-center h-full">
                <h1 
                onClick={onClick}
                className="absolute p-2 transition-all duration-300 bg-gray-300 rounded-full cursor-pointer inset-shadow-sm inset-shadow-gray-400 -top-1 left-2 hover:font-semibold hover:text-gray-100 hover:bg-zuccini-500">
                <FontAwesomeIcon icon={faChevronLeft} className="mr-2"/>
                    Go Back
                </h1>
            <h1 className="mb-4 text-xl font-semibold ">Select a Template</h1>
                {/* Template list */}
            <div className="relative w-full h-full p-3 bg-gray-300 inset-shadow-sm inset-shadow-gray-400 rounded-xl">                
                {templates.length > 0 ? (
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
                        {templates.map((temp) => (
                            <div 
                                key={temp.templateID}  
                                onClick={() => {
                                    setSelectedTemplate(temp)
                                    setShowTemplateDetails(true)
                                }}
                                className="relative flex flex-col h-56 overflow-hidden transition-all duration-300 bg-gray-200 border border-gray-200 shadow-sm cursor-pointer group rounded-xl hover:shadow-xl hover:scale-105 hover:border-gray-300 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-gray-600"
                            >                     
                                <div className="relative w-full h-full transition-all duration-300 bg-emerald-400 group-hover:brightness-110">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                                    <div className="absolute w-8 h-8 rounded-full bottom-2 right-2 bg-white/20 backdrop-blur-sm"></div>
                                </div>                                                    
                                
                                <div className="flex flex-col justify-between flex-1 p-4 space-y-3">
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-bold leading-tight text-gray-900 transition-colors duration-200 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                            {temp.templateName}
                                        </h3>
                                        <p className="text-sm leading-relaxed text-gray-600 truncate dark:text-gray-300 line-clamp-2">
                                            {temp.description}
                                        </p>
                                    </div>

                                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <div className="text-sm text-gray-700 truncate dark:text-gray-300">                           
                                                <span className="mr-1 font-medium">Created:</span>
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    {new Date(temp.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>            
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute inset-0 transition-opacity duration-300 opacity-0 pointer-events-none bg-gradient-to-t from-blue-500/5 to-transparent group-hover:opacity-100"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full">
                        <h1 className="text-2xl font-semibold text-gray-500">No Templates Found</h1>
                        <span className="mb-2 text-gray-500 text-md">Want to create a new one?</span>
                        <button 
                        onClick={createTemp}
                        className="px-5 py-3 rounded-[20px] hover:text-white text-gray-500/70 cursor-pointer font-semibold transition-all duration-300 bg-gray-400/50 hover:bg-zuccini-600">Create</button>
                    </div>
                )}
            </div>

            </div>
         </div>
        </div>
    )
};

