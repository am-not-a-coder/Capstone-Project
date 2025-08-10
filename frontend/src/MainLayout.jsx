import { useState, useEffect} from 'react';
import { useLocation, Outlet, useNavigate } from 'react-router-dom';

//Importing Components
import './App.css'
import Sidebar, { SidebarLinks } from './components/Sidebar';
import Switch from './components/Switch';
import Header from './components/Header';
import logOut from './assets/log_out.svg';
//Importing  Icons
import{
  faLayerGroup, 
    faSchool, 
    faGraduationCap, 
    faUsers, 
    faCircleCheck, 
    faFileAlt, 
    faMoon,
    faIdCardClip,
    faArrowRightFromBracket
} from '@fortawesome/free-solid-svg-icons';

const MainLayout = () => {
  //sets the active pages' path in the link
  const location = useLocation();
  const activePage = location.pathname.replace('/','') || 'Dashboard';

  //toggles Dark Mode
  const [darkMode, setDarkMode] = useState(() =>{
    return localStorage.getItem('darkMode') ===  "true"; 
  });
  useEffect( () => {
    if(darkMode){
      document.documentElement.classList.add('dark');
    }else{
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  //Log out logic
  const [showLogout, setShowLogout] = useState(false);
  const [logout, setLogout] = useState()
  const navigate = useNavigate()
 //shows the logout confirmation
  const loginCancel = () =>{
    setLogout(false)
    setShowLogout(false)
  }

  useEffect(() => {
    if (logout){
      localStorage.removeItem('token') // removes the token from the local storage
      navigate('/login')
    }
  }, [logout])

  return(
    <>
    <div className="grid grid-cols-[auto_1fr] grid-rows-[100px_1fr] h-screen w-screen bg-neutral-200 relative dark:bg-woodsmoke-950">
          <Sidebar>      
                <SidebarLinks
                  icon={faLayerGroup}
                  text="Dashboard"
                  active={activePage === 'Dashboard'}
                  onClick={() => (window.location.hash = '#/Dashboard')}
                />
                <SidebarLinks
                  icon={faSchool}
                  text="Institutes"
                  active={activePage === 'Institutes'}
                  onClick={() => (window.location.hash = '#/Institutes')}
                />
                <SidebarLinks
                  icon={faGraduationCap}
                  text="Programs"
                  active={activePage === 'Programs'}
                  onClick={() => (window.location.hash = '#/Programs')}
                />
                <SidebarLinks
                  icon={faIdCardClip}
                  text="Accreditation"
                  active={activePage === 'Accreditation'}
                  onClick={() => (window.location.hash = '#/Accreditation')}
                />
                <SidebarLinks
                  icon={faUsers}
                  text="Users"
                  active={activePage === 'Users'}
                  onClick={() => (window.location.hash = '#/Users')}
                />
                <SidebarLinks
                  icon={faCircleCheck}
                  text="Tasks"
                  active={activePage === 'Tasks'}
                  onClick={() => (window.location.hash = '#/Tasks')}
                />
                <SidebarLinks
                  icon={faFileAlt}
                  text="Documents"
                  active={activePage === 'Documents'}
                  onClick={() => (window.location.hash = '#/Documents')}
                />

              <hr className="w-full my-3 border-x border-neutral-400 dark:border-neutral-800" />

              {/* Dark Mode and Log out */}
              <SidebarLinks icon={faMoon} text="Dark Mode" isButton> 
                <Switch isChecked={darkMode} onChange={() => {setDarkMode ((current) => !current)}}/>
              </SidebarLinks> 
              <SidebarLinks icon={faArrowRightFromBracket} onClick={() => {setShowLogout(true)}} text="Log Out" isButton/>                
          </Sidebar>
            
          
          
          {/* Main Content */}

          <main id="main-scroll" className="flex-1 h-full col-span-4 col-start-2 row-span-5 row-start-1 p-4 overflow-y-auto">
            <Header title={activePage} />
            <Outlet />
          </main>
         
      </div>
      
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 bg-neutral-900/50">
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-xl border-2 border-neutral-700 transition-all duration-500 dark:inset-shadow-sm dark:inset-shadow-zuccini-900 dark:border-none dark:bg-[#19181A] min-h-[55%] min-w-[50%]">
            <h1 className='mb-5 text-4xl font-semibold text-zuccini-500'>Logout</h1>
            <img src={logOut} alt="Log out illustration" 
              className='h-40 mb-2'
            />
            <h1 className="mb-10 text-2xl font-semibold text-center text-black text-shadow-sm dark:text-white">
              Are you sure you want to Log Out?
            </h1>
            <div className="flex justify-center space-x-[50px]">
              <button onClick={() => setLogout(true)} className="shadow-xl px-4 py-2 transition-all duration-300 text-white cursor-pointer w-[150px] rounded-2xl bg-zuccini-600 hover:bg-zuccini-700">Log out</button>
              <button onClick={loginCancel} className="shadow-xl transition-all duration-300 px-4 py-3 w-[150px] text-white cursor-pointer rounded-2xl bg-zuccini-600 hover:bg-zuccini-700">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

export default MainLayout;