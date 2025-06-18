import {
    faBell,
    faComment,
    faCircleUser
}
from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


const Header = ({title}) => {

    return(
        <header className="flex items-center col-start-2 col-span-5 text-white p-4 relative">
             <HeaderTitle title={title}/>
             {/* Profile Tab */}
            <div className="absolute top-2 right-2 flex justify-center items-center w-45 h-16 p-1 shadow-[5px_5px_10px_rgba(0,0,0,0.5)] rounded-3xl">
                <FontAwesomeIcon icon={faComment} className="bg-neutral-300 text-zuccini-800 text-xl p-2 rounded-lg cursor-pointer" />
                <FontAwesomeIcon icon={faBell} className="bg-neutral-300 text-zuccini-800 text-center text-xl p-2 rounded-lg ml-2 cursor-pointer" />
                <FontAwesomeIcon icon={faCircleUser} className="text-zuccini-800 text-4xl ml-8 cursor-pointer" />
            </div>
        </header>
    )

};

export const HeaderTitle = ({title}) => {
    return(
     <h1 className="ml-2 text-neutral-900 text-5xl font-semibold text-shadow-lg">{title}</h1>   
    )

}





export default Header;