import { useState, useRef, useEffect } from 'react';
import {
    faArrowUpFromBracket,
    faCircleXmark,
    faFile,
    faCircleCheck
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const UploadModal = ({ onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Auto-open the modal when component mounts
  useEffect(() => {
    // You can add any initialization logic here
  }, []);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file) => {
    setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    });
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const resetUpload = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeModal = () => {
    resetUpload();
    // Call the onClose callback passed from parent
    if (onClose) {
      onClose();
    }
  };

  return (
    <div>
      {/* Modal Overlay - Now always visible since component is conditionally rendered */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"> 
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Upload File</h2>
            <FontAwesomeIcon onClick={closeModal} icon={faCircleXmark}
               className="text-2xl text-gray-400 transition-colors hover:text-gray-600"
            />
            
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {!uploadedFile ? (
              /* Upload Area */
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <FontAwesomeIcon icon={faArrowUpFromBracket} className={`mx-auto mb-4 text-4xl ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  {isDragging ? 'Drop your file here' : 'Upload a file'}
                </h3>
                <p className="mb-4 text-gray-600">
                  Drag and drop your file here, or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Choose File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              /* File Preview */
              <div className="space-y-4">
                <div className="flex items-center justify-center mb-4">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-4xl text-green-500" />
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <FontAwesomeIcon icon={faFile} className="mt-1 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(uploadedFile.size)} • {uploadedFile.type || 'Unknown type'}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={resetUpload}
                  className="w-full py-2 font-medium text-blue-600 transition-colors hover:text-blue-700"
                >
                  Choose Different File
                </button>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end p-6 space-x-3 border-t border-gray-200">
            <button
              onClick={closeModal}
              className="px-4 py-2 font-medium transition-colors text-neutral-700 hover:text-gray-900"
            >Cancel</button>
            <button
              onClick={() => {
                if (uploadedFile) {
                  console.log('Uploading file:', uploadedFile);
                  // Here you would typically handle the actual upload
                  alert(`File "${uploadedFile.name}" ready for upload!`);
                  closeModal();
                }
              }}
              disabled={!uploadedFile}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                uploadedFile
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadModal;