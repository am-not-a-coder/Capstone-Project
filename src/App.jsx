import {useState} from 'react';
import './App.css'
import Sidebar, { SidebarLinks } from './Sidebar'
import Dashboard from './Dashboard';
import Header from './Header';
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

  const [activeLink, setActiveLink] = useState('Dashboard');

  return (
    <>
    <div className="grid grid-cols-[300px_1fr] grid-rows-[100px_1fr] h-screen w-screen bg-neutral-200 relative">
     <Sidebar>
        <SidebarLinks icon={faLayerGroup} link="#dashboard" text="Dashboard" active = {activeLink === "Dashboard"} onClick={ () => setActiveLink("Dashboard")} />
        <SidebarLinks icon={faSchool} link="#institutes" text="Institutes"active={activeLink === "Institutes"} onClick={() =>setActiveLink("Institutes")} />
        <SidebarLinks icon={faGraduationCap} link="#programs" text="Programs" active={activeLink === "Programs"} onClick={() =>setActiveLink("Programs")}  />
        <SidebarLinks icon={faIdCardClip} link="#accreditation" text="Accreditation" active={activeLink === "Accreditation"} onClick={() =>setActiveLink("Accreditation")} />
        <SidebarLinks icon={faUsers} link="#users" text="Users" active={activeLink === "Users"} onClick={() =>setActiveLink("Users")} />
        <SidebarLinks icon={faCircleCheck} link="#tasks" text="Tasks" active={activeLink === "Tasks"} onClick={() =>setActiveLink("Tasks")} />
        <SidebarLinks icon={faFileAlt} link="#documents" text="Documents" active={activeLink === "Documents"} onClick={() =>setActiveLink("Documents")} />
        <hr className="my-3 border-t border-neutral-400 w-full " />
        {/* Dark Mode and Log out */}
        <SidebarLinks icon={faMoon} text="Dark Mode" />
        <SidebarLinks icon={faArrowRightFromBracket} text="Log Out" />
     </Sidebar>
      <Header/>
      <Dashboard />
    </div>
    </>
  )
}


export default App;
