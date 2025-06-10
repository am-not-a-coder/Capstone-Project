import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Outlet } from 'react-router-dom';

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
  const [activePage, setActivePage] = useState('Dashboard');

  return(
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
              <SidebarLinks icon={faMoon} text="Dark Mode" isButton> 
                <Switch />
              </SidebarLinks> 
              <SidebarLinks icon={faArrowRightFromBracket} text="Log Out" isButton/>
          </Sidebar>
          
          {/* Main Content */}

          <main className="flex-1 p-4 h-full  col-span-4 row-span-5 col-start-2 row-start-1 overflow-y-auto">
            <Header title={activePage} />
            <Outlet />
          </main>
         
      </div>
    
  )
}

export default MainLayout;