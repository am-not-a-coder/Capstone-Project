import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faAngleRight,
    faAngleLeft,
    faSearch,
    } 
        from '@fortawesome/free-solid-svg-icons';
import udmsLogo from './assets/udms-logo.png';
import { createContext, useState, useContext } from 'react';

const SidebarContext = createContext();
const Sidebar = ({children}) => {
  const [expanded, setExpanded] = useState(true);


    // Sidebar component with state for expanded/collapsed
    return(
        <aside className={`row-span-5 h-screen mt-3 ml-3 transition-all duration-500 ${ expanded ? 'w-70' : 'w-12'}`} >
            <nav className=" relative h-145 flex flex-col bg-woodsmoke-200 border-1 border-black rounded-lg shadow-neutral-500 shadow-lg">
            {/* Title and Logo */}
            <div className="pt-3 pl-2 pr-10 pb-2 flex justify-between items-center transition-all duration-500">
                <img src={udmsLogo} alt="UDMS Logo" className={`m-2 h-10 rounded-full w-10 transition-all duration-500 ${expanded ? 'opacity-100 w-10' : 'opacity-0 w-0'}`} />
                <h4 className={`overflow-hidden transition-all m-1 line-clamp-2 font-semibold text-neutral-950 ${expanded ? 'w-42 opacity-100 ml-2' : 'w-0 opacity-0 ml-0'}`}>University Document Management System</h4>
                <button onClick={() => setExpanded(current => !current)} className="p-2 px-4 absolute -right-3 bg-zuccini-900 rounded-lg transition-all duration-500">
                    { expanded ? <FontAwesomeIcon icon={faAngleRight} /> : <FontAwesomeIcon icon={faAngleLeft} /> }
                </button>
            </div>
            

            {/* Search bar*/}
            <div className="ml-0.5 px-1 py-2 overflow-hidden relative">
                <FontAwesomeIcon icon={faSearch} className={`absolute text-zuccini-800 ml-3.5 mt-3.5 ${expanded ? '' : 'cursor-pointer'}`} />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    className={`w-65 p-2 pl-10 text-black placeholder-neutral-200 rounded-xl bg-woodsmoke-300 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-zuccini-900 ${expanded ? '' : 'cursor-pointer'}`}
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

export const SidebarLinks = ({link, icon, text, active, alert, onClick}) => {
  const {expanded} = useContext(SidebarContext);
    return (
        <li className="relative flex items-center text-neutral-800 text-shadow-lg transition-all duration-500 min-h-[42px] group">
      <a
        href={link}
        onClick={onClick}
        className={`flex items-center mb-0.5 py-2 px-0.5 text-xl rounded-l-xl font-semibold hover:bg-neutral-400 ease-in-out transition-all duration-500
          ${expanded ? 'w-65' : 'w-12'}
          ${active ? 'bg-zuccini-800 text-white hover:bg-zuccini-900' : ''}`}
      >
        {/* icon rendering */}
        <span className={`${expanded ? 'ml-2 mr-3' : 'mx-auto'} ${active ? 'text-white' : 'text-zuccini-800'} transition-all duration-500 flex-shrink-0`}>
          <FontAwesomeIcon icon={icon} className='text-center shadow-xl mr-1 transition-all duration-500' />
        </span>
        <span className={`text-[15px] transition-all duration-500 whitespace-nowrap overflow-hidden ${expanded ? 'w-32 opacity-100 ml-1' : 'w-0 opacity-0 ml-0'}`}>{text}</span>
        {alert && (
          <span className={`absolute right-3 bg-zuccini-900 px-1.5 py-1.5 shadow-lg rounded-full transition-all duration-500 ${expanded ? 'top-3.5' : 'top-2'}`}>
            {alert}
          </span>
        )}
      </a>
        {!expanded && <div className="
        absolute left-full w-30 rounded-md px-2 py-1 ml-6 text-sm text-center font-bold
        bg-zuccini-600 text-neutral-200 shadow-lg invisible opacity-20 -translate-x-3
        transition-all duration 300 group-hover:visible group-hover:opacity-100
        group-hover:translate-x-0
        ">{text}</div>
          
        }
      

    </li>
    );
};




export default Sidebar;