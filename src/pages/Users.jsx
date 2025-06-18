// import no profile icon from fontawesome
import{
    faCircleUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';

const Users = () => {
    const [visible, makeVisible] = useState("list");  // state to control which section is visible
    const [name, setName] = useState(""); // state for name input
    const [department, setDepartment] = useState("");  // state for department input
    const [password, setPassword] = useState("");  // state for password input
    const [email, setEmail] = useState("");  // state for email input
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
        const newUser = { name, department, password, email }; // create new user object
        setSubmittedUsers(prev => [...prev, newUser]);  // add new user to submitted users
        setName(""); // reset name input
        setDepartment(""); // reset department input
        setPassword(""); // reset password input
        setEmail(""); // reset email input
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
            <section className="flex items-center h-[7%] gap-7 text-xl bg-neutral-200 text-neutral-800 border-neutral-900">
                <button className={`${visible == "list" ? 'border-b-2 font-semibold' : 'border-0 font-normal'} w-1/10 h-full`} onClick={() => makeVisible("list")}>List</button>
                <button className={`${visible == "add" ? 'border-b-2 font-semibold' : 'border-0 font-normal'} w-1/10 h-full`} onClick={() => makeVisible("add")}>Add</button>
                <input type="text" className='rounded-lg right-[2%] w-1/4 bg-neutral-300 p-1 text-base absolute' onChange={handleQuery} value={searchQuery} placeholder='Search user' />
            </section>
            
            {/* section for adding users */}
            <section  className={`${visible == "add" ? "block" : "hidden"} overflow-y-auto box-border h-[75%] mt-4 p-5 text-neutral-800 border-1 border-neutral-900 rounded-3xl shadow-xl`}>
                <form onSubmit={handleSubmit} action="" method='POST' className='flex gap-8 p-5 w-7/10 flex-wrap flex-col'>
                    <div className='relative'>
                        <input type="text" value={name} required onChange={(e) => setName(e.target.value)} name='name' className='peer p-1 bg-gray-300 rounded-lg text-neutral-800'/>
                        <label  className="absolute transition-all duration-200 left-1 top-0 peer-focus:top-[-1.5rem] peer-valid:top-[-1.5rem] peer-focus:text-sm peer-valid:text-sm text-neutral-600 text-lg " style={{paddingInline: "0.25rem"}}>Name</label>
                    </div>

                    <div className='relative'>
                        <input type="password" value={password} required onChange={(e) => setPassword(e.target.value)} name='password' className='peer rounded-lg p-1 bg-gray-300 text-neutral-800'/>
                        <label for='password' className="absolute transition-all duration-200 left-1 top-0 peer-focus:top-[-1.5rem] peer-valid:top-[-1.5rem] peer-focus:text-sm peer-valid:text-sm text-neutral-600 text-lg" style={{paddingInline: "0.25rem"}}>Password</label>
                    </div>

                    <div className='relative'>
                        <input type="email" required placeholder='' name='email' value={email} onChange={(e) => setEmail(e.target.value)}  className='peer rounded-lg p-1 bg-gray-300 text-neutral-800'/>
                        <label htmlFor='email' className="absolute transition-all duration-200 left-1 top-0 peer-focus:top-[-1.5rem] peer-focus:text-sm text-neutral-600 text-lg peer-not-placeholder-shown:top-[-1.5rem] peer-not-placeholder-shown:text-sm" style={{paddingInline: "0.25rem"}}>Email</label>
                    </div>

                    <div className='relative'>
                        <select name="department" id="department"  value={department} onChange={(e) => setDepartment(e.target.value)} className='peer rounded-lg p-1 bg-gray-300 text-neutral-800'>
                            <option value="" disabled hidden>Select department</option>
                            <option value="BSIT">Information Technology</option>
                            <option value="Criminology">Criminology</option>
                            <option value="Accounting">Accounting</option>
                            <option value="Nursing">Nursing</option>
                        </select>
                    </div>

                    <input type="submit" className='bg-gray-300 p-2 active:bg-gray-400 active:text-neutral-100 border-1 rounded-lg w-[20%] cursor-pointer ml-6'/>
                </form>
            </section>

            {/* section for the list of users */}
            <section  className={`${visible == "list" ? "block" : "hidden"} overflow-y-auto box-border  h-[75%] mt-4 p-5 text-neutral-800 border-1 border-neutral-900 rounded-3xl shadow-xl`}>
                {/* adding users in the list */}
                <div className={`${visible == "list" ? "block" : "hidden"} gap-6 flex flex-row flex-wrap`}>
                    {submittedUsers.length === 0 ? (
                        <p className="flex justify-center items-center text-gray-500 w-[73%] rounded-2xl h-1/4 bg-gray-300 text-3xl absolute">No users yet.</p> 
                    ) : 
                    
                    (submittedUsers.map((user, index) => (
                        
                        <div key={index}  onClick={()=> detailsAndSelectedUser(user)} className=" cursor-pointer flex flex-row w-[23%] bg-neutral-300 p-1 rounded-lg min-w-[200px]">
                            <FontAwesomeIcon icon={faCircleUser} className=" place-self-center text-5xl text-gray-800 m-2" />
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
                        <div className=" absolute w-1/3 h-[80%] left-[45%] bottom-[10%] bg-gray-300 text-neutral-800 rounded-2xl p-5 flex flex-col justify-center items-center gap-3">
                            <button onClick={()=> exitShowDetails()}  className={` rounded-2xl top-0 right-0 absolute w-[11%] h-[8%] bg-gray-400`}>exit</button>
                    
                            <FontAwesomeIcon icon={faCircleUser} className=" text-9xl text-gray-800" /><br /><br />
                            <p>Name: <span>{selectedUser.name}</span></p>
                            <p>Password: <span>{selectedUser.password}</span></p>
                            <p>Department: <span>{selectedUser.department}</span></p>
                            <p>Email: <span>{selectedUser.email}</span></p>
                            <br /><button className='bg-gray-400 p-2 active:bg-gray-500 active:text-neutral-100 border-1 rounded-xl' onClick={()=> setRemoveConfirmation(true)}>Remove</button>
                        
                            { removeConfirmation && (
                                <div className="absolute rounded-2xl g-5 w-[80%] h-1/5 place-self-center top-105 bg-gray-400 flex justify-center items-center flex-col">
                                        <p className="text-neutral-700">Are you sure you want to remove this user?</p><br />
                                        <div className='flex gap-4 w-full justify-center items-center'>
                                        <button className='bg-red-400 w-1/5 p-2 text-neutral-100 rounded-xl' onClick={()=> removeAndClose()}>Yes</button>
                                        <button className='bg-green-400 w-1/5 p-2 text-neutral-100 rounded-xl' onClick={()=> setRemoveConfirmation(false)}>No</button>
                                        </div>
                                </div>
                            )}
                        
                        </div>
                    ))
                )}
            </section>

            {/* section for showing users from search bar */}
            <section className={`${visible == "searchList" ? "block" : "hidden"} overflow-y-auto box-border  h-[75%] mt-4 p-5 text-neutral-800 border-1 border-neutral-900 rounded-3xl shadow-xl`}>
                <div className="flex flex-wrap gap-6">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user, index) => (
                            <div key={index}  onClick={()=> detailsAndSelectedUser(user)} className=" cursor-pointer flex flex-row w-[23%] bg-neutral-300 p-1 rounded-lg min-w-[200px]">
                                <FontAwesomeIcon icon={faCircleUser} className=" place-self-center text-5xl text-gray-800 m-2" />
                                <div className='flex flex-col justify-center items-center w-full '>
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