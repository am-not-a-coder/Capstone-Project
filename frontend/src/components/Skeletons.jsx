
export const DocumentSkeleton = () => {

    return(
    // Container
    <div className="relative animate-pulse h-21 min-w-80 bg-gray-400 shadow-md rounded-[20px] px-4 py-5 flex justify-between items-center cursor-pointer dark:bg-gray-950/50 ">
        <div className="relative flex items-center space-x-3">
            {/* Icon */}
            <div className="w-10 h-10 bg-gray-500 rounded-full animate-pulse" />

            {/* Filename */}
            <div className='flex flex-col'>
                <div className="w-40 h-5 mb-1 bg-gray-500 rounded-lg animate-pulse"/>
                <div className="w-20 h-5 bg-gray-500 rounded-lg animate-pulse"/>
            </div>
        </div>                
    {/* Ellipsis */}
        <div className='absolute h-5 p-1 py-3 transition-all duration-300 bg-gray-500 rounded-full animate-pulse top-8 right-5'/>                  
    </div>
    )
}

export const UserSkeleton = () => {

    return (        
            <div className="animate-pulse min-w-[230px] min-h-[270px] overflow-hidden transition-all duration-300 transform bg-gray-300 border border-gray-200 shadow-lg cursor-pointer dark:bg-gray-800 rounded-2xl dark:border-gray-700">
                <div className="p-6 text-center">                    
                    {/* Profile Circle  */}
                    <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 transition-all duration-300 bg-gray-500 rounded-full bg-gradient-to-br dark:from-gray-600 dark:to-gray-700 animate-pulse"/>                        
                    
                    {/* User name */}
                    <div className="w-full animate-pulse h-7 mb-3 font-bold rounded-full min-w-[10px] bg-gray-400 dark:bg-gray-700 "/>
                    {/* User Program */}
                    <div className="w-full h-3 mb-2 font-bold bg-gray-400 rounded-full animate-pulse dark:bg-gray-700 "/>
                    <div className="w-full animate-pulse h-3 mb-2 font-bold rounded-full min-w-[5px] bg-gray-400 dark:bg-gray-700 "/>
                    <div className="w-full animate-pulse h-3 mb-2 font-bold rounded-full min-w-[5px] bg-gray-400 dark:bg-gray-700 "/>
                    
                    <div className="flex flex-row items-center justify-around mt-3">
                        <div className="w-5 h-5 mr-3 bg-gray-400 rounded-full animate-pulse dark:bg-gray-700"/>
                        <div className="w-full h-3 bg-gray-400 rounded-full animate-pulse dark:bg-gray-700 "/>
                    </div>
                </div>
            </div>

    )
};

export const CardSkeleton = () => {

    return (
    <div 
      className={`animate-pulse relative flex flex-col cursor-pointer h-56 overflow-hidden rounded-xl border border-gray-200 bg-gray-200 shadow-sm  dark:bg-gray-900 dark:border-gray-700  sm:w-1/2 md:w-1/3 lg:w-1/5`}     
    >
      {/* Header Image/Color Section */}
      <div className="relative overflow-hidden h-2/5 animate-pulse">
        
          {/* Institute cards with image */}
          <div className="relative h-full">
           {/* Image */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
    
          {/* Program cards with color */}
          <div className="relative w-full h-full transition-all duration-300 group-hover:brightness-110">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute w-8 h-8 rounded-full bottom-2 right-2 bg-white/20 backdrop-blur-sm"></div>
          </div>
    
      </div>

      {/* Content Section */}
      <div className="flex flex-col justify-between flex-1 p-4 space-y-3 animate-pulse">
        
        <div className="space-y-2">
          <div className="max-w-[60px] h-[25px] rounded-full bg-gray-400 animate-pulse"/> {/* Program Code */}

          <div className="w-full h-[15px] bg-gray-400 animate-pulse rounded-full "/> {/* Program Name */}
          <div className="w-1/2 h-[15px] bg-gray-400 animate-pulse rounded-full "/>                    
        </div>

        {/* Head/Facilitator Info */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
            <div className="h-[15px] w-1/2 bg-gray-400 rounded-full"/>
            <div className="h-[15px] w-1/2 bg-gray-400 rounded-full"/>
          </div>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 transition-opacity duration-300 opacity-0 pointer-events-none bg-gradient-to-t from-blue-500/5 to-transparent group-hover:opacity-100"></div>
    </div>
  );
 }