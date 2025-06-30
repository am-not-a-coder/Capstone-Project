import { useState, useEffect} from 'react';
import { useLocation, Outlet } from 'react-router-dom';

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


  return(
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
              <SidebarLinks icon={faArrowRightFromBracket} text="Log Out" isButton/>
          </Sidebar>
          
          {/* Main Content */}

          <main id="main-scroll" className="flex-1 h-full col-span-4 col-start-2 row-span-5 row-start-1 p-4 overflow-y-auto">
            <Header title={activePage} />
            <Outlet />
          </main>
         
      </div>
    
  )
}

export default MainLayout;