
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

}