import { Link } from 'react-router-dom'
import { getCurrentUser, adminHelper } from '../utils/auth_utils'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const user = getCurrentUser()
  const isAdmin = adminHelper()

  return (  
    <footer className="transition-all duration-500 shadow-xl text-neutral-800 border dark:border-gray-900 border-neutral-300 rounded-3xl inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-900 dark:bg-gray-900 border-t mt-auto">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 flex flex-wrap gap-10 justify-between">

        {/* Branding */}
        <div className="flex flex-col gap-1 max-w-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zm5.99 7.176A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-green-800 leading-tight">
              UDM Document<br />Management System
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mt-1">
            A web-based predictive analytics system for academic accreditation using deep learning at the University of the Immaculate Conception.
          </p>
        </div>

        {/* Quick Links */}
        {/* <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-green-700 mb-1">
            Quick Links
          </span>
          <Link to="/Dashboard" className="text-sm text-gray-500 hover:text-green-700 transition-colors">
            Dashboard
          </Link>
          <Link to="/Programs" className="text-sm text-gray-500 hover:text-green-700 transition-colors">
            Programs
          </Link>
          <Link to="/Accreditation" className="text-sm text-gray-500 hover:text-green-700 transition-colors">
            Accreditation
          </Link>
          <Link to="/Documents" className="text-sm text-gray-500 hover:text-green-700 transition-colors">
            Documents
          </Link>
          <Link to="/Templates" className="text-sm text-gray-500 hover:text-green-700 transition-colors">
            Templates
          </Link>
          {isAdmin && (
            <Link to="/Users" className="text-sm text-gray-500 hover:text-green-700 transition-colors">
              Users
            </Link>
          )}
        </div> */}

        {/* Account */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-green-700 mb-1">
            Account
          </span>
          {user ? (
            <>
              <span className="text-sm text-gray-500">
                Signed in as{' '}
                <span className="font-semibold text-gray-700">
                  {user.firstName || user.employeeID}
                </span>
              </span>
              <span className="text-sm text-gray-400 capitalize">
                Role: {user.isAdmin ? 'Admin' : user.isCoAdmin ? 'Co-Admin' : 'User'}
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-400">Not signed in</span>
          )}
        </div>

        {/* System */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-green-700 mb-1">
            System
          </span>
          <span className="text-sm text-gray-400">Version 1.0.0</span>
          <span className="text-sm text-gray-400">React + Vite + Flask</span>
          <span className="text-sm text-gray-400">Deep Learning Analytics</span>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="bg-green-800 px-8 py-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-green-200">
          © {currentYear} Universidad de Manila — Quality Assurance Department. All rights reserved.
        </span>
        <span className="text-xs text-green-400">
          Capstone Project · Built with React &amp; Flask
        </span>
      </div>

    </footer>
  )
}

export default Footer