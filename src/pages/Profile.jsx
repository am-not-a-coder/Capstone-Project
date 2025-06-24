import avatar1 from '../assets/avatar1.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPhone,
    faEnvelope,
    faCircleUser,
    faEye,
    faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { useState, useRef } from 'react';




const Profile = () => {

const fileInputRef = useRef(null) //Upload photo reference

//Auto-resizing textarea in the Experience div
const textAreaRef = useRef(null); //Upload textarea reference

const handleTextAreaChange = (e) => {
  setForm({ ...form, experience: e.target.value });

  const ta = textAreaRef.current; // Auto-resize width
  if (ta) {
    ta.style.height = 'auto'; // Reset width
    ta.style.height = ta.scrollHeight + 'px';
  }
};

//Upload Photo
const [profilePic, setProfilePic] = useState(null) //useState for setting profile pic
const handleProfileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['.webp', '.png', '.jpeg', '.jpg'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (allowedTypes.includes(fileExtension)) {
        // Create a URL for the selected file
        const fileUrl = URL.createObjectURL(file);
        handleChange({
          target: {
            name: 'profile',
            value: fileUrl
          }
        });
        setProfilePic(fileUrl);
      } else {
        alert('Please select a valid image file (.webp, .png, .jpeg, .jpg)');
        e.target.value = '';
      }
    }
  };



//default user info
 const [user, setUser] = useState(
    {
        profile: avatar1,
        firstName: 'John',
        lastName: 'Doe',
        suffix: '',
        employeeID: '12-34-567',
        password: '123456789',
        email: 'johndoe123@gmail.com',
        contactNum: '09123456789',
        department: 'Bachelor of Science in Information Technology (BSIT)',
        area: 'Area I: Governance and Administration',
        experience: " - Ph.D. in Educational Management, Universidad de Manila. \n - Associate Professor with over 10 years of teaching experience in higher education. \n - Master's Degree in Information Technology \n - Currently teaching at the College of Education.",
    },
 )


