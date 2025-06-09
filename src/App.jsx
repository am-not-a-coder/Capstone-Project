import {useState} from 'react';
// Pages
import Dashboard from './pages/Dashboard';
import Institutes from './pages/Institutes';
import Accreditation from './pages/Accreditation';
import Documents from './pages/Documents';
import Programs from './pages/Programs';
import Tasks from './pages/Tasks';
//Components
import './App.css'
import Sidebar, { SidebarLinks } from './components/Sidebar';
import Switch from './components/Switch';
import Header from './components/Header';
// Icons
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

function App() {

  const [activePage, setActivePage] = useState('Dashboard');

  return (
    <>
    <div className="grid grid-cols-[auto_1fr] grid-rows-[100px_1fr] h-screen w-screen bg-neutral-200 relative">
     <Sidebar>
        <SidebarLinks icon={faLayerGroup} text="Dashboard" active = {activePage === "Dashboard"} onClick={ () => setActivePage("Dashboard")} />
        <SidebarLinks icon={faSchool} text="Institutes"active={activePage === "Institutes"} onClick={() =>setActivePage("Institutes")} />
        <SidebarLinks icon={faGraduationCap} text="Programs" active={activePage === "Programs"} onClick={() =>setActivePage("Programs")}  />
        <SidebarLinks icon={faIdCardClip} text="Accreditation" active={activePage === "Accreditation"} onClick={() =>setActivePage("Accreditation")} />
        <SidebarLinks icon={faUsers} text="Users" active={activePage === "Users"} onClick={() =>setActivePage("Users")} />
        <SidebarLinks icon={faCircleCheck} text="Tasks" active={activePage === "Tasks"} onClick={() =>setActivePage("Tasks")} />
        <SidebarLinks icon={faFileAlt} text="Documents" active={activePage === "Documents"} onClick={() =>setActivePage("Documents")} />
        <hr className="my-3 border-t border-neutral-400 w-full " />
        {/* Dark Mode and Log out */}
        <SidebarLinks icon={faMoon} text="Dark Mode"> 
       <Switch />
        </SidebarLinks> 
        <SidebarLinks icon={faArrowRightFromBracket} text="Log Out" />
     </Sidebar>
     <Header title={activePage} />
      { activePage === "Dashboard" && <Dashboard />}
      { activePage === "Institutes" && <Institutes />}
      { activePage === "Programs" && <Programs />}
      { activePage === "Accreditation" && <Accreditation />}
      { activePage === "Tasks" && <Tasks />}
      { activePage === "Documents" && <Documents />}
    </div>
    </>
  )
}


export default App;
