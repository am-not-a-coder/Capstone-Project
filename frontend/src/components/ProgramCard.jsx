export default function ProgramCard({ program }) {

    
    return (
            <div
              key={program.code}
              className="flex flex-col w-full h-48 overflow-hidden border rounded-lg shadow sm:w-1/2 md:w-1/3 lg:w-1/5 border-neutral-800 dark:bg-woodsmoke-950 dark:inset-shadow-sm dark:inset-shadow-zuccini-800"
            >
              <div className="flex items-center justify-center h-2/5">
                {program.img ? 
                // DISPLAYS INSTITUTE CARDS
                (
                  // Display image for institutes
                  <img 
                    src={program.img} 
                    alt={`${program.code} logo`}
                    className="object-cover w-full h-full"
                  />
                ) : 
                // DISPLAYS PROGRAM CARDS
                (
                  // Display color for programs
                  <div style={{backgroundColor: program.programColor}} className="w-full h-full"></div>
                )}
              </div>
              <div className="flex flex-col justify-between flex-1 p-2">
                <div>
                  <div className="text-lg font-semibold text-black dark:text-white">{program.programCode}</div>
                  <div className="mb-5 text-xs text-gray-500 dark:text-white">{program.programName}</div>
                  <div className="text-lg text-gray-500 dark:text-neutral-300">
                    {program.instituteHead ? `Head: ${program.instituteHead}` : `Facilitator: ${program.programDean}`}
                  </div>
                </div>
              </div>
            </div>
    )
}