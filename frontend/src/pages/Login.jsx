import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
import OtpInput from '../components/otpInput';


const Login = () => {

    const navigate = useNavigate()

    const [employeeID, setEmployeeID] = useState('');
    const [error, setError] = useState(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState();
    const [loading, setLoading] = useState(false);
    const EMP_ID_REGEX = /^\d{2}-\d{2}-\d{3}$/
    //otp
    const [showOtpModal, setShowOtpModal] = useState(false)
    const [otpCode, setOtpCode] = useState('')
    const [otpError, setOtpError] = useState(null)
    const [otpLoading, setOtpLoading] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0);
    const cooldownSeconds = 30;

    useEffect(() => {
        if (showOtpModal) setTimeout(() => document.getElementById('otp-0')?.focus(), 0);

        if (!showOtpModal) return;
        setResendCooldown(cooldownSeconds);
        const id = setInterval(() => {
          setResendCooldown((s) => {
            if (s <= 1) {
              clearInterval(id);
              return 0;
            }
            return s - 1;
          });
        }, 1000);
        if (!showOtpModal) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            }
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => {
            clearInterval(id);
            window.removeEventListener('keydown', onKeyDown, true);
        }
    }, [showOtpModal]);

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
        if (!EMP_ID_REGEX.test(employeeID)) {
            setError('Employee ID must be in the format 12-34-567')
            setLoading(false)
            toast.dismiss(toastId)
            return
        }
        
        

        try {
            
            // This automatically handles headers, error formatting, etc.
            const response = await apiPost('/api/login', {
                employeeID: employeeID.trim(),
                password: password.trim()
            });
            const ch = new BroadcastChannel('auth')

            if (response.success && response.data.success) {
                if (response.success && response.data.message === 'OTP email sent succesfully') {
                    //show otp
                    setShowOtpModal(true);
                    setOtpCode('');
                    setOtpError(null);
                    toast.dismiss(toastId);
                    toast.success('OTP sent to your email');
                    setLoading(false);
                    ch.close()
                    return;
                }
                const payload = { type: 'login', ts: Date.now()}
                ch.postMessage(payload)
                // Clear any previous errors
                setError(null)
                await cacheUserAfterLogin()
                // Navigate to dashboard after successful login
                toast.dismiss(toastId)
                toast.success('Logged in successfully');
                ch.close()
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
    
    

    const handleOtpSubmit = async () => {
        const otp = (otpCode || '').trim();
        if (otp.length !== 6) {
          setOtpError('Please enter all 6 digits');
          return;
        }
        setOtpLoading(true);
        setOtpError('');
        try {
          const response = await apiPost('/api/verify-otp', {
            employeeID: employeeID.trim(),
            otp
          });
          if (response.success && response.data?.success) {
            setShowOtpModal(false);
            toast.success('OTP verified. Logging you in...');
            await cacheUserAfterLogin();
            navigate('/Dashboard', { replace: true });
          } else {
            setOtpError(response.error || response.data?.message || 'Invalid OTP');
          }
        } catch {
          setOtpError('Server error. Please try again.');
        } finally {
          setOtpLoading(false);
        }
      };
    
    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        try {
            setOtpError('');
            const res = await apiPost('/api/login', {
            employeeID: employeeID.trim(),
            password: password.trim()
            });
            if (res.success && res.data?.success && res.data?.message?.includes('OTP')) {
            toast.success('New OTP sent to your email');
            setOtpCode('');
            setResendCooldown(cooldownSeconds);
            } else {
            setOtpError(res.data?.message || 'Could not resend OTP');
            }
        } catch {
            setOtpError('Network error. Try again.');
        }
    };


    const formatEmployeeId = (raw) => {
        const digits = raw.replace(/\D/g, '').slice(0, 7)        // up to 7 digits
        const p1 = digits.slice(0, 2)
        const p2 = digits.slice(2, 4)
        const p3 = digits.slice(4, 7)
        if (digits.length <= 2) return p1
        if (digits.length <= 4) return `${p1}-${p2}`
        return `${p1}-${p2}-${p3}`
      }
      
      const handleEmployeeIdChange = (e) => {
        setEmployeeID(formatEmployeeId(e.target.value))
      }

    return(
        
    <>
    {/* container w/ gradient-background */}
            {/* toaster */}
            <Toaster />
    
            <div className={`flex flex-row h-screen w-full lg:w-screen overflow-hidden bg-linear-to-br from-[#4c7a57] to-[#0e3844] relative`}>

            {/* Left-Side Container*/}
            <div className=" flex-col items-center justify-center w-3/4 h-screen hidden lg:flex" >
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
                 
                        <div className='relative mb-4 w-[90%]'>
                            <label htmlFor='employeeID' className='block text-sm font-medium text-gray-700'>Employee ID</label>
                            <FontAwesomeIcon icon={faUser} className='absolute top-9.5 left-2 text-sm lg:text-md text-gray-400' />
                            <div className='absolute top-8.5 left-8 h-6 border-l border-gray-400'></div>
                            <input
                                type="text"
                                name="employeeID"
                                value={employeeID}
                                onChange={handleEmployeeIdChange}
                                inputMode="numeric"
                                maxLength={10}
                                placeholder="12-34-567"
                                pattern="\d{2}-\d{2}-\d{3}"
                                required
                                className={`relative w-full px-10 py-2 mt-1 border border-gray-300 rounded-md shadow-sm ${error ? 'border-red-600' : ''} focus:outline-none focus:ring-zuccini-900 focus:border-zuccini-900`}
                            />
                        </div>

                        <div className='relative mb-6 w-[90%]'>
                            <label htmlFor='password' className='block text-sm font-medium text-gray-700'>Password</label>
                            <FontAwesomeIcon icon={faKey} className='absolute top-9.5 left-2 text-md text-gray-400' />
                            <div className='absolute top-8.5 left-8 h-6 border-l border-gray-400'></div>  
                            <input type={showPassword ? "text" : "password"} 
                            name='password' 
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`relative w-full px-10 py-2 mt-1 border border-gray-300 rounded-md shadow-sm ${error ? 'border-red-600' : ''} focus:outline-none focus:ring-zuccini-900 focus:border-zuccini-900`}/>
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
        {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center text-black">
            <div className="absolute inset-0 bg-black/50" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} />
            <div className="relative bg-white dark:bg-gray-700 shadow-2xl rounded-3xl w-full max-w-md overflow-hidden transform transition-transform duration-200"
         onClick={(e) => e.stopPropagation()}>
            <div className="p-8 text-center">
                <div className="mx-auto mb-6 w-40 h-40">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" className="w-full h-full">
                    <circle cx="200" cy="200" r="150" fill="#3B82F6" />
                    <circle cx="200" cy="200" r="120" fill="#FFFFFF" />
                    <circle cx="200" cy="200" r="90" fill="#3B82F6" />
                    <circle cx="200" cy="200" r="60" fill="#FFFFFF" />
                    <text x="200" y="200" textAnchor="middle" fill="#2563EB" fontSize="40" fontWeight="bold" dy=".3em">OTP</text>
                </svg>
                </div>

                <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Verify OTP</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                Enter the 6-digit code sent to your email
                </p>

                <OtpInput value={otpCode} onChange={setOtpCode} />

                {otpError && <div className="text-red-500 text-sm mt-4">{otpError}</div>}

                <div className="text-sm text-gray-600 dark:text-gray-300 my-6">
                Didn’t receive code?{' '}
                <button
                type="button"
                onClick={handleResendOtp}
                className={`text-blue-600 hover:underline dark:text-blue-400 ${resendCooldown ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={otpLoading || resendCooldown > 0}
                >
                {resendCooldown ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
                </div>

                <button
                type="button"
                onClick={handleOtpSubmit}
                disabled={otpLoading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60"
                >
                {otpLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
            </div>
            </div>
        </div>
        )}
    </>
    )
}

export default Login;