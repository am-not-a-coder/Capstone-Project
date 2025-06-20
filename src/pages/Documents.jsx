import {
  faMagnifyingGlass,
  faEllipsisVertical,
  faFilePdf
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from "react";

const Documents = () => {
  // State for live input from the search bar
  const [input, setInput] = useState("");

  // State that triggers actual filtering (when user press Enter or clicks Search)
  const [searchTerm, setSearchTerm] = useState("");

  const filterTags = ["BSIT", "Compliance", "BSED"];

  // State to hold tags
  const [tags, setTags] = useState(filterTags);

  // Sample list of uploaded files
  const uploadedFiles = [
    "Sample.pdf",
    "Sample(2).pdf",
    "Sample(3).pdf",
    "Sample(4).pdf",
    "Sample(5).pdf",
    "Sample(6).pdf",
  ];

  // Filters the files based on searchTerm (case-insensitive)
  const filteredFiles = uploadedFiles.filter((file) =>
    file.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Updates the actual searchTerm when search button is clicked or Enter is pressed
  const handleSearch = () => {
    setSearchTerm(input.trim()); // remove extra spaces
  };

  // Function to clear all tags when ✕ button is clicked
  const handleClearTags = () => {
  setTags([]); // Removes all tags
  };

  return (
    <main className="flex-1 p-6 h-full col-span-4 row-span-4 col-start-2 row-start-2 overflow-y-auto font-sans text-gray-800">
      {/* Outer container for the document panel */}
      <div className="border border-gray-300 rounded-[20px] max-w-[950px] mx-auto bg-white shadow-md p-6">
        
        {/* Search Bar Section */}
        <div className="flex max-w-[500px] items-center mx-auto mb-4">
          <label className="text-lg font-semibold mr-2">Search</label>
          
          {/* Input field for typing search query */}
          <input
            type="text"
            placeholder="Search Document"
            className="flex-grow px-3 py-2 text-base bg-gray-200 border border-gray-400 border-r-0 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch(); // trigger search on Enter key
            }}
          />

          {/* Button to trigger search when clicked */}
          <button
            className="px-6 w-[45px] h-[42px] flex items-center justify-center border border-gray-400 rounded-r-md cursor-pointer hover:bg-gray-300 transition"
            onClick={handleSearch}
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-600 text-lg" />
          </button>
        </div>

        {/* Filter Tags Section */}
        <div className="border border-gray-300 bg-gray-50 rounded-[20px] px-5 py-4">
          
          {/* Header + removable tag chip (inline using flex) */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <p className="text-sm font-medium">Filter by:</p>

            {/* Example selected filter with remove "✕" */}
            <div className="inline-block text-sm bg-white text-gray-700 border border-gray-300 px-4 py-1 rounded-full">
              Tags
              <button className="ml-3 text-sm text-gray-500 cursor-pointer hover:text-red-600"
              onClick={handleClearTags}
              >✕</button>
            </div>
          </div>

          {/* Filter tags buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            {tags.map((tag) => (
              <div
                key={tag}
                className="text-sm border border-gray-400 px-4 py-1 rounded-full cursor-pointer hover:bg-gray-200" 
              >
                {tag}
              </div>
            ))}
            
          </div>

        </div>

        {/* Grid for displaying filtered documents */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {filteredFiles.length > 0 ? (
            // Render each matched file
            filteredFiles.map((file, index) => (
              <div
                key={index}
                className="border border-gray-300 bg-gray-100 rounded-[20px] px-4 py-3 flex justify-between items-center hover:shadow transition"
              >
                <div className="flex items-center space-x-3">
                  {/* Icon for PDF */}
                  <FontAwesomeIcon icon={faFilePdf} className="text-red-600 text-xl cursor-pointer" />

                  {/* Filename */}
                  <span className="hover:underline cursor-pointer text-sm font-medium">
                    {file}
                  </span>
                </div>

                {/* Menu icon (⋮) */}
                <FontAwesomeIcon icon={faEllipsisVertical} className="text-gray-500 text-xl hover:text-black cursor-pointer" />
              </div>
            ))
          ) : (
            // Message when no files found
            <div className="col-span-3 flex justify-center items-center py-10">
                <p className="text-gray-500 text-base italic font-semibold">No documents found</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Documents;
