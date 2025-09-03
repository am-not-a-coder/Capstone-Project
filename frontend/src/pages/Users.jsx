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
} from '@fortawesome/free-solid-svg-icons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useEffect } from 'react';
import StatusModal from '../components/modals/StatusModal';

import { apiDelete, apiGet, apiPostForm } from '../utils/api_utils';

const Users = () => {
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


    if (removeUser) {
        setSubmittedUsers(submittedUsers.filter(user => user !== selectedUser)); 
        setSelectedUser(null);
        setRemoveUser(false);
        setShowDetails(false);
    }

    const detailsAndSelectedUser = (user) => {
        setSelectedUser(user); 
        setShowDetails(true); 
    }

    const previewURL = (file) => {
        return file ? URL.createObjectURL(file) : "";
    };

    const handleCreateUser = async (e) => {
        e.preventDefault(); 


        const formData = new FormData();
            formData.append("employeeID", employeeID);
            formData.append("password", password);
            formData.append("fName", fName);
            formData.append("lName", lName);
            formData.append("suffix", suffix);
            formData.append("email", email);
            formData.append("contactNum", contactNum);
             if(profilePic?.file) formData.append("profilePic", profilePic.file); 
            formData.append("programID", programID);
            formData.append("areaID", areaID)
            
        try{

            //Post request

        const res = await apiPostForm('/api/user', formData,
            {withCredentials: true});
          

            
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
                    profilePic: previewURL(profilePic?.file),
                    programID,
                    areaID,
                    programName: selectedProgramName,
                    areaNum: selectedAreaName
                    
                }]);
            
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
            
        } catch(err){
            console.log("Full error object:", err);
            console.log("Error response:", err.response);
            console.log("Error response data:", err.response?.data);
            console.log("Error response status:", err.response?.status);
            
            setStatusMessage("Server error. Please try again");
            setShowStatusModal(true);
            setStatusType("error");
            console.log(err.res?.data || err.message)
        }
    }

    useEffect(() => {
    const fetchUsers = async () => {
        try{                

            const res = await apiGet('/api/users');
            //checking the users before setting

            (Array.isArray(res.data.users)) ? setSubmittedUsers(res.data.users) : setSubmittedUsers([]); 
        } catch (err){
            console.error("Error occurred during user fetching", err);
        }
    };

    fetchUsers();

    }, [])

    useEffect(() => {
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

    }, [])

    useEffect(() => {
    const fetchArea = async () => {

        
       const res = await apiGet('/api/area', 
            {withCredentials: true}
       )

       try{
            Array.isArray(res.data.area) ? setAreaOption(res.data.area) : setAreaOption([]);
        } catch (err) {
            console.error("Error occurred during area fetching", err)
        }
    }
    fetchArea();
    }, [])

    function removeAndClose() {
        setRemoveUser(true); 
        setRemoveConfirmation(false); 
        exitShowDetails(); 
    }

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
            removeAndClose() 

        } catch(err){
            console.error(err.response?.data || err.message)
            setStatusMessage("Failed to delete user")
            setStatusMessage(true)
            setStatusType("error")
        }
    }

    function exitShowDetails() {
        setRemoveConfirmation(false); 
        setShowDetails(false); 
    }

    const handleQuery = (e) => {
        makeVisible("searchList"); 
        setSearchQuery(e.target.value); 
    };

    const filteredUsers = submittedUsers.filter(
        user =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                </div>

      <div className="relative">
        <FontAwesomeIcon 
          icon={faSearch} 
          className="absolute text-gray-400 transform -translate-y-1/2 left-4 top-1/2"
        />
        <input 
          type="text" 
          className='py-3 pl-12 pr-4 text-gray-800 placeholder-gray-400 transition-all duration-300 bg-white border border-gray-300 shadow-lg outline-none w-80 dark:bg-gray-800 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white dark:placeholder-gray-500' 
          onChange={handleQuery} 
          value={searchQuery} 
          placeholder='Search users...'
        />
      </div>
    </div>

    {/* Add User Form */}
    <div className={`${visible === "add" ? "block" : "hidden"} mb-8`}>
  <div className="p-8 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-2xl dark:border-gray-700">
    <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">Create New User</h2>
    
    <form onSubmit={handleCreateUser} className="flex flex-col gap-8 lg:flex-row">
      
      {/* Profile Picture Section */}
      <div className="flex flex-col items-center lg:w-1/3">
        <div className="mb-6">
          {profilePic ? (
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
            onChange={(e) => setEmployeeID(e.target.value)} 
            name="employeeID" 
            id="employeeID"
            className="peer w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
            placeholder=" "
          />
          <label 
            htmlFor="employeeID" 
            className="absolute left-4 top-3 text-gray-500 dark:text-gray-400 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500"
          >
            Employee ID
          </label>
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
            className="peer w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
            placeholder=" "
          />
          <label 
            htmlFor="fName" 
            className="absolute left-4 top-3 text-gray-500 dark:text-gray-400 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500"
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
            className="peer w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
            placeholder=" "
          />
          <label 
            htmlFor="lName" 
            className="absolute left-4 top-3 text-gray-500 dark:text-gray-400 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500"
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
            className="peer w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
            placeholder=" "
          />
          <label 
            htmlFor="suffix" 
            className="absolute left-4 top-3 text-gray-500 dark:text-gray-400 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500"
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
            className="peer w-full px-4 py-3 pr-10 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
            placeholder=" "
          />
          <label 
            htmlFor="password" 
            className="absolute left-4 top-3 text-gray-500 dark:text-gray-400 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500"
          >
            Password
          </label>
          <button
            type="button"
            onClick={() => setHidePassword(!hidePassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
            className="peer w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
            placeholder=" "
          />
          <label 
            htmlFor="email" 
            className="absolute left-4 top-3 text-gray-500 dark:text-gray-400 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500"
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
            onChange={(e) => setContactNum(e.target.value)}  
            className="peer w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
            placeholder=" "
          />
          <label 
            htmlFor="contactNum" 
            className="absolute left-4 top-3 text-gray-500 dark:text-gray-400 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-blue-500"
          >
            Contact Number
          </label>
        </div>

        {/* Program Select */}
        <div className="relative">
          <select 
            name="programID" 
            id="programID"
            value={programID}  
            required 
            onChange={(e) => setProgramID(e.target.value)} 
            className="peer w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
          >
            <option value="">Select Program</option>
            {programOption.map((program) => (
              <option key={program.programID} value={program.programID}>
                {program.programName}
              </option>
            ))}
          </select>
        </div>

        {/* Area Select */}
        <div className="relative">
          <select 
            name="areaID" 
            id="areaID"
            value={areaID} 
            required 
            onChange={(e) => setAreaID(e.target.value)} 
            className="peer w-full px-4 py-3 text-gray-800 transition-all duration-300 border-2 border-gray-200 outline-none bg-gray-50 dark:bg-gray-700 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 dark:text-white"
          >
            <option value="">Select Area</option>
            {areaOption.map((area) => (
              <option key={area.areaID} value={area.areaID}>
                {area.areaNum}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <div className="flex justify-center mt-6 md:col-span-2">
          <button 
            type="submit"
            className="px-8 py-3 text-lg font-semibold text-white transition-all duration-300 transform shadow-lg bg-gradient-to-r from-green-500 to-green-600 rounded-xl hover:shadow-xl hover:scale-105"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Create User
          </button>
        </div>
      </div>
    </form>
  </div>
</div>


    {/* Users List */}
    <div className={`${visible === "list" ? "block" : "hidden"}`}>
      {submittedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-gray-200 shadow-xl bg-neutral-100/90 dark:bg-gray-800 rounded-2xl dark:border-gray-700">
            <FontAwesomeIcon icon={faUser} className="mb-4 text-gray-300 text-8xl dark:text-gray-600" />
            <p className="text-2xl font-semibold text-gray-500 dark:text-gray-400">No users yet</p>
            <p className="mt-2 text-gray-400 dark:text-gray-500">Add your first user to get started</p>
        </div>
    ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {submittedUsers.map((user, index) => (
                <div 
                    key={index}  
                    onClick={() => detailsAndSelectedUser(user)} 
                    className="overflow-hidden transition-all duration-300 transform bg-white border border-gray-200 shadow-lg cursor-pointer dark:bg-gray-800 rounded-2xl hover:shadow-2xl hover:scale-105 dark:border-gray-700 group"
                >
                    <div className="p-6 text-center">
                        <div className="mb-4">
                            {user.profilePic ? 
                                <img 
                                    src={`http://localhost:5000${user.profilePic}`} 
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    
                    <div className={`relative flex w-full max-w-3xl gap-2 p-8 bg-gray-200 border border-gray-200 shadow-xl dark:bg-gray-800 dark:border-gray-700 rounded-2xl ${showDetails ? "fade-in" : "fade-out"}`}>
                        <div className='absolute flex gap-5 px-5 py-4 top-4 right-4'>
                        
                        <button className='text-lg' onClick={() => setRemoveConfirmation(true)}>
                            <FontAwesomeIcon 
                                icon={faTrash} 
                                className='text-gray-500 transition-colors duration-300 cursor-pointer hover:text-red-700 dark:text-gray-400 dark:hover:text-red-500' 
                                onClick={() => setRemoveConfirmation(true)} 
                            />
                        </button>

                        <button className='text-lg' onClick={exitShowDetails}>
                            <FontAwesomeIcon 
                                icon={faTimes} 
                                className='text-gray-500 transition-colors duration-300 cursor-pointer hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300' 
                                onClick={exitShowDetails} 
                            />
                        </button>
                        
                    </div>
                    
                    <div className="my-auto">
                        {selectedUser.profilePic ? 
                            <div className="relative w-40 h-40 mx-auto group">
                            <img 
                                src={`http://localhost:5000/${selectedUser.profilePic}`} 
                                alt="Profile" 
                                className='object-cover mx-auto transition-colors duration-300 border-blue-400 rounded-full shadow-lg border-3 dark:border-gray-600'
                            /> 
                            </div>: 
                            <div className="flex items-center justify-center w-40 h-40 mx-auto transition-all duration-300 rounded-full shadow-lg bg-gradient-to-br from-blue-200 to-blue-300">
                                <FontAwesomeIcon icon={faCircleUser} className="text-blue-500 text-7xl " />
                            </div>
                        }                                
                    </div>

                    <div className='flex flex-col w-full pl-5'>
                        <h1 className='mt-5 text-3xl font-bold text-gray-800 dark:text-gray-400'>
                            {selectedUser.name}
                        </h1>

                        <p className='text-gray-600 text-md dark:text-gray-500'> 
                            <span className='font-semibold'>Employee ID:</span> {selectedUser.employeeID}
                        </p>

                        <p className='mt-5 text-xl italic text-gray-600 text-md dark:text-gray-500'>
                            <FontAwesomeIcon icon={faBuilding} className='mr-3'/> {selectedUser.programName}
                        </p>

                        <p className='mt-5 text-xl italic text-gray-600 text-md dark:text-gray-500'>
                            <FontAwesomeIcon icon={faBookOpen} className='mr-3'/> {selectedUser.areaName}
                        </p>

                        <p className='mt-5 text-xl italic text-gray-600 text-md dark:text-gray-500'>
                            <FontAwesomeIcon icon={faEnvelope} className='mr-3'/> {selectedUser.email}
                        </p>

                        <p className='mt-5 text-xl italic text-gray-600 text-md dark:text-gray-500'>
                            <FontAwesomeIcon icon={faPhone} className='mr-3'/> {selectedUser.contactNum}
                        </p>
                        
                    </div>
                    
                </div>
                    {removeConfirmation && (
                        <div className='absolute flex flex-col items-center justify-center p-4 border border-gray-200 shadow-lg bg-red-50 w-100 rounded-xl dark:bg-gray-700 dark:border-gray-600 fade-in'>
                            <div className='flex items-center justify-center mb-4 bg-red-200 rounded-full inset-shadow-sm w-18 h-18 inset-shadow-red-300'>
                                <FontAwesomeIcon icon={faTriangleExclamation} className="m-auto text-4xl text-red-500"/>
                            </div>
                            
                            <p className='mb-4 text-lg font-semibold text-gray-800 dark:text-white'>
                                Are you sure you want to delete this user? 
                            </p>
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

}
           

export default Users;