import { Link } from 'react-router-dom';
import Carousel from '../components/Carousel';
import udmsLogo from '../assets/udms-logo.png';
import UDMLogo from '../assets/UDM-logo.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faKey,
    faUser
} from '@fortawesome/free-solid-svg-icons';


//SAMPLE LAYOUT OF LOGIN PAGE


const Login = () => {
    return(
    <>
    {/* container w/ gradient-background */}
    
            <div className={`flex flex-row h-screen w-screen bg-linear-to-br from-[#4c7a57] to-[#0e3844] relative`}>

            {/* Left-Side Container*/}
            <div className="flex flex-col justify-center items-center h-screen w-3/4" >
            {/* UDM logo */}
            <img src={UDMLogo} alt="Universidad de Manila Logo" className='absolute top-5 left-5 h-18'/>

            <Carousel />
            </div>


            {/* Login Form (right-side container)*/}
            <div className='bg-neutral-300 h-screen min-w-[350px] text-neutral-800 p-5'>
                 {/* logo */}

                <div className='flex flex-col justify-center items-center' >
                        <img src={udmsLogo} alt="UDMS Logo" className='mb-3 h-20 w-20 rounded-full shadow-xl' />
                        <h1 className='mb-2 w-2xs text-xl text-center font-semibold text-shadow-lg'>University Document Management System</h1>
                    </div>
                {/* form */}

                <form className='flex flex-1 flex-col  px-8 py-5 rounded-xl shadow-3xl  text-neutral-800'>
                
             
                    <h2 className='text-3xl text-neutral-800 font-bold mb-6 text-center'>Login</h2>
                    <div className='mb-4 relative'>
                        <label htmlFor='username' className='block text-sm font-medium text-gray-700'>Username</label>
                        <FontAwesomeIcon icon={faUser} className='absolute top-9.5 left-2 text-md text-gray-400' />
                        <div className='absolute top-8.5 left-8 h-6 border-l border-gray-400'></div>
                        <input type='text' id='username' placeholder="Username" className='mt-1 block w-full px-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-zuccini-900 focus:border-zuccini-900' />
                    </div>
                    <div className='mb-6 relative'>
                        <label htmlFor='password' className='block text-sm font-medium text-gray-700'>Password</label>
                        <FontAwesomeIcon icon={faKey} className='absolute top-9.5 left-2 text-md text-gray-400' />
                        <div className='absolute top-8.5 left-8 h-6 border-l border-gray-400'></div>
                        <input type='password' id='password' placeholder="Password" className='mt-1 block w-full px-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-zuccini-900 focus:border-zuccini-900' />
                    </div>

                    <a href='#' className='mb-2 text-blue-600 font-light'>Forgot your password?</a>

                    <Link to="/Dashboard">
                        <button type='submit' className='w-full bg-zuccini-700 text-white py-2 rounded-md hover:bg-zuccini-800 transition duration-200 cursor-pointer'>Login</button>
                    </Link>
                </form>
            </div>
        </div>
       
    </>
    )
}






export default Login;