const [form, setForm] = useState({
        profile: '',
        firstName: '',
        lastName: '',
        suffix: '',
        password: '',
        email: '',
        contactNum: '',
        experience: '',
})

    const handleChange = (e) => {
        setForm({...form, [e.target.name] : e.target.value})
    }
    
    const handleSubmit = (e) => {
        e.preventDefault();
        setUser({
            ...user,
            ...form
            })

    }

   //Password

   const [password, setPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
   const [message, setMessage] = useState('');
   const [progress, setProgress] = useState('0%');

   const [hidePassword, setHidePassword] = useState(true); // hides the Password input
   const [hideConfirmPassword, setHideConfirmPassword] = useState(true); // hides the Confirm Password input

    //handles the changes in the password
    const handlePassword = (passValue) =>{
        const filter = {
        length: 0,
        hasUpperCases: false,
        hasLowerCases: false,
        hasDigit: false,
        hasSpecialChar: false
    };
        //update the filter based on the password value

        filter.length = passValue.length >= 8 ? true : false;
        filter.hasUpperCases = /[A-Z]+/.test(passValue);
        filter.hasLowerCases = /[a-z]+/.test(passValue);
        filter.hasDigit = /\d+/.test(passValue);
        filter.hasSpecialChar = /[@.#$!%^&*.?]+/.test(passValue);
    
        // Calculate failed and passed checks
        const totalChecks = 5;
        const failedChecks = Object.values(filter).filter((value) => !value).length;
        const passedChecks = totalChecks - failedChecks;

        //Determine the password strength based on the filters

        let strength =
            failedChecks === 0 ? 'Strong':
            failedChecks <= 2 ? 'Good' : 'Weak';    
            
        
        setPassword(passValue)
        setProgress(`${(passedChecks / totalChecks) * 100}% `)
        setMessage(strength)

    }

   //sets the color depending on the message
   const getActiveColor = (type) =>{
    if(type === 'Strong') return '#3FBB60' //sets the color to Green
    if(type === 'Good') return '#FE804D' //sets the color to orange
    return '#CB2023' //sets the color to red
   }


   //Confirms that the passwords match
    const [passwordError, setPasswordError] = useState('');

    
   
    return(
    <div className='w-full p-5 border-2 border-neutral-800 rounded-2xl dark:border-none dark:bg-[#19181A] dark:inset-shadow-sm dark:inset-shadow-zuccini-900'>
        {/* View Profile */}
        <h1 className='text-2xl text-neutral-800 dark:text-white'>View Profile</h1>
        <div className="grid grid-cols-3 gap-3 px-3 my-5 border shadow-xl text-neutral-800 rounded-2xl dark:bg-woodsmoke-950 dark:inset-shadow-zuccini-900 dark:inset-shadow-sm">
            <div className='flex flex-col items-center justify-center dark:text-white'>
                <h1 className='text-2xl font-semibold'>Department:</h1>
                <h1 className='text-center text-md'>{user.department}</h1>
            </div>
            
            <div className='relative flex flex-col items-center justify-center -translate-y-10 dark:text-white'>
                <img src={user.profile} 
                alt="profile pic" 
                className='p-1 border-2 border-black rounded-full shadow-sm bg-neutral-200 w-25 h-25 dark:border-zuccini-700 dark:shadow-sm dark:shadow-zuccini-800'
                />
                <h1 className='text-2xl font-semibold'>{user.firstName + ' ' + user.lastName + ' ' + user.suffix}</h1>
                <h1 className='text-lg font-semibold'>{user.employeeID}</h1>
                <h1 className='text-xs font-medium'>Employee ID</h1>
            </div>

            <div className='flex flex-col items-center justify-center dark:text-white'>
                <h1 className='text-2xl font-semibold'>Area Assigned:</h1>
                <h1 className=''>{user.area}</h1>
            </div>

        </div>
            <div className='p-5 mb-5 border shadow-xl border-neutral-800 rounded-xl dark:bg-woodsmoke-950 dark:inset-shadow-zuccini-900 dark:inset-shadow-sm'>
                <h1 className='mb-2 text-xl text-neutral-800 dark:text-white'>Contacts:</h1>
                <div className='grid grid-cols-2 gap-5'>
                    <div className='mb-5 text-neutral-800 p-5 border border-neutral-800 rounded-lg shadow-lg focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:text-white dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm'>
                        <h1 className='mb-3 text-xl font-semibold text-neutral-800 dark:text-white'>Email</h1>
                        <FontAwesomeIcon 
                            icon={faEnvelope} 
                            className='mr-3 text-xl text-zuccini-700'
                        />
                        <h1 className='inline ml-2 text-xl italic font-light text-neutral-800 dark:text-white'>{user.email}</h1>
                    </div>

                    <div className='mb-5 text-neutral-800 p-5 border border-neutral-800 rounded-lg shadow-lg focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:text-white dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm'>
                        <h1 className='mb-3 text-xl font-semibold text-neutral-800 dark:text-white'>Contact Number</h1>
                        <FontAwesomeIcon 
                            icon={faPhone} 
                            className='mr-3 text-xl text-zuccini-700'
                        />
                        <h1 className='inline text-xl italic font-light text-neutral-800 dark:text-white'>{user.contactNum}</h1>
                    </div>
                </div>

                <h1 className='mb-2 text-xl text-neutral-800 dark:text-white'>Experiences:</h1>
                <div className='whitespace-pre-line w-full text-lg font-medium min-h-[150px] text-neutral-800 p-5 border rounded-lg shadow-lg resize-none border-neutral-800 placeholder-neutral-400 focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:text-white dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm'>
                    {user.experience}
                </div>
            </div>

        {/* edit profile */}
        <h1 className='mt-5 text-2xl text-neutral-800 dark:text-white'> Edit Profile</h1>
        <form action="#"
            id="edit-profile" 
            onSubmit={handleSubmit}
            onReset={() => {form}}
            className="p-5 my-5 border text-neutral-800 dark:border-none dark:bg-woodsmoke-950 dark:text-white rounded-xl dark:inset-shadow-zuccini-900 dark:inset-shadow-sm"
        >
            {/* upload photo */}
            <div className='flex flex-col items-center justify-center col-span-2 mb-5'>{profilePic ? 
                <img src={form.profile} alt="user profile pic"
                    className='mb-3 border-2 rounded-full w-25 h-25'/>
                : <FontAwesomeIcon icon={faCircleUser} className="mb-3 border-2 rounded-full text-7xl dark:text-neutral-600" /> 
                }
                
                <input type='button'
                    onClick={() => {fileInputRef.current && !fileInputRef.current.click()} }
                    className='p-3 px-5 font-semibold text-white cursor-pointer rounded-2xl bg-zuccini-700 hover:bg-zuccini-600'
                    value='Upload Photo' 
                />

                <p className="mt-1 text-xs text-gray-500">Accepted formats: .webp, .png, .jpeg, .jpg</p>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    name='profile' 
                    onChange={handleProfileChange}
                    className='hidden'
                />
            </div>

            {/* Full Name */}
            <div className='grid grid-cols-3 mb-5'>
                <div className="flex flex-col mr-5">
                    <label htmlFor="firstName">First Name</label>
                    <input type="text" 
                        name='firstName'
                        placeholder={user.firstName}
                        onChange={handleChange}
                        required
                        className=" py-3 p-2 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none"
                    />
                </div>
                <div className="flex flex-col mr-5">
                    <label htmlFor="lastName">Last Name</label>
                    <input type="text" 
                        name='lastName'
                        placeholder={user.lastName}
                        onChange={handleChange}
                        required
                        className="py-3 p-2 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none"
                    />
                </div>
                <div className="flex flex-col">
                    <label htmlFor="suffix">Suffix</label>
                    <input type="text" 
                        name='suffix'
                        placeholder= "e.g. Jr, II, III "
                        onChange={handleChange}
                        className="py-3 p-2 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none"
                    />
                </div>
            </div>
            
            {/* Contacts */}
            {/* Email */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className='flex flex-col'>
                    <label htmlFor="email">Email</label>
                    <input type="text" 
                    name='email'
                    placeholder={user.email}
                    onChange={handleChange}
                    required
                    className="py-3 p-2 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none"
                />
                </div>
                <div className='flex flex-col'>
                    <label htmlFor="contactNum">Contact No.</label>
                    <input type="text" 
                    name='contactNum'
                    placeholder={user.contactNum}
                    onChange={handleChange}
                    required
                    className="py-3 p-2 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none"
                />
                </div>
            </div>
            {/* experience */}
            <div className='flex flex-col mb-5'>
            <label htmlFor="experience">Experience</label>
            <textarea name="experience" 
            id="experience"
            ref={textAreaRef}
            onChange={e => {handleChange(e), handleTextAreaChange(e)}}
            placeholder={`e.g., 
                - Ph.D. in Educational Management, Universidad de Manila.
                - Associate Professor with over 10 years of teaching experience in higher education.
                - Master's Degree in Information Technology
                - Currently teaching at the College of Education.`}
            className='scrollbar-hide placeholder-neutral-500 whitespace-pre-line resize-y min-h-[200px] px-4 py-3 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none'       
            />
            </div>

            {/* Password */}
            <div className="flex flex-col items-start p-5 mb-5 border rounded-xl dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none">
                <h1 className='mb-5 text-xl'>Change Password</h1>
                
                <div className='relative flex items-center w-full gap-5 mb-5'>
                        {/* password input */}
                    
                        <label htmlFor="password" className='inline'>New Password</label>
                    <div className='relative'>
                        <input type={hidePassword ? 'password' : 'text'} 
                            name='password'
                            placeholder='Enter New Password'
                            onChange={(e) => {setPassword(e.target.value), handlePassword(e.target.value), handleChange(e)}}
                            required
                            className="relative min-w-[300px] ml-15 p-2 py-3 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-woodsmoke-950 dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none"
                        />
                        
                        {/* show password */}
                            <FontAwesomeIcon icon={hidePassword ? faEye : faEyeSlash} 
                                onClick={() => {setHidePassword((current) => !current)}}
                                className='absolute cursor-pointer top-4.5 right-3 text-neutral-600'
                            />
                    </div>    
                    
                    <div className='w-[25%]'>               
                        {/* progress bar*/}
                        <div className='h-5 transition-all duration-500 rounded-2xl'
                            style={
                                { width: progress, background: getActiveColor(message)}
                            }
                        />
                    
                        {/* Displays the password strength when a password is entered */}
                            {password.length != 0 ? (
                                <p className='text-sm transition-all duration-500' style={{color: getActiveColor(message)}}> Your password is {message}</p>
                            ) : null}

                        
                    </div>     
                </div>

                <div className='relative flex items-center w-full'>
                    <label htmlFor="password">Confirm New Password</label>
                    <div className='relative'>
                        <input type={hideConfirmPassword ? 'password' : 'text'}
                            placeholder='Confirm New Password'
                            onChange={e => {
                                setConfirmPassword(e.target.value)
                                setPasswordError(e.target.value && e.target.value !== password ? "Passwords do not match" : "");
                            }}
                            required
                            className="min-w-[300px] p-2 py-3 ml-5  font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-woodsmoke-950 dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none"
                        />
                        
                        <FontAwesomeIcon icon={hideConfirmPassword ? faEye : faEyeSlash} 
                            onClick={() => {setHideConfirmPassword((current) => !current)}}
                                className='absolute cursor-pointer top-4.5 right-3 text-neutral-600'
                        /> 
                    </div> 
                    
                    {passwordError && (
                        <p className="ml-5 text-sm text-[#CB2023]">{passwordError}</p>
                    )}
                </div>
                    
            </div>

        {/* Buttons */}
        <div className='flex items-center justify-end gap-5'>
                {/* Cancel button */}
                <input type="reset"     
                    value="Cancel" 
                    className='px-10 py-3 font-semibold transition-all duration-500 shadow-lg cursor-pointer bg-neutral-400 rounded-xl hover:text-white hover:bg-neutral-500'
            />
                {/* submit button */}
                <input type="submit" 
                    value="Save Changes" 
                    className='px-5 py-3 font-semibold text-white transition-all duration-500 shadow-lg cursor-pointer bg-zuccini-700 rounded-xl hover:bg-zuccini-600' 
            />
        </div>
        </form>
    </div>
    )

    }


export default Profile;