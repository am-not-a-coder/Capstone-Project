
export default function CreateCard({ setShowForm, title, className = "" }) {
  return (
    <button 
      onClick={() => setShowForm(true)}  
      className={`${className} group relative flex flex-col items-center justify-center cursor-pointer h-56 overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-blue-400 hover:bg-blue-50 dark:bg-gray-800 dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-gray-700 sm:w-1/2 md:w-1/3 lg:w-1/5`}
    >
      {/* Icon Section */}
      <div className="flex items-center justify-center w-16 h-16 mb-3 transition-colors duration-300 bg-gray-200 rounded-full group-hover:bg-blue-100 dark:bg-gray-700 dark:group-hover:bg-blue-900">
        <svg 
          className="w-8 h-8 text-gray-500 transition-colors duration-300 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>

      {/* Text Content */}
      <div className="space-y-1 text-center">
        <h3 className="text-lg font-semibold text-gray-700 transition-colors duration-200 group-hover:text-blue-700 dark:text-gray-300 dark:group-hover:text-blue-300">
          Add New
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create a new {title}
        </p>
      </div>

      {/* Subtle animated background effect */}
      <div className="absolute inset-0 transition-opacity duration-300 opacity-0 pointer-events-none bg-gradient-to-br from-blue-500/5 to-purple-500/5 group-hover:opacity-100"></div>
      
      {/* Corner accent */}
      <div className="absolute w-2 h-2 transition-opacity duration-300 bg-blue-400 rounded-full opacity-0 top-3 right-3 group-hover:opacity-100"></div>
    </button>
  );
}