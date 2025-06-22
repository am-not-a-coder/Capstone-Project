import avatar1 from '../assets/avatar1.png'
import { useState } from 'react'

const Profile = () => {

 const [user, setUser] = useState(
    {
        employeeID: '12-34-567',
        fullName: 'John Doe',
        password: '123456789',
        email: 'johndoe123@gmail.com',
        department: 'Bachelor of Science in Information Technology (BSIT)',
        area: 'Area I: Governance and Administration'
    },
 )


const [form, setForm] = useState({
        employeeID: '',
        fullName: '',
        password: '',
        email: '',
        department: '',
        area: ''
})

    const handleChange = (e) => {
        setForm({...form, [e.target.name] : e.target.value})
    }
    
    const handleSubmit = (e) => {
        e.preventDefault()
        setUser({
            ...user,
            ...form
            })
    }

   
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
                <img src={avatar1} 
                alt="profile pic" 
                className='p-1 border-2 border-black rounded-full shadow-sm bg-neutral-200 w-25 h-25 dark:border-zuccini-700 dark:shadow-sm dark:shadow-zuccini-800'
                />
                <h1 className='text-2xl font-semibold'>{user.fullName}</h1>
                <h1 className='italic text-md'>{user.email}</h1>
                <h1 className='font-semibold text-md'>{user.employeeID}</h1>
            </div>

            <div className='flex flex-col items-center justify-center dark:text-white'>
                <h1 className='text-2xl font-semibold'>Area Assigned:</h1>
                <h1 className=''>{user.area}</h1>
            </div>

        </div>
            <div className='p-5 mb-5 border shadow-xl border-neutral-800 rounded-xl dark:bg-woodsmoke-950 dark:inset-shadow-zuccini-900 dark:inset-shadow-sm'>
                <h1 className='text-xl text-neutral-800 dark:text-white'>Professional Bio:</h1>
                <textarea 
                placeholder="e.g. :
 - Ph.D. in Educational Management, Universidad de Manila.
 - Associate Professor with over 10 years of teaching experience in higher education. 
 - Master's Degree in Information Technology
 - Currently teaching at the College of Education."
                className='w-full min-h-[250px] text-neutral-800 p-2 border rounded-lg shadow-lg resize-none border-neutral-800 placeholder-neutral-400 focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:text-white dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm'
            />
            </div>


        {/* edit profile */}
        <h1 className='mt-5 text-2xl text-neutral-800 dark:text-white'> Edit Profile</h1>
        <form action="#"
        id="edit-profile" 
        className="flex flex-col p-5 my-5 border text-neutral-800 dark:border-none dark:bg-woodsmoke-950 dark:text-white rounded-xl"
        >
            {/* values should be replaced with dynamic user data */}
            <label htmlFor="employeeID">Employee ID</label>
            <input type="text" 
            name='employeeID'
            value={form.employeeID}
            onChange={handleChange}
            required
            className="p-2 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none"
            />

             <label htmlFor="Department">Department</label>
            <select name="department" 
            id="department"
            value={form.department}
            onChange={handleChange}
            className='p-2 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none'
            required>
                <option value="">Select a Department</option>
                <option value="Bachelor of Science in Information Technology (BSIT)">BSIT</option>
                <option value="Bachelor of Science in Education (BSED)">BSED</option>
                <option value="Bachelor of Science in Criminology (BSCrim)">BSCrim</option>
            </select>

            <label htmlFor="area">Area Assigned</label>
            <select name="area" 
            id="area"
            onChange={handleChange}
            value={form.area}
            className='p-2 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none'
                required>
                <option value="">Select an Area</option>
                <option value="Area I: Governance and Administration">Area I</option>
                <option value="Area II: Faculty">Area II</option>
                <option value="Area III: ">Area III</option>
            </select>
        
        
        
            <label htmlFor="name">Full Name</label>
            <input type="text" 
            name='fullName'
            value={form.fullName}
            onChange={handleChange}
            required
            className="p-2 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none"
            />

            <label htmlFor="password">Password</label>
            <input type="password" 
            name='password'
            value={form.password}
            onChange={handleChange}
            required
            className="p-2 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none"
            />

            <label htmlFor="email">Email</label>
            <input type="text" 
            name='email'
            value={form.email}
            onChange={handleChange}
            required
            className="p-2 font-semibold transition-all duration-500 cursor-pointer bg-neutral-300 border-1 rounded-xl focus:outline focus:outline-zuccini-700 focus:border-zuccini-900 dark:bg-[#19181A] dark:inset-shadow-zuccini-900 dark:inset-shadow-sm dark:border-none"
           />
        
        <input type="reset" 
        value="Cancel" 
        className='p-2 cursor-pointer bg-neutral-600 rounded-xl '
        required
    />
        <input type="submit" 
        value="Save Changes" 
        className='p-2 cursor-pointer bg-zuccini-600 rounded-xl' 
        onClick={handleSubmit}
        required
    />
           
        </form>
    </div>
    )

    }


export default Profile;