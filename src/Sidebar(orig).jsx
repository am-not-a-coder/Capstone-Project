import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLayerGroup, faSchool, faGraduationCap, faUsers, faCircleCheck, faFileAlt, faIdCardClip } from '@fortawesome/free-solid-svg-icons';
import udmsLogo from './assets/udms-logo.png';


const Sidebar = () => {
  return (
    <div className="m-2 w-64 h-screen bg-woodsmoke-900 rounded-lg shadow-lg">
    
    {/*Title and Logo*/}
      <div className="flex flex-row p-4">
        <img src={udmsLogo} alt="UDMS Logo" className='m-2 h-10 rounded-full' />
        <h4 className="m-1 font-semibold">University Document Management System</h4>

      </div>
      <nav className="mt-4">
        {/* Navigation Links */}
        <ul> 
          <li className="my-2 p-2 text-lg font-semibold hover:bg-zuccini-800"><a href="#dashboard"><FontAwesomeIcon icon={faLayerGroup} className="mx-3"/> Dashboard</a></li>
          <li className="my-2 p-2 text-lg font-semibold hover:bg-gray-700"><a href="#institutes"><FontAwesomeIcon icon={faSchool} className="mx-3"/>Institutes</a></li>
          <li className="my-2 p-2 text-lg font-semibold hover:bg-gray-700"><a href="#programs"><FontAwesomeIcon icon={faGraduationCap} className="mx-3" />Programs</a></li>
          <li className="my-2 p-2 text-lg font-semibold hover:bg-gray-700"><a href="#accreditation"> <FontAwesomeIcon icon={faIdCardClip} className="mx-3"/>Accreditation</a></li>
          <li className="my-2 p-2 text-lg font-semibold hover:bg-gray-700"><a href="#users"><FontAwesomeIcon icon={faUsers} className="mx-3" />Users</a></li>
          <li className="my-2 p-2 text-lg font-semibold hover:bg-gray-700"><a href="#tasks"><FontAwesomeIcon icon={faCircleCheck} className="mx-3" />Tasks</a></li>
          <li className="my-2 p-2 text-lg font-semibold hover:bg-gray-700"><a href="#documents"><FontAwesomeIcon icon={faIdCardClip} className="mx-3" />Documents</a></li>
        </ul>


        
      </nav>
    </div>
  );
}

export default Sidebar;