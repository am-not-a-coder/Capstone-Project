export default function ProgramCard({ program, onClick, className = "" }) {


  return (
    <div 
      className={`${className} group relative flex flex-col cursor-pointer h-56 overflow-hidden rounded-xl border border-gray-200 bg-gray-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-gray-300 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-gray-600 sm:w-1/2 md:w-1/3 lg:w-1/5`}
      onClick={onClick}
    >
      {/* Header Image/Color Section */}
      <div className="relative overflow-hidden h-2/5">
        {program.img ? (
          // Institute cards with image
          <div className="relative h-full">
            <img
              src={program.img}
              alt={`${program.code} logo`}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        ) : (
          // Program cards with color
          <div
            style={{ backgroundColor: program.programColor }} 
            className="relative w-full h-full transition-all duration-300 group-hover:brightness-110"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute w-8 h-8 rounded-full bottom-2 right-2 bg-white/20 backdrop-blur-sm"></div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col justify-between flex-1 p-4 space-y-3">
        {/* Program Code and Name */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold leading-tight text-gray-900 transition-colors duration-200 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {program.programCode || program.code}
          </h3>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-2">
            {program.programName || program.name}
          </p>
        </div>

        {/* Head/Facilitator Info */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="text-sm text-gray-700 truncate dark:text-gray-300">
              <span className="font-medium">
                {program.instituteHead ? 'Head: ' : 'Facilitator: '}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {program.instituteHead || program.programDean}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 transition-opacity duration-300 opacity-0 pointer-events-none bg-gradient-to-t from-blue-500/5 to-transparent group-hover:opacity-100"></div>
    </div>
  );
}