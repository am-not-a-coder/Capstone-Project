import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
// Importing Pages
import Login from './frontend/pages/Login';
import MainLayout from './MainLayout';
import Dashboard from './frontend/pages/Dashboard';
import Institutes from './frontend/pages/Institutes';
import Accreditation from './frontend/pages/Accreditation';
import Documents from './frontend/pages/Documents';
import Programs from './frontend/pages/Programs';
import Users from './frontend/pages/Users';
import Tasks from './frontend/pages/Tasks';
import Profile from './frontend/pages/Profile';


function App() {
  
  return (
    <Router>
      <Routes>
        {/* Default Page */}
        <Route path="/" element={<Navigate to="/Login" />}/>
        <Route path="/Login" element={<Login />}/>

        {/* MainLayout wraps other pages */}
        <Route path="/" element={<MainLayout />} >
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Institutes" element={<Institutes />} />
          <Route path="/Programs" element={<Programs />} />
          <Route path="/Accreditation" element={<Accreditation />} />
          <Route path="/Users" element={<Users />} />
          <Route path="/Tasks" element={<Tasks />} />
          <Route path="/Documents" element={<Documents />} />
        {/* Profile page */}
         <Route path='/Profile' element={<Profile />}/>
        </Route>


       
      </Routes>
    </Router>
  )
}


export default App;
