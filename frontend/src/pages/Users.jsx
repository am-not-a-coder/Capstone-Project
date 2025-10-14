// import no profile icon from fontawesome
import{
  faCircleUser,
  faEye,
  faEyeSlash,
  faPlus,
  faSearch,
  faTimes,
  faTrash,
  faBookOpen,
  faUser,
  faEnvelope,
  faPhone,
  faBuilding,
  faTriangleExclamation,
  faSpinner,
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useEffect } from 'react';
import StatusModal from '../components/modals/StatusModal';
import { adminHelper, coAdminHelper } from '../utils/auth_utils';
import { apiDelete, apiGet, apiPostForm, apiGetBlob } from '../utils/api_utils';
import { Navigate } from 'react-router-dom';
import Switch from '../components/Switch'
import { UserSkeleton } from '../components/Skeletons';
import Select from 'react-select'
import makeAnimated from 'react-select/animated'

const Users = () => {
  //check admin or co-admin
  const isAdmin = adminHelper()
  const isCoAdmin = coAdminHelper()
  if (!isAdmin && !isCoAdmin) return <Navigate to='/Dashboard' replace />

  // user info
  const [employeeID, setEmployeeID] = useState("");  
  const [fName, setFName] = useState("");  
  const [lName, setLName] = useState("");  
  const [suffix, setSuffix] = useState(""); 
  const [programID, setProgramID] = useState("");  
  const [areaID, setAreaID] = useState("");  
  const [password, setPassword] = useState("");  
  const [email, setEmail] = useState("");  
  const [contactNum, setContactNum] = useState("");  
  const [profilePic, setProfilePic] = useState(null); 
  const [CoAdminAccess, setCoAdminAccess] = useState(false);
  
  const [allAreas, setAllAreas] = useState([]);
<<<<<<<<< Temporary merge branch 1
  const [areaReferenceOptions, setAreaReferenceOptions] = useState([]);
=========
  const [areaReferenceOptions, setAreaReferenceOptions] = useState([]);  
>>>>>>>>> Temporary merge branch 2
  const [programOption, setProgramOption] = useState([]);    
  const [areaOption, setAreaOption] = useState([]);    
  const [visible, makeVisible] = useState("list");  
  const [submittedUsers, setSubmittedUsers] = useState([]); 

  const [showDetails, setShowDetails] = useState(false); // state for showing user details
  const [removeUser, setRemoveUser] = useState(false); // state for removing user
  const [selectedUser, setSelectedUser] = useState([]); // state for selected user
  const [removeConfirmation, setRemoveConfirmation] = useState(false); // state for showing remove button
  const [searchQuery, setSearchQuery] = useState(""); // state for search query

  const[hidePassword, setHidePassword] = useState(); //state for hiding the password

  const [showStatusModal, setShowStatusModal] = useState(false); // shows the status modal
  const [statusMessage, setStatusMessage] = useState(null); // status message
  const [statusType, setStatusType] = useState("success"); // status type (success/error)

  const [usersLoading, setUsersLoading] = useState(false);
  const [loading, setLoading] = useState(false); 

  const [selectedPrograms, setSelectedPrograms] = useState([])
  const [selectedAreas, setSelectedAreas] = useState([])
  const [employeeIDError, setEmployeeIDError] = useState("");
  const [contactNumError, setContactNumError] = useState("");
  
  // Admin permission states
  const [ratingEnable, setRatingEnable] = useState(false);
  const [canEditUser, setCanEditUser] = useState(false);
  const [crudForms, setCrudForms] = useState(false);
  const [crudPrograms, setCrudPrograms] = useState(false);
  const [crudInstitute, setCrudInstitute] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState([])
  const [folderOptions, setFolderOptions] = useState([])
  const [showUserSelector, setShowUserSelector] = useState(false)

  //select animation
  const animatedComponents = makeAnimated()

  if (removeUser) {
      setSubmittedUsers(submittedUsers.filter(user => user !== selectedUser)); 
      setSelectedUser(null);
      setRemoveUser(false);
      setShowDetails(false);
  }

  const detailsAndSelectedUser = (user) => {
      setSelectedUser(user); 
      setShowDetails(true);        
      // Clear employeeID when viewing details to reset button text
      setEmployeeID("");
  }

  const handleEditUser = async (user) => {
        console.log('Edit button clicked, user data:', user)
        
        // Populate form with existing user data for editing
        setEmployeeID(user.employeeID)
        setFName(user.fName)
        setLName(user.lName)
        setSuffix(user.suffix || "")
        setEmail(user.email)
        setContactNum(user.contactNum)
        setPassword("") // Don't populate password for security
        setCoAdminAccess(user.isCoAdmin || false)
        setRatingEnable(user.isRating || false)
        setCanEditUser(user.isEdit || false)
        setCrudForms(user.crudFormsEnable || false)
        setCrudPrograms(user.crudProgramEnable || false)
        setCrudInstitute(user.crudInstituteEnable || false)

        // Get detailed program and area information for the Select components
        try {
            // Fetch all programs and areas to match with user's assigned ones
            const programsRes = await apiGet('/api/program')
            const areasRes = await apiGet('/api/area')
            
            console.log('Programs API response:', programsRes)
            console.log('Areas API response:', areasRes)

            if (programsRes.success && areasRes.success) {
                // Map user program names to program objects
                const userPrograms = user.programs || []
                // Get the actual arrays from the response
                const programsArray = programsRes.data?.programs || programsRes.programs || []
                const areasArray = areasRes.data?.areas || areasRes.areas || []
                
                const selectedPrograms = userPrograms.map(programName => {
                    const program = programsArray.find(p => p.programName === programName)
                    return program ? { value: program.programID, label: program.programName } : null
                }).filter(Boolean)

                // Map user area strings to area objects
                const userAreas = user.areas || []
                const selectedAreas = userAreas.map(areaString => {
                    // areaString format: "areaNum: areaName"
                    const area = areasArray.find(a => `${a.areaNum}: ${a.areaName}` === areaString)
                    return area ? { value: area.areaID, label: `${area.areaNum}: ${area.areaName}`, areaNum: area.areaNum } : null
                }).filter(Boolean)

                setSelectedPrograms(selectedPrograms)
                setSelectedAreas(selectedAreas)
            }
        } catch (error) {
            console.error('Error fetching programs/areas for edit:', error)
            // Fallback to empty arrays if fetch fails
            setSelectedPrograms([])
            setSelectedAreas([])
        }

        // Load user's folder permissions
        try {
            if (user.folders && user.folders.length > 0) {
                // Map folder paths to the format expected by the Select component
                const selectedFolders = user.folders.map(folderPath => {
                    // Extract program name from path: UDMS_Repository/Programs/BSED -> BSED
                    const parts = folderPath.split('/')
                    const programName = parts[parts.length - 1]
                    return {
                        value: folderPath,
                        label: programName
                    }
                })
                setSelectedFolder(selectedFolders)
                console.log('Loaded user folders:', selectedFolders)
            } else {
                setSelectedFolder([])
            }
        } catch (error) {
            console.error('Error loading user folders:', error)
            setSelectedFolder([])
        }

            // Close the details modal and show the edit form
            setShowDetails(false)
            setRemoveConfirmation(false)
            makeVisible("edit")
  }

  const handleCreateUser = async (e) => {
      e.preventDefault(); 

      // Validate that at least one program and area is selected
      if (selectedPrograms.length === 0) {
          setStatusMessage("Please select at least one program");
          setShowStatusModal(true);
          setStatusType("error");
          return;
      }
      
      if (selectedAreas.length === 0) {
          setStatusMessage("Please select at least one area");
          setShowStatusModal(true);
          setStatusType("error");
          return;
      }

      // Check if this is an edit operation (employeeID already exists)
      const isEdit = !!employeeID; // If employeeID exists, it's an edit

      if (!isEdit && !password) {
          setStatusMessage("Password is required for new users");
          setShowStatusModal(true);
          setStatusType("error");
          return;
      }

      // Validate that selected areas exist for all selected programs
      const selectedProgramIDs = selectedPrograms.map(p => p.value);
      const selectedAreaNums = selectedAreas.map(a => a.areaNum);
      
      // Check if all selected areas exist for all selected programs
      for (const areaNum of selectedAreaNums) {
          for (const programID of selectedProgramIDs) {
              const areaExists = allAreas.some(area => 
                  area.programID === programID && area.areaNum === areaNum
              );
              
              if (!areaExists) {
                  const program = programOption.find(p => p.programID === programID);
                  setStatusMessage(`Area ${areaNum} does not exist for ${program?.programName || 'selected program'}. Please select valid areas.`);
                  setShowStatusModal(true);
                  setStatusType("error");
                  return;
              }
          }
      }

      if ( CoAdminAccess ){
        if (!ratingEnable  && !canEditUser && !crudForms && !crudPrograms && !crudInstitute) {
            setStatusMessage("Please select at least one admin permission");
            setShowStatusModal(true);
            setStatusType("error");
            return;
        }
      }
      

      // Map selected area numbers to actual areaIDs for each program
      const areaIDs = [];
      for (const areaNum of selectedAreaNums) {
          for (const programID of selectedProgramIDs) {
              const area = allAreas.find(area => 
                  area.programID === programID && area.areaNum === areaNum
              );
              if (area) {
                  areaIDs.push(area.areaID);
              }
          }
      }

      const formData = new FormData();
          formData.append("employeeID", employeeID);
          if (password) formData.append("password", password); // Only include password if provided (for create/edit)
          formData.append("fName", fName);
          formData.append("lName", lName);
          formData.append("suffix", suffix);
          formData.append("email", email);
          formData.append("contactNum", contactNum);
           if(profilePic?.file) formData.append("profilePic", profilePic.file); 
          formData.append("programs", JSON.stringify(selectedPrograms.map(p => p.value)));
          formData.append("areas", JSON.stringify(areaIDs));
          formData.append("isCoAdmin", CoAdminAccess);
          formData.append("isRating", ratingEnable);
          formData.append("isEdit", canEditUser);
          formData.append("crudFormsEnable", crudForms);
          formData.append("crudProgramEnable", crudPrograms);
          formData.append("crudInstituteEnable", crudInstitute);
          formData.append('selectedFolder', JSON.stringify(selectedFolder.map(f => f.value)))


        console.log("Form data being sent:");
          for (let [key, value] of formData.entries()) {
              console.log(key, value);
          }

      try{
          setLoading(true)

          //Post request
          const res = await apiPostForm('/api/user', formData, {withCredentials: true});

          
          setStatusMessage(res.data.message);
          setShowStatusModal(true);
          setStatusType("success");
      
          const selectedProgram = programOption.find(program => program.programID == programID);
          const selectedProgramName = selectedProgram ? selectedProgram.programName: "";

          const selectedArea = areaOption.find(area => area.areaID == areaID);
          const selectedAreaName  = selectedArea ? selectedArea.areaNum : "";

          setSubmittedUsers(user => [...user,
              {
                  employeeID,
                  name: `${fName} ${lName} ${suffix}`,
                  email,
                  contactNum,
                  profilePic: profilePic?.file ? `/api/user/profile-pic/${employeeID}` : null,
                  programID,
                  areaID,
                  programName: selectedProgramName,
                  areaNum: selectedAreaName,
                  isCoAdmin: CoAdminAccess
                  
              }]);

          setLoading(false)
          
          setEmployeeID("")
          setFName("")
          setLName("")
          setSuffix("")
          setPassword("")
          setEmail("")
          setContactNum("")
          setProgramID("")
          setAreaID("")
          setProfilePic(null)
          setCoAdminAccess(false)
          setSelectedPrograms([])
          setSelectedAreas([])
          setSelectedFolder([])
          setRatingEnable(false)
          setCanEditUser(false)
          setCrudForms(false)
          setCrudPrograms(false)
          setCrudInstitute(false)

          makeVisible("list")
      
      } catch(err){
          console.error("Full error object:", err);
          console.error("Error response:", err.response);
          console.error("Error response data:", err.response?.data);
          console.error("Error response status:", err.response?.status);
          
          setStatusMessage("Server error. Please try again");
          setShowStatusModal(true);
          setStatusType("error");
          console.log(err.res?.data || err.message)
      }
  }

  useEffect(() => {
  const fetchUsers = async () => {
    if (!isAdmin && !isCoAdmin) return

    setUsersLoading(true)
      try {                
          // Get the users
          const res = await apiGet('/api/users');            

          if (Array.isArray(res.data.users)) {
              // Get profile pictures for each user
              const usersWithPics = await Promise.all(
                  res.data.users.map(async (user) => {
                      try {
                          if (user.profilePic) {
                              const picRes = await apiGetBlob(`/api/user/profile-pic/${user.employeeID}`);
                              
                              // Check if the request was successful
                              if (picRes && picRes.success && picRes.data) {
                                  console.log("Blob type:", picRes.data);
                                  const objectURL = URL.createObjectURL(picRes.data);
                                  return { ...user, profilePicUrl: objectURL };
                              } else {
                                  console.error(`Failed to load profile pic for ${user.employeeID}:`, picRes.error);
                                  return { ...user, profilePicUrl: null };
                              }
                          }
                          return { ...user, profilePicUrl: null };

                      } catch (error) {
                          console.error(`Error loading profile pic for ${user.employeeID}:`, error);
                          return { ...user, profilePicUrl: null };
                      } 
                  })          
              );  
              
              setSubmittedUsers(usersWithPics);
          } else {
              setSubmittedUsers([]);
          }
      } catch (err) {
          console.error("Error occurred during user fetching", err);
          setSubmittedUsers([]); // Set empty array on error
      } finally {
          setUsersLoading(false);
        }
  };

  fetchUsers();
}, [isAdmin, isCoAdmin]);

 
useEffect(() => {
  if (!isAdmin && !isCoAdmin) return 
  const fetchProgram = async () =>{

      const res = await apiGet('/api/program', 
          {withCredentials: true}
      )

      try{
          (Array.isArray(res.data.programs) ? setProgramOption(res.data.programs) : setProgramOption([]) )
      } catch(err){
          console.error("Error occurred during program fetching", err)
      }
  }

  fetchProgram();

}, [isAdmin])

  useEffect(() => {
  const fetchArea = async () => {
     const res = await apiGet('/api/area', 
          {withCredentials: true}
     )
     try{
          Array.isArray(res.data.area) ? (setAreaOption(res.data.area), setAllAreas(res.data.area)) : (setAreaOption([]), setAllAreas([]));
      } catch (err) {
          console.error("Error occurred during area fetching", err);
      }
  }
  fetchArea();
  }, [])

  // Fetch static area reference options
  useEffect(() => {
    const fetchAreaReference = async () => {
      try {
        const res = await apiGet('/api/area/option', {withCredentials: true})
        
        const areaOptions = res.data.map((area, index) => ({
          value: index + 1, // Using index as value since AreaReference might not have areaID
          label: `${area.areaNum}: ${area.areaName}`,
          areaNum: area.areaNum,
          areaName: area.areaName
        }));
        
        setAreaReferenceOptions(areaOptions);
        console.log(areaReferenceOptions)
      } catch (err) {
        console.error("Error occurred during area reference fetching", err);
      }
    }
    fetchAreaReference();
  }, [])
  
  function removeAndClose() {
      setRemoveUser(true); 
      setRemoveUser(false); 
      setShowDetails(false); 
  }

  const handleQuery = (e) => {
      makeVisible("searchList"); 
      setSearchQuery(e.target.value); 
  };

  const handleDeleteUser = async () => { 
      const id = selectedUser?.employeeID;

      if(!id){
          alert("No selected user for deletion")
          return;
      }

      try{

          const res = await apiDelete(`/api/user/${id}`,
              {withCredentials: true});

          
          setStatusMessage(res.data.message);
          setShowStatusModal(true);
          setStatusType("delete");
          removeAndClose();

          // Refresh Users
          const userRes = await apiGet('/api/users');
          setSubmittedUsers(userRes.data);

      } catch(err){
          console.error(err.response?.data || err.message);
          setStatusMessage("Failed to delete user");
          setStatusMessage(true);
          setStatusType("error");
      }
  }

  function exitShowDetails() {
      setRemoveConfirmation(false); 
      setShowDetails(false); 
  }

  const filteredUsers = submittedUsers.filter(
      user =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );



  useEffect(() => {
    const fetchFolders = async () => {
        try {
            const res = await apiGet('/api/documents')
            console.log('Full API response:', res.data) // Debug log
            
            // Based on your console output, the structure is:
            // folders: { BSED: {...}, BSIT: {...} }
            const programsFolders = res.data?.folders;
            
            console.log('Programs folders found:', programsFolders) // Debug log
            
            if (programsFolders && typeof programsFolders === 'object') {
                const options = Object.keys(programsFolders)
                    .filter(programName => programName && programName.trim() !== '') // Filter out empty or whitespace-only names
                    .map(programName => ({
                        value: `UDMS_Repository/Programs/${programName.trim()}`,
                        label: programName.trim()
                    }))
                    .filter(option => option.value && option.label); // Additional safety check
                
                console.log('Folder options created:', options) // Debug log
                setFolderOptions(options)
            } else {
                console.log('No programs folders found or invalid structure') // Debug log
                setFolderOptions([])
            }
        } catch (err) {
            console.error('Error fetching folders', err)
            setFolderOptions([]) // Set empty array on error
        }
    }
    
    // Always fetch folders for folder permissions (no longer dependent on CoAdminAccess)
        fetchFolders()
  }, []) // Remove CoAdminAccess dependency

  // Close user selector dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserSelector && !event.target.closest('.user-selector-container')) {
        setShowUserSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserSelector]);

    
      
    const validateEmployeeID = (value) => {
        // Regex pattern for xx-xx-xxx format (digits only)
        const pattern = /^\d{2}-\d{2}-\d{3}$/;
        
        if (!value) {
            setEmployeeIDError("Employee ID is required");
            return false;
        }
        
        if (!pattern.test(value)) {
            setEmployeeIDError("Format must be XX-XX-XXX (e.g., 22-16-075)");
            return false;
        }
        
        setEmployeeIDError("");
        return true;
    };

    const validateContactNum = (value) => {
        // Remove all non-digits for validation
        let digitsOnly = value.replace(/\D/g, '');
        
        if (!value) {
            setContactNumError("Contact number is required");
            return false;
        }
        
        // Remove the country code (63) if it's at the start
        if (digitsOnly.startsWith('63')) {
            digitsOnly = digitsOnly.slice(2);
        }
        
        // Check if it has exactly 10 digits (without country code)
        if (digitsOnly.length !== 10) {
            setContactNumError("Must be 10 digits (e.g., +63 912 345 6789)");
            return false;
        }
        setContactNumError("");
        return true;
    };


  return (
      <div className="min-h-screen p-6 border border-neutral-300 rounded-[20px] bg-neutral-200 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-800 dark:bg-gray-900">
      {showStatusModal && (
              <StatusModal message={statusMessage} type={statusType} showModal={showStatusModal} onClick={()=>setShowStatusModal(false)} />
          )}

         
          {/* Navigation and Search */}
          <div className="flex flex-col items-center justify-between gap-4 mb-8 lg:flex-row">
              <div className="flex p-1 border border-gray-200 shadow-lg bg-neutral-300 dark:bg-gray-800 rounded-xl dark:border-gray-700"   >
                  <button 
                      className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                          visible === "list" 
                              ? 'bg-green-500 text-white shadow-md transform scale-105' 
                              : 'text-gray-600 dark:text-gray-300 hover:bg-neutral-200 dark:hover:bg-gray-700'
                      }`} 
                      onClick={() => makeVisible("list")}
                  >
                      <FontAwesomeIcon icon={faUser} className="mr-2" />
                      Users List
                  </button>
                  <button 
                      className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                          visible === "add" 
                              ? 'bg-green-500 text-white shadow-md transform scale-105' 
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`} 
                      onClick={() => makeVisible("add")}
                  >
                      <FontAwesomeIcon icon={faPlus} className="mr-2" />
                      Add User
                  </button>
                  <div className="relative user-selector-container">
                    <button 
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                            visible === "edit" 
                                ? 'bg-blue-500 text-white shadow-md transform scale-105' 
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`} 
                        onClick={() => {
                          makeVisible("edit")
                          setShowUserSelector(!showUserSelector)
                        }}
                    >
                        <FontAwesomeIcon icon={faEdit} className="mr-2" />
                        Edit User
                    </button>
                    {visible === "edit" && showUserSelector && (
<<<<<<<<< Temporary merge branch 1
                      <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10">
=========
                      <div className="absolute left-0 z-10 mt-2 bg-white border border-gray-200 shadow-lg top-full w-80 dark:bg-gray-800 dark:border-gray-700 rounded-xl">
>>>>>>>>> Temporary merge branch 2
                        <div className="p-4">
                          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Select User to Edit:
                          </label>
                          <Select
                            placeholder="Choose a user..."
                            options={submittedUsers.map(user => ({
                              value: user.employeeID,
                              label: `${user.name} (${user.employeeID})`
                            }))}
                            onChange={(selectedOption) => {
                              if (selectedOption) {
                                const selectedUser = submittedUsers.find(u => u.employeeID === selectedOption.value);
                                if (selectedUser) {
                                  handleEditUser(selectedUser);
                                  setShowUserSelector(false); // Close dropdown after selection
                                }
                              }
                            }}
                            className="w-full text-black"
                            instanceId="edit-user-selector"
                            isSearchable={true}
                            noOptionsMessage={() => "No users found"}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                      </div>

              <div className="relative">
                  <FontAwesomeIcon 
                      icon={faSearch} 
                      className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2"
                  />
                  <input 
                      type="text" 
                      className='py-3 pl-12 pr-4 text-gray-800 placeholder-gray-400 transition-all duration-300 bg-gray-100 border border-gray-300 shadow-lg outline-none w-80 dark:bg-gray-800 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white dark:placeholder-gray-500'
                      onChange={handleQuery} 
                      value={searchQuery} 
                      placeholder='Search users...'
                  />
                      </div>
                      </div>

  {/* Add User Form */}
<div className={`${visible === "add" ? "block" : "hidden"} mb-8`}>
  <div className="p-8 bg-gray-100 border border-gray-200 shadow-xl dark:bg-gray-800 rounded-2xl dark:border-gray-700">
    <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">
      {employeeID ? 'Edit User' : 'Create New User'}
    </h2>
    
    <form onSubmit={handleCreateUser} className="flex flex-col gap-8 lg:flex-row">
      
      {/* Profile Picture Section */}
      <div className="flex flex-col items-center lg:w-1/3">
        <div className="mb-6">
          {profilePic?.preview ? (
            <div className="relative w-48 h-48 group">
              <img 
                src={profilePic.preview} 
                alt="Profile" 
                className="object-cover w-full h-full border-4 border-gray-200 rounded-full shadow-xl dark:border-gray-600" 
              />
              <button 
                type="button"
                onClick={() => setProfilePic(null)} 
                className="absolute flex items-center justify-center w-10 h-10 text-white transition-all duration-300 bg-red-500 rounded-full shadow-lg -top-2 -right-2 hover:bg-red-600 group-hover:scale-110"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-48 h-48 rounded-full shadow-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600">
              <FontAwesomeIcon icon={faCircleUser} className="text-gray-400 text-8xl dark:text-gray-500" />
            </div>
          )}
        </div>
        <label 
          htmlFor="fileInput" 
          className="px-6 py-3 font-semibold text-white transition-all duration-300 transform shadow-lg cursor-pointer bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl hover:shadow-xl hover:scale-105"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Choose Photo
        </label>
        <input 
          type="file" 
          id="fileInput" 
          name="profilePic" 
          hidden 
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setProfilePic({
                preview: URL.createObjectURL(file),
                file: file
              });
            }
          }}
                            />
                        </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 gap-6 lg:w-2/3 md:grid-cols-2">

        {/* Employee ID */}
        <div className="relative">
          <input 
            type="text" 
            value={employeeID} 
            required 
            maxLength={10}
            onChange={(e) => {
                let value = e.target.value;
                
                // Remove all non-digit characters (including dashes for processing)
                const digitsOnly = value.replace(/\D/g, '');
                
                // Limit to 7 digits max (XX-XX-XXX = 7 digits)
                if (digitsOnly.length > 7) {
                    return;
                }
                
                // Auto-format: add dashes at correct positions
                let formatted = digitsOnly;
                if (digitsOnly.length >= 3) {
                    formatted = digitsOnly.slice(0, 2) + '-' + digitsOnly.slice(2);
                }
                if (digitsOnly.length >= 5) {
                    formatted = digitsOnly.slice(0, 2) + '-' + digitsOnly.slice(2, 4) + '-' + digitsOnly.slice(4);
                }
                
                setEmployeeID(formatted);
                
                // Validate when complete
                if (formatted.length === 10) {
                    validateEmployeeID(formatted);
                } else if (formatted.length < 10) {
                    setEmployeeIDError("");
                }
            }}
            onBlur={(e) => validateEmployeeID(e.target.value)}
            name="employeeID" 
            id="employeeID"
            className="w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white peer-valid:top-0 peer-valid:text-xs peer-valid:text-blue-500"
            placeholder=" "
          />
          <label 
            htmlFor="employeeID" 
            className="absolute text-gray-500 transition-all left-4 top-3 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-0 peer-valid:text-xs peer-valid:text-blue-500"
          >
            Employee ID
          </label>
            {employeeIDError && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    {employeeIDError}
                </p>
            )}
        </div>

        {/* First Name */}
        <div className="relative">
          <input 
            type="text" 
            value={fName} 
            required 
            onChange={(e) => setFName(e.target.value)} 
            name="fName" 
            id="fName"
            className="w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
            placeholder=" "
          />
          <label 
            htmlFor="fName" 
            className="absolute text-gray-500 transition-all left-4 top-3 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-0 peer-valid:text-xs peer-valid:text-blue-500"
          >
            First Name
          </label>
        </div>

        {/* Last Name */}
        <div className="relative">
          <input 
            type="text" 
            value={lName} 
            required 
            onChange={(e) => setLName(e.target.value)} 
            name="lName" 
            id="lName"
            className="w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
            placeholder=" "
          />
          <label 
            htmlFor="lName" 
            className="absolute text-gray-500 transition-all left-4 top-3 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-0 peer-valid:text-xs peer-valid:text-blue-500"
          >
            Last Name
          </label>
        </div>

        {/* Suffix */}
        <div className="relative">
          <input 
            type="text" 
            value={suffix} 
            onChange={(e) => setSuffix(e.target.value)} 
            name="suffix" 
            id="suffix"
            className="w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
            placeholder=" "            
          />
          <label 
            htmlFor="suffix" 
            className="absolute text-gray-500 transition-all left-4 top-3 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-0 peer-valid:text-xs peer-valid:text-blue-500"
          >
            Suffix (Optional)
          </label>
        </div>
        
        {/* Password */}
        <div className="relative">
          <input 
            type={!hidePassword ? "password" : "text"} 
            value={password} 
            required 
            onChange={(e) => setPassword(e.target.value)} 
            name="password" 
            id="password"
            className="w-full px-4 py-3 pr-10 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
            placeholder=" "
          />
          <label 
            htmlFor="password" 
            className="absolute text-gray-500 transition-all left-4 top-3 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-0 peer-valid:text-xs peer-valid:text-blue-500"
          >
            Password
          </label>
          <button
            type="button"
            onClick={() => setHidePassword(!hidePassword)}
            className="absolute text-gray-500 -translate-y-1/2 right-4 top-1/2 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <FontAwesomeIcon icon={!hidePassword ? faEye : faEyeSlash} />
          </button>
                        </div>

        {/* Email */}
        <div className="relative">
          <input 
            type="email" 
            required 
            name="email" 
            id="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)}  
            className="w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
            placeholder=" "
          />
          <label 
            htmlFor="email" 
            className="absolute text-gray-500 transition-all left-4 top-3 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-0 peer-valid:text-xs peer-valid:text-blue-500"
          >
            Email Address
          </label>
                        </div>

        {/* Contact Number */}
        <div className="relative">
          <input 
            type="tel" 
            required 
            name="contactNum" 
            id="contactNum"
            value={contactNum} 
            maxLength={16}
            onChange={(e) => {
                let value = e.target.value;
                
                // Remove all non-digits
                let digitsOnly = value.replace(/\D/g, '');
                
                // Remove the country code (63) if it's at the start
                if (digitsOnly.startsWith('63')) {
                    digitsOnly = digitsOnly.slice(2);
                }
                
                // Limit to 10 digits (Philippine mobile number without country code)
                if (digitsOnly.length > 10) {
                    return;
                }
                
                
                // Auto-format: +63 XXX XXX XXXX
                let formatted = '';
                if (digitsOnly.length === 0) {
                    formatted = '';
                } else if (digitsOnly.length <= 3) {
                    formatted = '+63 ' + digitsOnly;
                } else if (digitsOnly.length <= 6) {
                    formatted = '+63 ' + digitsOnly.slice(0, 3) + ' ' + digitsOnly.slice(3);
                } else {
                    formatted = '+63 ' + digitsOnly.slice(0, 3) + ' ' + digitsOnly.slice(3, 6) + ' ' + digitsOnly.slice(6);
                }
                
                setContactNum(formatted);
                
                // Clear error while typing
                setContactNumError("");
            }}
            onBlur={(e) => {
                const value = e.target.value;
                if (value && value.length > 0) {
                    validateContactNum(value);
                }
            }}
            className="w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
            placeholder=" "
          />
          <label 
            htmlFor="contactNum" 
            className="absolute text-gray-500 transition-all left-4 top-3 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-0 peer-valid:text-xs peer-valid:text-blue-500"
          >
            Contact Number
          </label>
          {contactNumError && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  {contactNumError}
              </p>
          )}
        </div>

<<<<<<<<< Temporary merge branch 1
        {/* Program Select */}
        <div className="relative">
            <Select 
                closeMenuOnScroll={false}
                closeMenuOnSelect={false}
                components={animatedComponents}
                required
                isMulti
                value={selectedPrograms}
                onChange={setSelectedPrograms}
                options={programOption.map((program) => ({
                    value: program.programID,
                    label: program.programName
                }))}
                placeholder='Select Programs...'
                className='w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800'
                instanceId="program-select"
            />
        </div>

        {/* Area Select */}
        <div className="relative">
          <Select 
            closeMenuOnScroll={false}
            closeMenuOnSelect={false}
            components={animatedComponents}
            required
            isMulti
            value={selectedAreas} 
            onChange={setSelectedAreas}
            options={areaReferenceOptions || []}
            placeholder='Select Areas...'
            className="w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
            instanceId="area-select"/>

        </div>

        {/* Co-Admin Access Switch - Only admins can assign this */}
        {isAdmin && (
        <div className="relative">
=========
        {/* Co-Admin Access Switch - Only admins can assign this */}
        {isAdmin && (
        <div className="relative ">
>>>>>>>>> Temporary merge branch 2
          <div className="flex items-center justify-between px-4 py-3 border-2 border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl">
              <label className="text-base font-medium text-gray-700 dark:text-gray-300">
                Co-Admin Access
            </label>
              <Switch isChecked={CoAdminAccess} onChange={() => setCoAdminAccess((current) => !current)}/>
          </div>
        </div>
        )}

<<<<<<<<< Temporary merge branch 1
        {/* Additional Folder Access - Available for all users */}
        <div className="relative">
=========


        {/* Program Select */}
        <div className="relative col-span-2">
            <Select 
                closeMenuOnScroll={false}
                closeMenuOnSelect={false}
                components={animatedComponents}
                required
                isMulti
                value={selectedPrograms}
                onChange={setSelectedPrograms}
                options={programOption.map((program) => ({
                    value: program.programID,
                    label: program.programName
                }))}
                placeholder='Select Programs...'
                className='w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800'
                instanceId="program-select"
            />
        </div>

        {/* Area Select */}
        <div className="relative col-span-2">

          <Select 
            closeMenuOnScroll={false}
            closeMenuOnSelect={false}
            components={animatedComponents}
            required
            isMulti
            value={selectedAreas} 
            onChange={setSelectedAreas}
            options={areaReferenceOptions || []}
            placeholder='Select Areas...'
            className="w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
            instanceId="area-select"/>

        </div>
      

        {/* Additional Folder Access - Available for all users */}
        <div className="relative col-span-2">
>>>>>>>>> Temporary merge branch 2
          <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Additional Folder Access
          </label>
          <Select
            isMulti
            closeMenuOnSelect={false}
            closeMenuOnScroll={false}
            components={animatedComponents}
            value={selectedFolder}
            onChange={setSelectedFolder}
            options={folderOptions || []}
            placeholder='Select folders to give access...'
            noOptionsMessage={() => "No folders available"}
            className="w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
            instanceId="folder-select"/>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Grant access to additional program folders beyond assigned programs
          </p>
        </div>

        {/* Conditional Co-Admin Permissions - shown when Co-Admin is enabled */}
        {CoAdminAccess && (
          <>
            {/* Rating Enable */}
            <div className="relative">
              <div className="flex items-center justify-between px-4 py-3 border-2 border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl">
                <label className="text-base font-medium text-gray-700 dark:text-gray-300">
                  Rating Enable
                </label>
                <Switch isChecked={ratingEnable} onChange={() => setRatingEnable((current) => !current)}/>
              </div>
            </div>

            {/* Can Edit User */}
            <div className="relative">
              <div className="flex items-center justify-between px-4 py-3 border-2 border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl">
                <label className="text-base font-medium text-gray-700 dark:text-gray-300">
                  Can Edit User
                </label>
                <Switch isChecked={canEditUser} onChange={() => setCanEditUser((current) => !current)}/>
              </div>
            </div>

            {/* CRUD Forms - Only admins can assign this permission */}
            {isAdmin && (
            <div className="relative">
              <div className="flex items-center justify-between px-4 py-3 border-2 border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl">
                <label className="text-base font-medium text-gray-700 dark:text-gray-300">
                  CRUD Forms
                </label>
                <Switch isChecked={crudForms} onChange={() => setCrudForms((current) => !current)}/>
              </div>
            </div>
            )}

            {/* CRUD Programs - Only admins can assign this permission */}
            {isAdmin && (
            <div className="relative">
              <div className="flex items-center justify-between px-4 py-3 border-2 border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl">
                <label className="text-base font-medium text-gray-700 dark:text-gray-300">
                  CRUD Programs
                </label>
                <Switch isChecked={crudPrograms} onChange={() => setCrudPrograms((current) => !current)}/>
              </div>
            </div>
            )}

            {/* CRUD Institute - Only admins can assign this permission */}
            {isAdmin && (
            <div className="relative">
              <div className="flex items-center justify-between px-4 py-3 border-2 border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl">
                <label className="text-base font-medium text-gray-700 dark:text-gray-300">
                  CRUD Institute
                </label>
                <Switch isChecked={crudInstitute} onChange={() => setCrudInstitute((current) => !current)}/>
              </div>
            </div>
            )}
          </>
        )}

        {/* Submit */}
        <div className="flex justify-center mt-6 md:col-span-2">
          <button
            type="submit"
            className={`px-8 py-3 text-lg font-semibold text-white transition-all duration-300 transform shadow-lg bg-gradient-to-r ${loading ? 'from-gray-500 to-gray-600': ' from-green-500 to-green-600'} rounded-xl hover:shadow-xl hover:scale-105`}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2"/>
            {employeeID ? 'Update User' : 'Create User'}
            {loading && (
              <FontAwesomeIcon icon={faSpinner} className="ml-3 animate-spin"/>
            )}

          </button>
        </div>        
      </div>
    </form>
  </div>
</div>

{/* Edit User Form */}
<div className={`${visible === "edit" ? "block" : "hidden"} mb-8`}>
  <div className="p-8 bg-gray-100 border border-gray-200 shadow-xl dark:bg-gray-800 rounded-2xl dark:border-gray-700">
    <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">
      Edit User
    </h2>
    
    <form onSubmit={handleCreateUser} className="space-y-6">
      {/* Employee ID */}
            <div className="relative">
        <input 
          type="text" 
          required 
          name="employeeID" 
          id="employeeID"
          value={employeeID} 
          onChange={(e) => setEmployeeID(e.target.value)}
          className="w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
          placeholder=" "
        />
            <label 
          htmlFor="employeeID" 
          className="absolute text-gray-500 transition-all left-4 top-3 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-0 peer-valid:text-xs peer-valid:text-blue-500"
            >
          Employee ID
            </label>
          </div>

      {/* First Name */}
      <div className="relative">
        <input 
          type="text" 
          name="fName" 
          id="fName"
          value={fName} 
          onChange={(e) => setFName(e.target.value)}  
          className="w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
          placeholder=" "
        />
        <label 
          htmlFor="fName" 
          className="absolute text-gray-500 transition-all left-4 top-3 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-0 peer-valid:text-xs peer-valid:text-blue-500"
        >
          First Name
        </label>
        </div>

      {/* Last Name */}
      <div className="relative">
        <input 
          type="text" 
          name="lName" 
          id="lName"
          value={lName} 
          onChange={(e) => setLName(e.target.value)}  
          className="w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
          placeholder=" "
        />
        <label 
          htmlFor="lName" 
          className="absolute text-gray-500 transition-all left-4 top-3 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-0 peer-valid:text-xs peer-valid:text-blue-500"
        >
          Last Name
        </label>
      </div>

      {/* Suffix */}
      <div className="relative">
        <input 
          type="text" 
          name="suffix" 
          id="suffix"
          value={suffix} 
          onChange={(e) => setSuffix(e.target.value)}  
          className="w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
          placeholder=" "
        />
        <label 
          htmlFor="suffix" 
          className="absolute text-gray-500 transition-all left-4 top-3 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-0 peer-valid:text-xs peer-valid:text-blue-500"
        >
          Suffix (Optional)
        </label>
      </div>

      {/* Password */}
      <div className="relative">
        <input 
          type={hidePassword ? "password" : "text"}
          name="password" 
          id="password"
          value={password} 
          onChange={(e) => setPassword(e.target.value)}  
          className="w-full px-4 py-3 pr-12 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
          placeholder=" "
        />
        <label 
          htmlFor="password" 
          className="absolute text-gray-500 transition-all left-4 top-3 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-0 peer-valid:text-xs peer-valid:text-blue-500"
        >
          Password (Optional - leave blank to keep current password)
        </label>
        <button
            type="button"
            onClick={() => setHidePassword(!hidePassword)}
            className="absolute text-gray-500 -translate-y-1/2 right-4 top-1/2 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <FontAwesomeIcon icon={!hidePassword ? faEye : faEyeSlash} />
          </button>
      </div>

      {/* Email */}
      <div className="relative">
        <input 
          type="email" 
          name="email" 
          id="email"
          value={email} 
          onChange={(e) => setEmail(e.target.value)}  
          className="w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
          placeholder=" "
        />
        <label 
          htmlFor="email" 
          className="absolute text-gray-500 transition-all left-4 top-3 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-0 peer-valid:text-xs peer-valid:text-blue-500"
        >
          Email Address
        </label>
      </div>

      {/* Contact Number */}
      <div className="relative">
        <input 
          type="tel" 
          name="contactNum" 
          id="contactNum"
          value={contactNum} 
          maxLength={16}
          onChange={(e) => {
              let value = e.target.value;
              
              // Remove all non-digits
              let digitsOnly = value.replace(/\D/g, '');
              
              // Remove the country code (63) if it's at the start
              if (digitsOnly.startsWith('63')) {
                  digitsOnly = digitsOnly.slice(2);
              }
              
              // Limit to 10 digits (Philippine mobile number without country code)
              if (digitsOnly.length > 10) {
                  return;
              }
              
              
              // Auto-format: +63 XXX XXX XXXX
              let formatted = '';
              if (digitsOnly.length === 0) {
                  formatted = '';
              } else if (digitsOnly.length <= 3) {
                  formatted = '+63 ' + digitsOnly;
              } else if (digitsOnly.length <= 6) {
                  formatted = '+63 ' + digitsOnly.slice(0, 3) + ' ' + digitsOnly.slice(3);
              } else {
                  formatted = '+63 ' + digitsOnly.slice(0, 3) + ' ' + digitsOnly.slice(3, 6) + ' ' + digitsOnly.slice(6);
              }
              
              setContactNum(formatted);
              
              // Clear error while typing
              setContactNumError("");
          }}
          onBlur={(e) => {
              const value = e.target.value;
              if (value && value.length > 0) {
                  validateContactNum(value);
              }
          }}
          className="w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
          placeholder=" "
        />
        <label 
          htmlFor="contactNum" 
          className="absolute text-gray-500 transition-all left-4 top-3 dark:text-gray-400 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500 peer-valid:top-0 peer-valid:text-xs peer-valid:text-blue-500"
        >
          Contact Number
        </label>
        {contactNumError && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                {contactNumError}
            </p>
        )}
      </div>

      {/* Program Select */}
      <div className="relative">
                <Select 
              closeMenuOnScroll={false}
              closeMenuOnSelect={false}
              components={animatedComponents}
                isMulti
              value={selectedPrograms}
              onChange={setSelectedPrograms}
              options={programOption.map((program) => ({
                  value: program.programID,
                  label: program.programName
              }))}
              placeholder='Select Programs...'
              className='w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800'
              instanceId="edit-program-select"
          />
      </div>

      {/* Area Select */}
<<<<<<<<< Temporary merge branch 1
      <div className="relative">
=========
      <div className="relative cols-span-2">
>>>>>>>>> Temporary merge branch 2
        <Select 
                closeMenuOnScroll={false}
                closeMenuOnSelect={false}
          components={animatedComponents}
          isMulti
          value={selectedAreas} 
          onChange={setSelectedAreas}
          options={areaReferenceOptions || []}
          placeholder='Select Areas...'
          className="w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
          instanceId="edit-area-select"/>
      </div>

      {/* Additional Folder Access - Available for all users */}
      <div className="relative">
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Additional Folder Access
            </label>
            <Select
            isMulti
            closeMenuOnSelect={false}
            closeMenuOnScroll={false}
                    components={animatedComponents}
                    value={selectedFolder}
                    onChange={setSelectedFolder}
            options={folderOptions || []}
            placeholder='Select folders to give access...'
            noOptionsMessage={() => "No folders available"}
            className="w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none peer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
            instanceId="edit-folder-select"/>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Grant access to additional program folders beyond assigned programs
            </p>
        </div>

      {/* Co-Admin Access Switch - Only admins can assign this */}
      {isAdmin && (
        <div className="relative">
          <div className="flex items-center justify-between px-4 py-3 border-2 border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl">
            <label className="text-base font-medium text-gray-700 dark:text-gray-300">
              Co-Admin Access
            </label>
            <Switch isChecked={CoAdminAccess} onChange={() => setCoAdminAccess((current) => !current)}/>
          </div>
        </div>
      )}

      

      {/* Conditional Co-Admin Permissions - shown when Co-Admin is enabled */}
      {CoAdminAccess && (
        <>
          {/* Rating Enable */}
          <div className="relative">
            <div className="flex items-center justify-between px-4 py-3 border-2 border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl">
              <label className="text-base font-medium text-gray-700 dark:text-gray-300">
                Rating Enable
              </label>
              <Switch isChecked={ratingEnable} onChange={() => setRatingEnable((current) => !current)}/>
            </div>
          </div>

          {/* Can Edit User */}
          <div className="relative">
            <div className="flex items-center justify-between px-4 py-3 border-2 border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl">
              <label className="text-base font-medium text-gray-700 dark:text-gray-300">
                Can Edit User
              </label>
              <Switch isChecked={canEditUser} onChange={() => setCanEditUser((current) => !current)}/>
            </div>
          </div>

          {/* CRUD Forms - Only admins can assign this permission */}
          {isAdmin && (
            <div className="relative">
              <div className="flex items-center justify-between px-4 py-3 border-2 border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl">
                <label className="text-base font-medium text-gray-700 dark:text-gray-300">
                  CRUD Forms
                </label>
                <Switch isChecked={crudForms} onChange={() => setCrudForms((current) => !current)}/>
              </div>
            </div>
          )}

          {/* CRUD Programs - Only admins can assign this permission */}
          {isAdmin && (
            <div className="relative">
              <div className="flex items-center justify-between px-4 py-3 border-2 border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl">
                <label className="text-base font-medium text-gray-700 dark:text-gray-300">
                  CRUD Programs
                </label>
                <Switch isChecked={crudPrograms} onChange={() => setCrudPrograms((current) => !current)}/>
              </div>
            </div>
          )}

          {/* CRUD Institute - Only admins can assign this permission */}
          {isAdmin && (
            <div className="relative">
              <div className="flex items-center justify-between px-4 py-3 border-2 border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl">
                <label className="text-base font-medium text-gray-700 dark:text-gray-300">
                  CRUD Institute
                </label>
                <Switch isChecked={crudInstitute} onChange={() => setCrudInstitute((current) => !current)}/>
              </div>
            </div>
          )}
          </>
        )}

      {/* Submit Button */}
      <div className="flex justify-end">
          <button 
            type="submit"            
          className="px-8 py-3 text-white transition-all duration-300 bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
          Update User
          </button>
      </div>
    </form>
  </div>
</div>


           {/* Users List */}
            <div className={`${visible === "list" ? "block" : "hidden"}`}>
                {usersLoading ? (
                    // Show skeleton while loading
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <UserSkeleton />
                        <UserSkeleton />
                        <UserSkeleton />
                        <UserSkeleton />
                        <UserSkeleton />
                        <UserSkeleton />
                        <UserSkeleton />
                    </div>
                ) : submittedUsers.length === 0 ? (
                    // Show empty state when no users
                    <div className="flex flex-col items-center justify-center py-20 border border-gray-200 shadow-xl bg-neutral-100/90 dark:bg-gray-800 rounded-2xl dark:border-gray-700">
                        <FontAwesomeIcon icon={faUser} className="mb-4 text-gray-300 text-8xl dark:text-gray-600" />
                        <p className="text-2xl font-semibold text-gray-500 dark:text-gray-400">No users yet</p>
                        <p className="mt-2 text-gray-400 dark:text-gray-500">Add your first user to get started</p>
                    </div>
                ) : (
                    // Show actual users
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">                        
                        {submittedUsers.map((user, index) => (
                            <div 
                                key={index}  
                                onClick={() => detailsAndSelectedUser(user)} 
                                className="overflow-hidden transition-all duration-300 transform border border-gray-200 shadow-lg cursor-pointer bg-gray-100/90 dark:bg-gray-800 rounded-2xl hover:shadow-2xl hover:scale-105 dark:border-gray-700 group"
                            >
                                <div className="p-6 text-center">
                                    <div className="mb-4">
                                        {user.profilePicUrl ? 
                                            <img 
                                                src={user.profilePicUrl} 
                                                alt="Profile"                                                                     
                                                className='object-cover w-20 h-20 mx-auto transition-colors duration-300 border-gray-200 rounded-full shadow-lg border-3 dark:border-gray-600 group-hover:border-blue-400'
                                            /> : 
                                            <div className="flex items-center justify-center w-20 h-20 mx-auto transition-all duration-300 rounded-full shadow-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-600 dark:to-gray-700 group-hover:from-blue-200 group-hover:to-blue-300">
                                                <FontAwesomeIcon icon={faCircleUser} className="text-3xl text-blue-500 dark:text-gray-400" />
                                            </div>
                                        }
                                    </div>
                                    
                                    <h3 className="mb-1 text-lg font-bold text-gray-800 transition-colors duration-300 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                        {user.name}
                                    </h3>
                                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                                        {user.programName}
                                    </p>
                                    <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-500">
                                        <FontAwesomeIcon icon={faBookOpen} className="mr-1" />
                                        {user.areaNum}
                                    </div>
                                </div>
                            </div>
                        ))}
                      

                        {showDetails && selectedUser && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                            <div className={`relative w-full max-w-4xl mx-4 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden ${showDetails ? "fade-in" : "fade-out"}`}>
                                
                                {/* Header with gradient background */}
                                <div className="relative px-8 py-12 bg-gradient-to-br from-emerald-400 to-emerald-800">
                                    {/* Action buttons */}
                                    <div className='absolute flex gap-3 top-6 right-6'>
                                        <button 
                                            className='p-3 px-4 text-white transition-all duration-300 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 hover:scale-110' 
                                            onClick={() => setRemoveConfirmation(true)}
                                        >
                                            <FontAwesomeIcon icon={faTrash} className="text-lg" />
                                        </button>
                                        <button 
                                            className='p-3 px-4 text-white transition-all duration-300 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 hover:scale-110' 
                                            onClick={exitShowDetails}
                                        >
                                            <FontAwesomeIcon icon={faTimes} className="text-lg" />
                                        </button>
                                    </div>

                                      {/* Profile section */}
                                    <div className="flex flex-col items-center text-center text-white">
                                        <div className="relative mb-6">
                                            {selectedUser.profilePicUrl ? 
                                                <div className="relative w-32 h-32 group">
                                                    <img 
                                                        src={selectedUser.profilePicUrl} 
                                                        alt="Profile"                                                   
                                                        className='object-cover w-full h-full border-4 border-white rounded-full shadow-xl'
                                                    /> 
                                                </div> : 
                                                <div className="flex items-center justify-center w-32 h-32 border-4 border-white rounded-full shadow-xl bg-white/20 backdrop-blur-sm">
                                                    <FontAwesomeIcon icon={faCircleUser} className="text-6xl text-white" />
                                                </div>
                                            }

                                        </div>
                                        
                                        {/* Role badge*/}
                                        <div className="mb-4 -translate-y-9 ">
                                            <span className={`px-4 py-1 rounded-full text-sm font-semibold ${
                                                selectedUser.isAdmin === true 
                                                    ? 'bg-yellow-400 text-yellow-900' 
                                                    : 'bg-green-400 text-green-900'
                                            }`}>
                                                {selectedUser.isAdmin === true ? "Admin" : "Program Chair"}
                                            </span>
                                        </div>
                                        
                                        <h1 className='mb-2 text-3xl font-bold'>
                                            {selectedUser.name}
                                        </h1>
                                        <p className='text-lg text-blue-100'> 
                                            Employee ID: {selectedUser.employeeID}
                                        </p>
                                    </div>
                                </div>

                                {/* Content section */}
                                <div className="p-8">
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        {/* Program Information */}
                                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                            <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
                                                <FontAwesomeIcon icon={faBuilding} className="mr-3 text-blue-500" />
                                                Program Information
                                            </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Program</p>
                                            <p className="font-medium text-gray-800 dark:text-gray-200">
                                                {selectedUser.programName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Area</p>
                                            <p className="font-medium text-gray-800 dark:text-gray-200">
                                                {selectedUser.areaName}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                    <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
                                        <FontAwesomeIcon icon={faEnvelope} className="mr-3 text-green-500" />
                                        Contact Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center">
                                            <FontAwesomeIcon icon={faEnvelope} className="w-4 mr-3 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                                <p className="text-gray-800 dark:text-gray-200">
                                                    {selectedUser.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <FontAwesomeIcon icon={faPhone} className="w-4 mr-3 text-gray-400" />
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                                                <p className="text-gray-800 dark:text-gray-200">
                                                    {selectedUser.contactNum}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                      
                        {removeConfirmation && (
                          <div className='absolute flex flex-col items-center justify-center p-4 border border-gray-200 shadow-lg bg-red-50 w-100 rounded-xl dark:bg-gray-700 dark:border-gray-600 fade-in'>
                              <div className='flex items-center justify-center mb-4 bg-red-200 rounded-full inset-shadow-sm w-18 h-18 inset-shadow-red-300'>
                                  <FontAwesomeIcon icon={faTriangleExclamation} className="m-auto text-4xl text-red-500"/>
                              </div>
                              
                              <h3 className='mb-2 text-xl font-bold text-gray-900 dark:text-white'>
                                  Delete User
                              </h3>
                              <span className='mb-6 text-center text-gray-600 break-words dark:text-gray-300'>
                                  Are you sure you want to delete this user? 
                                  This action cannot be undone.
                              </span>

                              <div className='flex gap-4'>
                                  <button 
                                      className='px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700' 
                                      onClick={handleDeleteUser}
                                  >
                                      Yes
                                  </button>
                                  <button 
                                      className='px-4 py-2 text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 dark:text-white dark:bg-gray-600 dark:hover:bg-gray-700' 
                                      onClick={() => setRemoveConfirmation(false)}
                                  >
                                      No
                                  </button>
                              </div>                                    
                          </div>
                      )}
                    </div>
                    )}                      
                  </div>
                  )}
                  
              </div>

              {/* Searched Users List */}
                    <div className={`${visible === "searchList" ? "block" : "hidden"}`}>
                        {filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 border border-gray-200 shadow-xl bg-neutral-100/90 dark:bg-gray-800 rounded-2xl dark:border-gray-700">
                                <FontAwesomeIcon icon={faUser} className="mb-4 text-gray-300 text-8xl dark:text-gray-600" />
                                <p className="text-2xl font-semibold text-gray-500 dark:text-gray-400">No users yet</p>
                                <p className="mt-2 text-gray-400 dark:text-gray-500">Add your first user to get started</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredUsers.map((user, index) => (
                                    <div 
                                        key={index}  
                                        onClick={() => detailsAndSelectedUser(user)} 
                                        className="overflow-hidden transition-all duration-300 transform bg-gray-100 border border-gray-200 shadow-lg cursor-pointer dark:bg-gray-800 rounded-2xl hover:shadow-2xl hover:scale-105 dark:border-gray-700 group"
                                    >
                                        <div className="p-6 text-center">
                                            <div className="mb-4">
                                    {user.profilePicUrl ? 
                                                    <img 
                                                        src={user.profilePicUrl} 
                                                        alt="Profile"                                                                     
                                                        className='object-cover w-20 h-20 mx-auto transition-colors duration-300 border-gray-200 rounded-full shadow-lg border-3 dark:border-gray-600 group-hover:border-blue-400'
                                                    /> : 
                                                    <div className="flex items-center justify-center w-20 h-20 mx-auto transition-all duration-300 rounded-full shadow-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-600 dark:to-gray-700 group-hover:from-blue-200 group-hover:to-blue-300">
                                                        <FontAwesomeIcon icon={faCircleUser} className="text-3xl text-blue-500 dark:text-gray-400" />
                                                    </div>
                                                }
                                            </div>
                                            
                                            <h3 className="mb-1 text-lg font-bold text-gray-800 transition-colors duration-300 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                {user.name}
                                            </h3>
                                            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                                                {user.programName}
                                            </p>
                                            <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-500">
                                                <FontAwesomeIcon icon={faBookOpen} className="mr-1" />
                                                {user.areaNum}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {showDetails && filteredUsers && selectedUser && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                    <div className={`relative w-full max-w-4xl mx-4 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden ${showDetails ? "fade-in" : "fade-out"}`}>
                                        
                                        {/* Header with gradient background */}
                                        <div className="relative px-8 py-12 bg-gradient-to-br from-emerald-400 to-emerald-800">
                                            {/* Action buttons */}
                                            <div className='absolute flex gap-3 top-6 right-6'>
                                                <button 
                                                    className='p-3 px-4 text-white transition-all duration-300 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 hover:scale-110' 
                                                    onClick={() => setRemoveConfirmation(true)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} className="text-lg" />
                                                </button>
                                                <button 
                                                    className='p-3 px-4 text-white transition-all duration-300 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 hover:scale-110' 
                                                    onClick={exitShowDetails}
                                                >
                                                    <FontAwesomeIcon icon={faTimes} className="text-lg" />
                                                </button>
                                            </div>

                                             {/* Profile section */}
                                            <div className="flex flex-col items-center text-center text-white">
                                                <div className="relative mb-6">
                                                    {selectedUser.profilePicUrl ? 
                                                        <div className="relative w-32 h-32 group">
                                                            <img 
                                                                src={selectedUser.profilePicUrl} 
                                                                alt="Profile"                                                   
                                                                className='object-cover w-full h-full border-4 border-white rounded-full shadow-xl'
                                                            /> 
                                                        </div> : 
                                                        <div className="flex items-center justify-center w-32 h-32 border-4 border-white rounded-full shadow-xl bg-white/20 backdrop-blur-sm">
                                                            <FontAwesomeIcon icon={faCircleUser} className="text-6xl text-white" />
                                                        </div>
                                                    }

                                                </div>
                                                
                                                {/* Role badge*/}
                                                <div className="mb-4 -translate-y-9 ">
                                                    <span className={`px-4 py-1 rounded-full text-sm font-semibold ${
                                                        selectedUser.isAdmin === true 
                                                            ? 'bg-yellow-400 text-yellow-900' 
                                                            : 'bg-green-400 text-green-900'
                                                    }`}>
                                                        {selectedUser.isAdmin === true ? "Admin" : "Program Chair"}
                                                    </span>
                                                </div>
                                                
                                                <h1 className='mb-2 text-3xl font-bold'>
                                                    {selectedUser.name}
                                                </h1>
                                                <p className='text-lg text-blue-100'> 
                                                    Employee ID: {selectedUser.employeeID}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Content section */}
                                        <div className="p-8">
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                {/* Program Information */}
                                                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                                    <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
                                                        <FontAwesomeIcon icon={faBuilding} className="mr-3 text-blue-500" />
                                                        Program Information
                                                    </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Program</p>
                                                    <p className="font-medium text-gray-800 dark:text-gray-200">
                                                        {selectedUser.programName}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Area</p>
                                                    <p className="font-medium text-gray-800 dark:text-gray-200">
                                                        {selectedUser.areaName}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact Information */}
                                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                            <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
                                                <FontAwesomeIcon icon={faEnvelope} className="mr-3 text-green-500" />
                                                Contact Information
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center">
                                                    <FontAwesomeIcon icon={faEnvelope} className="w-4 mr-3 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                                        <p className="text-gray-800 dark:text-gray-200">
                                                            {selectedUser.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <FontAwesomeIcon icon={faPhone} className="w-4 mr-3 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                                                        <p className="text-gray-800 dark:text-gray-200">
                                                            {selectedUser.contactNum}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                              {removeConfirmation && (
                                          <div className='absolute flex flex-col items-center justify-center p-4 border border-gray-200 shadow-lg bg-red-50 w-100 rounded-xl dark:bg-gray-700 dark:border-gray-600 fade-in'>
                                              <div className='flex items-center justify-center mb-4 bg-red-200 rounded-full inset-shadow-sm w-18 h-18 inset-shadow-red-300'>
                                                  <FontAwesomeIcon icon={faTriangleExclamation} className="m-auto text-4xl text-red-500"/>
                                              </div>
                                              
                                              <h3 className='mb-2 text-xl font-bold text-gray-900 dark:text-white'>
                                                  Delete User
                                              </h3>
                                              <span className='mb-6 text-center text-gray-600 break-words dark:text-gray-300'>
                                                  Are you sure you want to delete this user? 
                                                  This action cannot be undone.
                                              </span>

                                              <div className='flex gap-4'>
                                                  <button 
                                                      className='px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700' 
                                                      onClick={handleDeleteUser}
                                                  >
                                                      Yes
                                                  </button>
                                                  <button 
                                                      className='px-4 py-2 text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 dark:text-white dark:bg-gray-600 dark:hover:bg-gray-700' 
                                                      onClick={() => setRemoveConfirmation(false)}
                                                  >
                                                      No
                                                  </button>
                                              </div>                                    
                                          </div>
                                      )}
                          </div>
                      )}
                      



                  </div>
                  )}
              </div>
      </div>
  );
};

export default Users;