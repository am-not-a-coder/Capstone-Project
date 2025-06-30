import { Link } from 'react-router-dom';
import Carousel from '../components/Carousel';
import udmsLogo from '../assets/udms-logo.png';
import UDMLogo from '../assets/UDM-logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faKey,
    faUser
} from '@fortawesome/free-solid-svg-icons';


const Login = () => {
    return(
    <>
    {/* container w/ gradient-background */}
    
            <div className={`flex flex-row h-screen w-screen bg-linear-to-br from-[#4c7a57] to-[#0e3844] relative`}>

            {/* Left-Side Container*/}
            <div className="flex flex-col items-center justify-center w-3/4 h-screen" >
            {/* UDM logo */}
            <img src={UDMLogo} alt="Universidad de Manila Logo" className='absolute top-5 left-5 h-18'/>

            <Carousel />
            </div>


            {/* Login Form (right-side container)*/}
            <div className='bg-neutral-300 h-screen min-w-[350px] text-neutral-800 p-5'>
                 {/* logo */}

                <div className='flex flex-col items-center justify-center' >
                        <img src={udmsLogo} alt="UDMS Logo" className='w-20 h-20 mb-3 rounded-full shadow-xl' />
                        <h1 className='mb-2 text-xl font-semibold text-center w-2xs text-shadow-lg'>University Document Management System</h1>
                    </div>
                {/* form */}

                <form className='flex flex-col flex-1 px-8 py-5 rounded-xl shadow-3xl text-neutral-800'>
                
             
                    <h2 className='mb-6 text-3xl font-bold text-center text-neutral-800'>Login</h2>
                    <div className='relative mb-4'>
                        <label htmlFor='employeeID' className='block text-sm font-medium text-gray-700'>Employee ID</label>
                        <FontAwesomeIcon icon={faUser} className='absolute top-9.5 left-2 text-md text-gray-400' />
                        <div className='absolute top-8.5 left-8 h-6 border-l border-gray-400'></div>
                        <input type='text' id='employeeID' placeholder="Employee ID" className='block w-full px-10 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-zuccini-900 focus:border-zuccini-900' />
                    </div>
                    <div className='relative mb-6'>
                        <label htmlFor='password' className='block text-sm font-medium text-gray-700'>Password</label>
                        <FontAwesomeIcon icon={faKey} className='absolute top-9.5 left-2 text-md text-gray-400' />
                        <div className='absolute top-8.5 left-8 h-6 border-l border-gray-400'></div>
                        <input type='password' id='password' placeholder="Password" className='block w-full px-10 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-zuccini-900 focus:border-zuccini-900' />
                    </div>

                    <a href='#' className='mb-2 font-light text-blue-600'>Forgot your password?</a>

                    <Link to="/Dashboard">
                        <button type='submit' className='w-full py-2 text-white transition duration-200 rounded-md cursor-pointer bg-zuccini-700 hover:bg-zuccini-800'>Login</button>
                    </Link>
                </form>
            </div>
        </div>
       
    </>
    )
}






export default Login;