import {
  faMagnifyingGlass,
  faEllipsisVertical,
  faFilePdf
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from "react";

const Documents = () => {
  const [input, setInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filterTags = ["BSIT", "Compliance", "BSED"];
  const [tags, setTags] = useState(filterTags);

  const uploadedFiles = [
    "Sample.pdf",
    "Sample(2).pdf",
    "Sample(3).pdf",
    "Sample(4).pdf",
    "Sample(5).pdf",
    "Sample(6).pdf",
  ];

  const filteredFiles = uploadedFiles.filter((file) =>
    file.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = () => {
    setSearchTerm(input.trim());
  };

  const handleClearTags = () => {
    setTags([]);
  };

  return (
    <>

      {/* Outer container for the document panel */}
      <div className="border border-neutral-800 rounded-[20px] min-w-[950px] min-h-[450px] shadow-md p-6 bg-neutral-200 dark:bg-gray-900 dark:inset-shadow-sm dark:inset-shadow-zuccini-800">
        
        {/* Search Bar Section */}
        <div className="flex max-w-[500px] items-center mx-auto mb-4">
          <label className="mr-2 text-lg font-semibold text-neutral-800 dark:text-white">Search</label>
          <input
            type="text"
            placeholder="Search Document"

            className="flex-grow px-3 py-2 text-base transition duration-300 bg-gray-200 border border-r-0 text-neutral-800 rounded-l-md focus:outline-none focus:ring focus:ring-zuccini-600 placeholder-neutral-500 dark:text-white dark:border-none dark:inset-shadow-sm dark:inset-shadow-zuccini-800 dark:bg-gray-950"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <button
            className="px-6 w-[45px] h-[42px] flex items-center justify-center border rounded-r-md cursor-pointer bg-zuccini-600 hover:bg-zuccini-500 transition-all duration-500"
            onClick={handleSearch}
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-lg text-white" />
          </button>
        </div>


        {/* Filter Tags Section */}
        <div className="border border-neutral-800 rounded-[20px] px-5 py-4 dark:bg-gray-950 dark:inset-shadow-sm dark:inset-shadow-zuccini-800">
          
          {/* Header + removable tag chip (inline using flex) */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <p className="text-sm font-medium text-neutral-800 dark:text-white">Filter by:</p>
            <div className="inline-block px-4 py-1 text-sm text-gray-700 border rounded-full cursor-pointer border-neutral-400 dark:text-white">
              Tags
              <button
                className="ml-3 text-sm text-gray-500 cursor-pointer hover:text-red-600"
                onClick={handleClearTags}
              >
                ✕
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <div
                key={tag}
                className="px-4 py-1 text-sm border rounded-full cursor-pointer text-neutral-800 border-neutral-400 hover:bg-neutral-300 dark:hover:bg-neutral-600 dark:text-white"
              >
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* Responsive Flex Layout for Documents */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 mt-6">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file, index) => (
              <div
                key={index}

                className="border text-neutral-800 border-neutral-800 shadow-md rounded-[20px] px-4 py-5 flex justify-between items-center cursor-pointer hover:shadow-lg dark:hover:shadow-md dark:hover:shadow-zuccini-800 transition dark:bg-gray-950 dark:inset-shadow-sm dark:inset-shadow-zuccini-800"
              >
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faFilePdf} className="text-xl text-red-600 cursor-pointer dark:text-red-500" />
                  <span className="text-sm font-medium cursor-pointer text-neutral-800 hover:underline dark:text-white">
                    {file}
                  </span>
                </div>
                <FontAwesomeIcon icon={faEllipsisVertical} className="text-xl text-gray-500 cursor-pointer hover:text-black" />
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center w-full py-10">
              <p className="text-base italic font-semibold text-gray-500">No documents found</p>
            </div>
          )}
        </div>
    </>
  );
};

export default Documents;