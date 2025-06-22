// import no profile icon from fontawesome
import{
    faCircleUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

const Users = () => {
    const [visible, makeVisible] = useState("list");  // state to control which section is visible
    const [employeeId, setEmployeeId] = useState("");  // state for employee ID input
    const [name, setName] = useState("");  // state for name input
    const [department, setDepartment] = useState("");  // state for department input
    const [password, setPassword] = useState("");  // state for password input
    const [email, setEmail] = useState("");  // state for email input
    const [profilePic, setProfilePic] = useState(null); // state for profile picture
    const [submittedUsers, setSubmittedUsers] = useState([]); 
    const [showDetails, setShowDetails] = useState(false); // state for showing user details
    const [removeUser, setRemoveUser] = useState(false); // state for removing user
    const [selectedUser, setSelectedUser] = useState([]); // state for selected user
    const [removeConfirmation, setRemoveConfirmation] = useState(false); // state for showing remove button
    const [searchQuery, setSearchQuery] = useState(""); // state for search query

    if (removeUser) {
        setSubmittedUsers(submittedUsers.filter(user => user !== selectedUser)); // remove selected user from submitted users
        setSelectedUser(null);
        setRemoveUser(false);
        setShowDetails(false);
    }

    // function to show user details and set selected user
    const detailsAndSelectedUser = (user) => {
        setSelectedUser(user); // set selected user
        setShowDetails(true); // show user details
    }

    const handleSubmit = (e) => {
        e.preventDefault(); // prevent default form submission
        const newUser = { employeeId, name, department, password, email, profilePic }; // create new user object
        setSubmittedUsers(prev => [...prev, newUser]);  // add new user to submitted users
        setEmployeeId(""); // reset employee ID input
        setName(""); // reset name input
        setDepartment(""); // reset department input
        setPassword(""); // reset password input
        setEmail(""); // reset email input
        setProfilePic(null); // reset profile picture
    }

    function exitShowDetails() {
        setRemoveConfirmation(false); 
        setShowDetails(false); 
    }

    function removeAndClose() {
        setRemoveUser(true); // set remove user to true
        setRemoveConfirmation(false); // hide remove confirmation
        exitShowDetails(); // exit show details
    }

    const handleQuery = (e) => {
        makeVisible("searchList"); // switch to list view
        setSearchQuery(e.target.value); // update search query state
    };

    // Filter users based on search query (case-insensitive, matches name or email)
    const filteredUsers = submittedUsers.filter(
        user =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            {/* navigation bar */}
            <section className="flex items-center h-[7%] gap-7 text-xl bg-neutral-200 text-neutral-800">
                <button className={`${visible == "list" ? 'border-b-2 font-semibold' : 'border-0 font-normal'} w-1/10 h-full`} onClick={() => makeVisible("list")}>List</button>
                <button className={`${visible == "add" ? 'border-b-2 font-semibold' : 'border-0 font-normal'} w-1/10 h-full`} onClick={() => makeVisible("add")}>Add</button>
                <input type="text" className='rounded-lg right-[2%] w-1/4 bg-neutral-300 p-1 text-base absolute border border-gray-400' onChange={handleQuery} value={searchQuery} placeholder='Search user' />
            </section>
            
            {/* section for adding users */}
            <section  className={`${visible == "add" ? "block" : "hidden"} overflow-y-auto box-border h-[75%] mt-4 p-5 text-neutral-800 border border-neutral-400 rounded-3xl shadow-xl`}>
                <form onSubmit={handleSubmit} action="" method='POST' className='flex gap-8 p-5 w-full flex-wrap flex-row '>
                    {/* detais form */}
                    <div className=' flex flex-col gap-6  w-1/4'>
                        <div className='relative'>
                            <input type="text" value={employeeId} required onChange={(e) => setEmployeeId(e.target.value)} name='employeeId' className='w-full peer border border-gray-400 p-1 bg-gray-300 rounded-lg text-neutral-800'/>
                            <label  className="absolute transition-all duration-200 left-1 top-0 peer-focus:top-[-1.5rem] peer-valid:top-[-1.5rem] peer-focus:text-sm peer-valid:text-sm text-neutral-600 text-lg " style={{paddingInline: "0.25rem"}}>Employee ID</label>
                        </div>

                        <div className='relative'>
                            <input type="text" value={name} required onChange={(e) => setName(e.target.value)} name='name' className='w-full peer border border-gray-400 p-1 bg-gray-300 rounded-lg text-neutral-800'/>
                            <label  className="absolute transition-all duration-200 left-1 top-0 peer-focus:top-[-1.5rem] peer-valid:top-[-1.5rem] peer-focus:text-sm peer-valid:text-sm text-neutral-600 text-lg " style={{paddingInline: "0.25rem"}}>Name</label>
                        </div>

                        <div className='relative'>
                            <input type="password" value={password} required onChange={(e) => setPassword(e.target.value)} name='password' className='w-full peer border border-gray-400 rounded-lg p-1 bg-gray-300 text-neutral-800'/>
                            <label  className="absolute transition-all duration-200 left-1 top-0 peer-focus:top-[-1.5rem] peer-valid:top-[-1.5rem] peer-focus:text-sm peer-valid:text-sm text-neutral-600 text-lg" style={{paddingInline: "0.25rem"}}>Password</label>
                        </div>

                        <div className='relative'>
                            <input type="email" required placeholder='' name='email' value={email} onChange={(e) => setEmail(e.target.value)}  className='w-full peer border border-gray-400 rounded-lg p-1 bg-gray-300 text-neutral-800'/>
                            <label  className="absolute transition-all duration-200 left-1 top-0 peer-focus:top-[-1.5rem] peer-focus:text-sm text-neutral-600 text-lg peer-not-placeholder-shown:top-[-1.5rem] peer-not-placeholder-shown:text-sm" style={{paddingInline: "0.25rem"}}>Email</label>
                        </div>

                        <div className='relative'>
                            <select name="department" id="department"  value={department} onChange={(e) => setDepartment(e.target.value)} className='w-full peer rounded-lg p-1 border border-gray-400 bg-gray-300 text-neutral-800'>
                                <option value="" disabled hidden>Select department</option>
                                <option value="BSIT">Information Technology</option>
                                <option value="Criminology">Criminology</option>
                                <option value="Accounting">Accounting</option>
                                <option value="Nursing">Nursing</option>
                            </select>
                        </div>

                        <input type="submit" className='bg-gray-300 p-1 active:bg-gray-400 active:text-neutral-100 border border-gray-400 rounded-lg w-1/3 cursor-pointer place-self-center'/>
                    </div>

                    {/* upload profile */}
                    <div className='flex flex-col gap-4 items-start  w-1/3'>
                        {profilePic ? 
                            <div className="w-[70%] h-[70%] place-self-center object-cover rounded-full relative" >
                                <img src={profilePic} alt="Profile" className='rounded-full w-full h-full' />
                                <button onClick={()=> setProfilePic(null)} className='cursor-pointer w-1/10 h-1/10 bg-gray-300 rounded-full text-sm absolute right-0 top-0'>X</button>
                            </div>
                            : <FontAwesomeIcon icon={faCircleUser} className="place-self-center text-[14rem] text-gray-800 m-2" /> 
                        }
                        <label htmlFor="fileInput" className="place-self-center text-sm cursor-pointer bg-gray-300 text-gray-800 px-4 py-1 rounded border border-gray-400 ">Choose File</label>
                        <input type="file" id='fileInput' name='profilePic' hidden onChange={(e)=> {
                            const file = e.target.files[0];
                            if (file) {
                                const imageUrl = URL.createObjectURL(file);
                                setProfilePic(imageUrl); // set profile picture state to the image URL
                            }
                        }}/>
                        
                    </div>
                </form>
            </section>

            {/* section for the list of users */}
            <section  className={`${visible == "list" ? "block" : "hidden"} overflow-y-auto box-border  h-[75%] mt-4 p-5 text-neutral-800 border border-neutral-400 rounded-3xl shadow-xl`}>
                {/* adding users in the list */}
                <div className={`${visible == "list" ? "block" : "hidden"} gap-6 flex flex-row flex-wrap`}>
                    {submittedUsers.length === 0 ? (
                        <p className="flex justify-center items-center text-gray-500 w-[73%] rounded-2xl h-1/4 bg-gray-300 text-3xl absolute">No users yet.</p> 
                    ) : 
                    
                    (submittedUsers.map((user, index) => (
                        
                        <div key={index}  onClick={()=> detailsAndSelectedUser(user)} className=" cursor-pointer flex flex-row w-[23%] bg-neutral-300 p-1 rounded-lg min-w-[200px]">
                            {user.profilePic ? 
                                <img src={user.profilePic} alt="" className='place-self-center m-2 w-[21%] h-[80%] object-cover rounded-full'/> : <FontAwesomeIcon icon={faCircleUser} className=" place-self-center text-5xl text-gray-800 m-2" />
                            }
                            
                            <div className='flex flex-col justify-center items-center w-full '>
                                
                                <p  className="text-lg p-2 text-neutral-800" style={{fontSize: user.name.length >= 13 ? '0.8rem' : '1rem'}}>{user.name}</p>
                                <p className="text-sm">{user.department}</p>
                            </div>
                        </div>
                    )))}
                </div>
            </section>

            {/* showing details of a user */}
            <section>
                { showDetails && selectedUser && (
                    submittedUsers.map((user, index) => (
                        // show the details of the clicked card
                        <div className=" absolute w-1/3 h-[80%] left-[45%] bottom-[10%] bg-gray-300 text-neutral-800 rounded-2xl p-5 flex flex-col justify-center items-center gap-3 border border-gray-400 shadow-xl" key={index}>
                            <button onClick={()=> exitShowDetails()}  className={` rounded-2xl top-0 right-0 absolute w-[11%] h-[8%] bg-gray-400`}>exit</button>
                            {selectedUser.profilePic ? 
                                <img src={selectedUser.profilePic} alt="" className='place-self-center w-[31%] h-[25%] object-cover rounded-full'/> : <FontAwesomeIcon icon={faCircleUser} className=" text-9xl text-gray-800"/>
                            }
                            <form action="" onSubmit={handleSubmit} method='POST' className=' gap-4 flex flex-col gap w-full'>
                                <p className='ml-10'>Employee ID: <span>
                                    <input type="text" value={selectedUser.employeeId} name='employeeId' className='border border-gray-400 p-1 rounded font-semibold ml-2' />
                                </span></p>
                                <p className='ml-10'>Name: <span>
                                    <input type="text" value={selectedUser.name} name='name' className='border border-gray-400 p-1 rounded font-semibold ml-14'/>
                                </span></p>
                                <p className='ml-10'>Password: <span>
                                    <input type="text" value={selectedUser.password} className='font-semibold ml-8 border border-gray-400 p-1 rounded' />
                                </span></p>
                                <p className='ml-10'>Department: <span>
                                    <input type="text" value={selectedUser.department} className='font-semibold ml-3 border border-gray-400 p-1 rounded' />

                                    {/* <select  className='w-6/10 font-semibold ml-3 border border-gray-400 p-1 rounded ' >
                                        <option value={selectedUser.department} selected></option>
                                        <option value="BSIT">Information Technology</option>
                                        <option value="Criminology">Criminology</option>
                                        <option value="Accounting">Accounting</option>
                                        <option value="Nursing">Nursing</option>
                                    </select> */}
                                </span></p>
                                <p className='ml-10'>Email: <span>
                                    <input type="email" value={selectedUser.email} className='font-semibold ml-15 border border-gray-400 p-1 rounded' />
                                </span></p>
                            </form><br />

                            {/* save changes and remove buttons */}
                            <div className='flex gap-4 w-full justify-center items-center'>
                                <button className='w-2/10 bg-gray-300 p-2 active:bg-gray-500 active:text-neutral-100 border border-gray-400 shadow rounded-xl'>Save</button>
                                <button className='w-2/10 bg-gray-300 p-2 active:bg-gray-500 active:text-neutral-100 border border-gray-400 shadow rounded-xl' onClick={()=> setRemoveConfirmation(true)}>Remove</button>
                            </div>

                            { removeConfirmation && (
                                <div className="absolute rounded-2xl g-5 w-[80%] h-1/5 place-self-center top-105 bg-gray-300  flex justify-center items-center flex-col">
                                        <p className="text-neutral-700">Are you sure you want to remove this user?</p><br />
                                        <div className='flex gap-4 w-full justify-center items-center'>
                                        <button className='bg-gray-400 w-1/5 p-2 text-neutral-800 border border-gray-500 rounded-xl' onClick={()=> removeAndClose()}>Yes</button>
                                        <button className='bg-gray-400 w-1/5 p-2 text-neutral-800 border border-gray-500 rounded-xl' onClick={()=> setRemoveConfirmation(false)}>No</button>
                                        </div>
                                </div>
                            )}
                        
                        </div>
                    ))
                )}
            </section>

            {/* section for showing users from search bar */}
            <section className={`${visible == "searchList" ? "block" : "hidden"} overflow-y-auto box-border  h-[75%] mt-4 p-5 text-neutral-800 border border-neutral-400 rounded-3xl shadow-xl`}>
                <div className="flex flex-wrap gap-6">
                    {filteredUsers.length > 0 ? (
                        // map through filtered users and display them
                        filteredUsers.map((user, index) => (
                            // using users index in array as key
                            <div key={index}  onClick={()=> detailsAndSelectedUser(user)} className=" cursor-pointer flex flex-row w-[23%] bg-neutral-300 p-1 rounded-lg min-w-[200px]">
                                {user.profilePic ? 
                                    <img src={user.profilePic} alt="" className='place-self-center m-2 w-[21%] h-[80%] object-cover rounded-full'/> : <FontAwesomeIcon icon={faCircleUser} className=" place-self-center text-5xl text-gray-800 m-2" />
                                }
                                <div className='flex flex-col justify-center items-center w-full '> 
                                    {/* make name smaller when it is too long */}
                                    <p  className="text-lg p-2 text-neutral-800" style={{fontSize: user.name.length >= 13 ? '0.8rem' : '1rem'}}>{user.name}</p>
                                    <p className="text-sm">{user.department}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No users match your search.</p>
                    )}
                </div>
            </section>
       </>
    )
};

export default Users;
