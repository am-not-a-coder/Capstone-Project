export default function CreateCard({ setShowForm, onClick, className="" }) {
    return (
        <button onClick={() => setShowForm(true)}  className={` ${className} w-full mt-6 lg:mt-0 sm:w-1/2 md:w-1/3 lg:w-1/5 h-20 lg:h-48 bg-gray-500  rounded-lg flex items-center justify-center text-4xl text-white cursor-pointer`} >
          ✎
        </button>
    )
}