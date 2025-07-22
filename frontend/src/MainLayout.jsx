import { useState, useEffect} from 'react';
import { useLocation, Outlet, useNavigate } from 'react-router-dom';

//Importing Components
import './App.css'
import Sidebar, { SidebarLinks } from './components/Sidebar';
import Switch from './components/Switch';
import Header from './components/Header';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-30">
          <div className="p-6 bg-white rounded-lg shadow-lg dark:bg-woodsmoke-900 w-96">
            <h1 className="mb-4 text-xl font-semibold text-center text-black dark:text-white">
              Are you sure you want to Log Out?
            </h1>
            <div className="flex justify-center space-x-4">
              <button onClick={() => setLogout(true)} className="px-4 py-2 text-white rounded bg-zuccini-600 hover:bg-zuccini-700">Yes</button>
              <button onClick={loginCancel} className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 ">No</button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

export default MainLayout;