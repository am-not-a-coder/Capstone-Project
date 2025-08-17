import { useState, useRef, useEffect } from 'react';
import {
    faArrowUpFromBracket,
    faCircleXmark,
    faFile,
    faCircleCheck,
    faSpinner  // Add this import
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import StatusModal from './StatusModal';
import { apiPostForm } from '../../utils/api_utils';

const UploadModal = ({ onClose, showModal, criteriaID, onUploadSuccess}) => {

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [fileType, setFileType] = useState('');
  const [fileName, setFileName] = useState('');
  
  const errorMessage = useRef(null);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState("success");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    // Initialization logic here
  }, []);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
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
    if (!file || file.type !== 'application/pdf') {
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
    
    // Reset progress when new file is selected
    setUploadProgress(0);
    setIsUploading(false);
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
    setIsUploading(false);
    setUploadProgress(0);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeModal = () => {
    resetUpload();
    if (onClose) {
      onClose();
    }
  };

  const startProgress = () => {
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90){
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200)
    return interval;
  }

  const handleUpload = async () => {
    setIsUploading(true)
    setUploadProgress(0)

    const progressInterval = startProgress();
    
    const formData = new FormData()
    formData.append('uploadedFile', uploadedFile.file);
    formData.append('fileType', fileType);
    formData.append('fileName', fileName);
    formData.append('criteriaID', criteriaID);

    try{
      const response = await apiPostForm('/api/accreditation/upload', formData,{withCredentials: true});
      
      // Clear the simulation interval
      clearInterval(progressInterval);
      setUploadProgress(100)

      if(response.success){
        // Delay to show the 100% completion
        setTimeout(() => {
          setStatusMessage('File uploaded successfully!');
          setStatusType('success');
          setIsUploading(false);
          setShowStatusModal(true);
          resetUpload();
          
          if(onUploadSuccess){
            onUploadSuccess();
          }
        }, 500);       
      }

    }catch(err){
      clearInterval(progressInterval); // Add this line
      setStatusMessage('File upload failed. Please try again.');
      setStatusType('error');
      setIsUploading(false);
      setUploadProgress(0);
      setShowStatusModal(true);
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
            <FontAwesomeIcon 
              onClick={closeModal} 
              icon={faCircleXmark}
              className={`text-2xl text-gray-400 transition-colors hover:text-gray-600 ${isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              style={{ pointerEvents: isUploading ? 'none' : 'auto' }}
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
                } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
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
                  disabled={isUploading}
                >
                  Choose File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  name="uploadedFile"
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={isUploading}
                />
                <p ref={errorMessage} className="mt-2 text-sm italic text-red-500" />

              </div>
            
            ) : (
              /* File Preview */
              <div className="space-y-4">
                {/* Success Icon or Spinner */}
                <div className="flex items-center justify-center mb-4">
                  {isUploading ? (
                    <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-500 animate-spin" />
                  ): (
                    <FontAwesomeIcon icon={faCircleCheck} className="text-4xl text-green-500" />
                  )}
                </div>
                  
                {/* File Details */}
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

                {/* Progress Bar */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
                      <span className="text-gray-600 dark:text-gray-400">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Change File Button */}
                {!isUploading && (
                  <button
                    onClick={resetUpload}
                    className="w-full py-2 font-medium text-blue-600 transition-colors cursor-pointer hover:text-blue-700"
                  >
                    Choose Different File
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end p-6 space-x-3 border-t border-gray-200">
            <button
              onClick={closeModal}
              disabled={isUploading}
              className={`px-4 py-2 font-medium transition-colors rounded-md ${
                isUploading 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-300 dark:bg-gray-700 text-neutral-500 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-400/50 dark:hover:bg-gray-600 dark:hover:text-gray-200 cursor-pointer'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!uploadedFile || isUploading}
              className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center ${
                uploadedFile && !isUploading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isUploading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin"/> 
                  Uploading...
                </>
              ): (
                'Upload'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadModal;