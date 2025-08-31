import { useNavigate } from 'react-router-dom';
import { use, useEffect, useState } from 'react';
import Carousel from '../components/Carousel';
import { apiPost } from '../utils/api_utils';
import udmsLogo from '../assets/udms-logo.png';
import UDMLogo from '../assets/UDM-logo.png';
import toast , { Toaster } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faKey,
    faUser,
    faEye,
    faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { cacheUserAfterLogin } from '../utils/auth_utils';
import { logoutAcc } from '../utils/auth_utils';
import { initPresenceListeners, getSocket } from '../utils/websocket_utils'


const Login = () => {

    const navigate = useNavigate()

    const [employeeID, setEmployeeID] = useState('');
    const [error, setError] = useState(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState();
    const [loading, setLoading] = useState(false);


    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true)

        const toastId = toast.loading('Logging in...')
        
        // Client-side validation
        if (!employeeID.trim() || !password.trim()) {
            setError('Please enter a valid employee ID and password')
            setLoading(false)
            toast.dismiss(toastId)
            return;
        }
        
        

        try {
            
            // This automatically handles headers, error formatting, etc.
            const response = await apiPost('/api/login', {
                employeeID: employeeID.trim(),
                password: password.trim()
            });
            const ch = new BroadcastChannel('auth')

            if (response.success && response.data.success) {
                const payload = { type: 'login', ts: Date.now()}
                ch.postMessage(payload)
                
                // Store session ID from backend response
                if (response.data.user.sessionID) {
                    localStorage.setItem('session_id', response.data.user.sessionID)
                }
                
                // Clear any previous errors
                setError(null)
                await cacheUserAfterLogin()
                // Navigate to dashboard after successful login
                toast.dismiss(toastId)
                ch.close()

                //call websocket connection

                

                navigate('/Dashboard', {replace: true });
                
            } else { 
                // Display backend error message to user
                setError(response.error || response.data?.message || 'Login failed');
                toast.error('Login Failed')
                setLoading(false)
                toast.dismiss(toastId)
            }
            
            
        } catch (err) {
            // Handle unexpected errors (network issues, etc.)
            console.error('Login error:', err);
            setError('Server error. Please try again.');
            setLoading(false)
            toast.dismiss(toastId)
        }
    }

    return(
        
    <>
    {/* container w/ gradient-background */}
            {/* toaster */}
            <Toaster />
    
            <div className={`flex flex-row h-screen w-full lg:w-screen overflow-hidden bg-linear-to-br from-[#4c7a57] to-[#0e3844] relative`}>

            {/* Left-Side Container*/}
            <div className="flex flex-col items-center justify-center w-3/4 h-screen hidden lg:block" >
            {/* UDM logo */}
            <img src={UDMLogo} alt="Universidad de Manila Logo" className='absolute top-5 left-5 h-18'/>

            <Carousel />
            </div>


            {/* Login Form (right-side container)*/}
            <div className='bg-neutral-300 h-full lg:h-full w-screen text-neutral-800 p-4 mt-13 lg:mt-0'>
                 {/* logo */}

                <div className='flex flex-col items-center justify-center' >
                        <img src={udmsLogo} alt="UDMS Logo" className='h-20 mb-3 rounded-full shadow-xl' />
                        <h1 className=' text-xl font-semibold text-center lg:w-2xs text-shadow-lg'>University Document<br /> Management System</h1><br />
                    </div>
                {/* form */}

                <form onSubmit={handleLogin} className='flex flex-col flex-1 rounded-xl shadow-3xl text-neutral-800'>
                
             
                    <h2 className=' text-3xl font-bold text-center text-neutral-800'>Login</h2><br /><br />
                 
                        <div className='relative mb-4 w[90%]'>
                            <label htmlFor='employeeID' className='block text-sm font-medium text-gray-700'>Employee ID</label>
                            <FontAwesomeIcon icon={faUser} className='absolute top-9.5 left-2 text-sm lg:text-md text-gray-400' />
                            <div className='absolute top-8.5 left-8 h-6 border-l border-gray-400'></div>
                            <input type='text' 
                            name='employeeID' 
                            placeholder="Employee ID"
                            value={employeeID}
                            onChange={(e) => setEmployeeID(e.target.value)}
                            className={`relative w-full px-10 py-2 mt-1 border-gray-300 rounded-md shadow-sm focus:outline-none ${error ? 'border-red-600' : ''} focus:ring-zuccini-900 focus:border-zuccini-900`}/>
                        </div>

                        <div className='relative mb-6'>
                            <label htmlFor='password' className='block text-sm font-medium text-gray-700'>Password</label>
                            <FontAwesomeIcon icon={faKey} className='absolute top-9.5 left-2 text-md text-gray-400' />
                            <div className='absolute top-8.5 left-8 h-6 border-l border-gray-400'></div>  
                            <input type={showPassword ? "text" : "password"} 
                            name='password' 
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`relative w-full px-10 py-2 mt-1 border border-gray-300 rounded-md shadow-sm  ${error ? 'border-red-600' : ''} focus:outline-none focus:ring-zuccini-900 focus:border-zuccini-900`}/>
                            <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} 
                            onClick={() => {setShowPassword((current) => !current)}}
                            className='absolute cursor-pointer top-9 right-3 text-neutral-400'/>
                            {error && <span className='text-[11px] text-red-600'>{error}</span>}
                        </div><br />
                    
                    <a href='#' className='mb-2 font-light text-blue-600'>Forgot your password?</a>

                    
                        <button type='submit' className='w-full py-2 text-white transition duration-200 rounded-md cursor-pointer bg-zuccini-700 hover:bg-zuccini-800'>Login</button>
                    
                </form>
            </div>
        </div>
       
       

    </>
    )
}

export default Login;