export default function ProgramCard({ program }) {

    
    return (
            <div
              key={program.code}
              className="w-full sm:w-1/2 md:w-1/3 lg:w-1/5 h-48 bg-white rounded-lg shadow flex flex-col overflow-hidden"
            >
              <div className="h-2/5" style={{backgroundColor: program.color}}></div>
              <div className="flex-1 flex flex-col justify-between p-2">
                <div>
                  <div className="font-semibold text-black text-lg">{program.code}</div>
                  <div className="text-xs text-gray-500 mb-5">{program.name}</div>
                  <div className="text-lg text-gray-500 ">Facilitator: {program.programDean}</div>
                </div>
              </div>
            </div>
    )
}