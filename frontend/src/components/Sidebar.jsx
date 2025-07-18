import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faAngleRight,
    faAngleLeft,
    faSearch,
    } 
from '@fortawesome/free-solid-svg-icons';
import udmsLogo from '../assets/udms-logo.png';
import { createContext, useState, useContext } from 'react';
import { Link } from 'react-router-dom';

const SidebarContext = createContext();
const Sidebar = ({children}) => {
const [expanded, setExpanded] = useState(true);


    // Sidebar component with state for expanded/collapsed
    return(
        <aside className={`row-span-5 h-screen mt-3 ml-3 transition-all duration-500 ${ expanded ? 'w-70' : 'w-12'} z-1`}>
            <nav className="relative flex flex-col bg-woodsmoke-200 border-1 border-black rounded-lg shadow-neutral-500 shadow-lg transition-all duration-500 dark:bg-[#19181A] dark:shadow-none dark:border-none">

            {/* Title and Logo */}
            <div className="flex items-center justify-between pt-3 pb-2 pl-2 pr-10 transition-all duration-500">
                <img src={udmsLogo} alt="UDMS Logo" className={`m-2 h-10 rounded-full w-10 transition-all duration-500 ${expanded ? 'opacity-100 w-10' : 'opacity-0 w-0'}`}/>
                <h4 className={`overflow-hidden transition-all m-1 line-clamp-2 font-semibold text-neutral-950 ${expanded ? 'w-42 opacity-100 ml-2' : 'w-0 opacity-0 ml-0'} dark:text-white transition-all duration-500`}>University Document Management System</h4>
                <button onClick={() => setExpanded(current => !current)} className="absolute p-2 px-4 transition-all duration-500 rounded-lg -right-3 bg-zuccini-900">
                    { expanded ? <FontAwesomeIcon icon={faAngleRight} /> : <FontAwesomeIcon icon={faAngleLeft} /> }
                </button>
            </div>
            

            {/* Search bar*/}
            <div className="relative px-1 py-2 ml-1 overflow-hidden">
                <FontAwesomeIcon icon={faSearch} className={`absolute text-zuccini-800 ml-3.5 mt-3.5 ${expanded ? '' : 'cursor-pointer'}`} />
                <input
                    type="text" 
                    placeholder="Search..." 
                    className={`min-w-65 p-2 pl-10 text-black placeholder-neutral-200 rounded-xl bg-woodsmoke-300 border border-gray-900 transition-colors duration-500 focus:outline-none focus:ring-2 focus:ring-zuccini-900 ${expanded ? '' : 'cursor-pointer'} dark:border-neutral-800 dark:bg-[#242424]`}
                />
            </div>

            {/* Nav Links */}
            <SidebarContext.Provider value={{expanded}}>
            <ul className={`flex flex-col flex-1 ml-1 mt-1 ${expanded ? 'items-end' : ''}`}>{children}</ul> 
            </SidebarContext.Provider>
            {/* SidebarLinks is are generated below */}

            </nav>
        </aside>
    );

};

export const SidebarLinks = ({children, icon, text, active, alert, onClick, isButton}) => {
  const {expanded} = useContext(SidebarContext);
  

  //Sidebar Contents
  const content = (
    <>
      <span className={`${expanded ? 'ml-2 mr-3' : 'mx-auto'} ${active ? 'text-white' : 'text-zuccini-800'} transition-all duration-500 flex-shrink-0`}>
          <FontAwesomeIcon icon={icon} className='mr-1 text-center transition-all duration-500 shadow-xl' />
      </span>

      <span className={`text-[15px] transition-all duration-500 whitespace-nowrap overflow-hidden ${expanded ? 'w-32 opacity-100 ml-1' : 'w-0 opacity-0 ml-0'} dark:text-white`}>{text}</span>

      {alert && (
      <span className={`absolute right-3 bg-zuccini-900 px-1.5 py-1.5 shadow-lg rounded-full transition-all duration-500 ${expanded ? 'top-3.5' : 'top-2'}`}>{alert}</span>)}
        
        {children && <span className={`ml-auto overflow-hidden transition-all duration 500 ${expanded ? 'w-11' : 'w-0'}`}>{children}</span>}
      
        {/* Labels for sections when sidebar is collapsed */}
      {!expanded && <div className="absolute invisible px-2 py-1 ml-6 text-sm font-bold text-center transition-all -translate-x-3 rounded-md shadow-lg left-full w-30 bg-zuccini-600 text-neutral-200 opacity-20 duration 500 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">{text}</div>}

    </>
);

    return isButton ? (
            <li className="relative flex items-center text-neutral-800 text-shadow-lg transition-all duration-500 min-h-[42px] group cursor-pointer">
            <div  
                onClick={onClick}
                 className={`flex items-center mb-0.5 py-2 px-0.5 text-xl rounded-l-xl font-semibold hover:bg-neutral-400 dark:hover:bg-neutral-800 ease-in-out transition-all duration-500 ${expanded ? 'w-65' : 'w-12'}`}>
                 {content}
            </div>
            </li>
         
        ): (
            <li className="relative flex items-center text-shadow-lg transition-all duration-500 min-h-[42px] group cursor-pointer">
             <Link to={`/${text}`} onClick={onClick} className={`flex items-center mb-0.5 py-2 px-0.5 text-xl rounded-l-xl text-neutral-800 font-semibold hover:bg-neutral-400 dark:hover:bg-neutral-800 ease-in-out transition-all duration-500 ${expanded ? 'w-65' : 'w-12'} ${active ? 'bg-zuccini-800 text-white hover:bg-zuccini-900 dark:hover:bg-zuccini-900' : ''}`}>
                 {content}
             </Link>
            </li>

    );
};




export default Sidebar;