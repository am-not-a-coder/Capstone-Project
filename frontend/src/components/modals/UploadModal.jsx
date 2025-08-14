import { useState, useRef, useEffect } from 'react';
import {
    faArrowUpFromBracket,
    faCircleXmark,
    faFile,
    faCircleCheck
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import StatusModal from './StatusModal';
import { apiPostForm } from '../../utils/api_utils';

const UploadModal = ({ onClose, showModal, criteriaID }) => {


  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [fileType, setFileType] = useState(''); // State to hold the file type
  const [fileName, setFileName] = useState(''); // State to hold the file name
  
  const errorMessage = useRef(null);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState("success");


  
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
    const files = e.dataTransfer.files;
    
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file) => {
    if (!file || file.type !== '.pdf') {
      errorMessage.current.textContent = 'Please upload a valid PDF file.';
      return;
    }
    
    setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    });

    setFileType(file.type);
    setFileName(file.name);
    
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
  const handleUpload = async () =>{
    
    const formData = new FormData()
      formData.append('uploadedFile', uploadedFile.file);
      formData.append('fileType', fileType);
      formData.append('fileName', fileName);
      formData.append('criteriaID',)

    try{
      
      const response = await apiPostForm('/api/accreditation/upload', formData,{withCredentials: true});
      
      if(response.success){
        setStatusMessage('File uploaded successfully!');
        setStatusType('success');
        setShowStatusModal(true);
        resetUpload(); // Reset the upload state after successful upload
      }

    }catch(err){
      setStatusMessage('File upload failed. Please try again.');
      setStatusType('error');
      setShowStatusModal(true);
      resetUpload(); // Reset the upload state after successful upload
    }


  }


  return (
    <div>
      {/* Modal Overlay*/}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"> 
        {showStatusModal && (
          <StatusModal showModal={showStatusModal} message={statusMessage} type={statusType} onClick={(e) => {setShowStatusModal(false); closeModal(e)}} /> 
        )}
        <div className={`bg-gray-100 dark:bg-gray-900  rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto ${showModal ? 'fade-in' : 'fade-out'}`}>
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upload File</h2>
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
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-300 hover:border-gray-400 dark:bg-gray-800'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <FontAwesomeIcon icon={faArrowUpFromBracket} className={`mx-auto mb-4 text-4xl ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-300">
                  {isDragging ? 'Drop your file here' : 'Upload a file'}
                </h3>
                <p className="text-gray-600 dark:text-gray-500">
                  Drag and drop your file here, or click to browse
                </p>

                 <p className="mb-4 italic text-gray-600/50 dark:text-gray-500">
                  Supported formats: PDF (max 10MB)
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
                  name="uploadedFile"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <p ref={errorMessage} className="mt-2 text-sm italic text-red-500" />

              </div>
            
            ) : (
              /* File Preview */
              <div className="space-y-4">
                <div className="flex items-center justify-center mb-4">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-4xl text-green-500" />
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-start space-x-3">
                    <FontAwesomeIcon icon={faFile} className="mt-1 text-gray-400 dark:text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-300">
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
                  className="w-full py-2 font-medium text-blue-600 transition-colors cursor-pointer hover:text-blue-700"
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
              className="px-4 py-2 font-medium transition-colors bg-gray-300 rounded-md cursor-pointer dark:bg-gray-700 text-neutral-500 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-400/50 dark:hover:bg-gray-600 dark:hover:text-gray-200"
            >Cancel</button>
            <button
              onClick={handleUpload}
              disabled={!uploadedFile}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                uploadedFile
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
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