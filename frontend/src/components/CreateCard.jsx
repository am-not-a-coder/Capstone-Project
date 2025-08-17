export default function CreateCard({ setShowForm }) {
    return (
        <button className="w-full sm:w-1/2 md:w-1/3 lg:w-1/5 max-w-[25%] xl:max-w-[75%] h-48 bg-gray-500 rounded-lg flex items-center justify-center text-4xl text-white cursor-pointer
        " onClick={() => setShowForm(true)}>
          ✎
        </button>
    )
}