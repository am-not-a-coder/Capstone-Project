import {
    faBell,
    faComment,
    faCircleUser
}
from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Header = () => {

    return(
        <header className="flex items-center col-start-2 col-span-5 text-white p-4 relative">
            <h1 className="text-neutral-900 text-5xl font-semibold text-shadow-lg">Dashboard</h1>
            {/* profile tab */}
            <div className="absolute top-5 right-5 flex justify-center items-center w-45 h-16 p-1 shadow-[5px_5px_10px_rgba(0,0,0,0.5)] rounded-3xl">
                <FontAwesomeIcon icon={faComment} className="bg-neutral-300 text-zuccini-800 text-xl p-2 rounded-lg" />
                <FontAwesomeIcon icon={faBell} className="bg-neutral-300 text-zuccini-800 text-center text-xl p-2 rounded-lg ml-2" />
                <FontAwesomeIcon icon={faCircleUser} className="text-zuccini-800 text-4xl ml-8" />
            </div>
        </header>
    )

};

export default Header;