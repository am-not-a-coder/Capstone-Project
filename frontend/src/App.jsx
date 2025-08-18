import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import axios from 'axios';
import { isLoggedIn } from './utils/auth_utils';
// Importing Pages
import Login from './pages/Login';
import MainLayout from './MainLayout';
import Dashboard from './pages/Dashboard';
import Institutes from './pages/Institutes';
import Accreditation from './pages/Accreditation';
import Documents from './pages/Documents';
import Programs from './pages/Programs';
import Users from './pages/Users';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import Notification from './pages/Notification';
import Messages from './pages/Messages';


function App() {

  //Checks if the token is not expired and directs the user to login if it is
  // axios.interceptors.response.use(
  //   response => response,
  //   error => {
  //     if (error.response?.status === 401){
  //       console.log("Your token is expired!")
  //       localStorage.removeItem('token');
  //       window.location.href = '/login'
  //     }
  //     return Promise.reject(error);
  //   }
  // )



  // If the user is not logged in it will redirect to login page
    const ProtectedRoute = ({children}) => {
      // Use   authentication check instead of direct localStorage access
      return isLoggedIn() ? children : <Navigate to="/Login" />
    }
  
  return (
    <Router>
      <Routes>
        {/* Default Page */}
        <Route path="/" element={<Navigate to="/Login" />}/>
        <Route path="/Login" element={<Login />}/>

        
        
        {/* These are the routes that needs authentication */}
        {/* MainLayout wraps other pages */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
          }>
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Institutes" element={<Institutes />} />
          <Route path="/Programs" element={<Programs />} />
          <Route path="/Accreditation" element={<Accreditation />} />
          <Route path="/Users" element={<Users />} />
          <Route path="/Tasks" element={<Tasks />} />
          <Route path="/Documents" element={<Documents />} />

        {/* Profile page */}
         <Route path='/Profile' element={<Profile />}/>
         <Route path='/Notification' element={<Notification />}/>
         <Route path='/Messages' element={<Messages />} />
        </Route>


      </Routes>
    </Router>
  )
}


export default App;
