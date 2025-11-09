import { useState, useEffect } from 'react'
import {faSearch, faFilter, faCalendar, faBookOpen, faArrowTrendUp} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { apiGet } from '../utils/api_utils'
import { adminHelper } from '../utils/auth_utils'
import StatusModal from '../components/modals/StatusModal'
import {Area} from './Dashboard'
import AreaDetailModal from '../components/modals/AreaDetailModal'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Filter Component
const FilterPanel = ({ filters, onFilterChange, programs = [] }) => {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-gray-200 inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Program Filter */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Program</label>
        <select value={filters.program} onChange={(e) => onFilterChange('program', e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-200 inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-900 text-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent" >
          <option value="">All Programs</option>
          {programs.map(program => (
            <option key={program.code} value={program.code}>{program.name}</option>
          ))}
        </select>
      </div>

      {/* Progress Filter */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Progress Level</label>
        <select value={filters.progressLevel} onChange={(e) => onFilterChange('progressLevel', e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-200 inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-900 text-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent" >
          <option value="">All Levels</option>
          <option value="excellent">Excellent (80%+)</option>
          <option value="good">Good (60-79%)</option>
          <option value="fair">Fair (40-59%)</option>
          <option value="needs-attention">Needs Attention ( Less than 40%)</option>
        </select>
      </div>

      {/* Sort */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
        <select value={filters.sortBy} onChange={(e) => onFilterChange('sortBy', e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-200 inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-900 text-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent" >
          <option value="name">Area Name</option>
          <option value="progress-high">Progress (High to Low)</option>
          <option value="progress-low">Progress (Low to High)</option>
          <option value="updated">Last Updated</option>
        </select>
      </div>
    </div>
  )
}

// Statistics Panel Component
const StatsPanel = ({ areas }) => {
  const totalAreas = areas.length
  const avgProgress = Math.round(areas.reduce((sum, area) => sum + area.progress, 0) / totalAreas)
  const excellentAreas = areas.filter(area => area.progress >= 80).length
  const needsAttentionAreas = areas.filter(area => area.progress < 40).length

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-gray-200 inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Areas</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalAreas}</p>
          </div>
          <FontAwesomeIcon icon={faBookOpen} className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
        </div>
      </div>

      <div className="bg-gray-200 inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Average Progress</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{avgProgress}%</p>
          </div>
          <FontAwesomeIcon icon={faArrowTrendUp}  className="w-8 h-8 text-blue-600 dark:text-blue-500" />
        </div>
      </div>

      <div className="bg-gray-200 inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Excellent</p>
            <p className="text-2xl font-bold text-emerald-600">{excellentAreas}</p>
          </div>
          <div className="w-8 h-8 bg-emerald-600 dark:bg-emerald-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">✓</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-200 inset-shadow-sm inset-shadow-gray-400 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Needs Attention</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-500">{needsAttentionAreas}</p>
          </div>
          <div className="w-8 h-8 bg-red-600 dark:bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">!</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const AreaProgressPage = () => {
  // Admin check
  const isAdmin = adminHelper()
  const [areas, setAreas] = useState([])
  const [filteredAreas, setFilteredAreas] = useState([])
  const [programs, setPrograms] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    program: '',
    progressLevel: '',
    sortBy: 'name'
  })
  const [programChart, setProgramChart] = useState('allDept')

  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState('success')

  // Modal states
  const [showAreaDetail, setShowAreaDetail] = useState(false)
  const [selectedArea, setSelectedArea] = useState(null)

  // FETCH PROGRAMS
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await apiGet('/api/program', { withCredentials: true })
        if (Array.isArray(res.data.programs)) {
          const programsData = res.data.programs.map(program => ({
            code: program.programCode,
            name: program.programName,
            id: program.programID,
            color: program.programColor
          }))
          setPrograms(programsData)
        } else {
          setPrograms([])
        }
      } catch (err) {
        console.error("Error occurred when fetching programs", err)
        setError("Failed to fetch programs")
        setStatusMessage("Failed to fetch programs")
        setStatusType("error")
        setShowStatusModal(true)
      }
    }
    fetchPrograms()
  }, [])

  // FETCH AREAS WITH PROGRESS
  useEffect(() => {
    const fetchAreas = async () => {
      setLoading(true)
      try {
        const res = await apiGet('/api/area', { withCredentials: true })
        if (Array.isArray(res.data.area)) {
          // Process the area data to match your component structure
          const processedAreas = res.data.area.map(area => ({
            id: area.areaID,               
            areaNum: area.areaNum,                     
            description: area.areaTitle,
            progress: area.progress || 0,
            programCode: area.programCode,
            programName: area.programName,
            programID: area.programID,
            lastUpdated: area.updated_at ? new Date(area.updated_at).toLocaleDateString() : new Date().toLocaleDateString()
          }))

          // Remove duplicates based on areaID
          const uniqueAreas = processedAreas.filter((area, index, self) => 
            index === self.findIndex(a => a.id === area.id)
          )
          setAreas(uniqueAreas)
        } 
        else {
          setAreas([])
        }
      } catch (err) {
        console.error("Error occurred when fetching areas", err)
        setError("Failed to fetch areas")
        setStatusMessage("Failed to fetch area data")
        setStatusType("error")
        setShowStatusModal(true)
      } finally {
        setLoading(false)
      }
    }
    fetchAreas()
  }, [])

  useEffect(() => {
    let filtered = [...areas]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(area => 
        area.areaTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.programCode.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply program filter
    if (filters.program) {
      filtered = filtered.filter(area => area.programCode === filters.program)
    }

    // Apply progress level filter
    if (filters.progressLevel) {
      switch (filters.progressLevel) {
        case 'excellent':
          filtered = filtered.filter(area => area.progress >= 80)
          break
        case 'good':
          filtered = filtered.filter(area => area.progress >= 60 && area.progress < 80)
          break;
        case 'fair':
          filtered = filtered.filter(area => area.progress >= 40 && area.progress < 60)
          break
        case 'needs-attention':
          filtered = filtered.filter(area => area.progress < 40)
          break
      }
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'progress-high':
        filtered.sort((a, b) => b.progress - a.progress)
        break
      case 'progress-low':
        filtered.sort((a, b) => a.progress - b.progress)
        break
      case 'updated':
        filtered.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
        break
      case 'name':
          filtered.sort((a, b) => a.description.localeCompare(b.areaTitle))
      default:
          filtered.sort((a, b) => a.areaNum.localeCompare(b.areaTitle))
        break
    }

    // Add program color in each area
    const updatedFiltered = filtered.map((filteredArea) => {
      const areaProgram = programs.find(program => program.code === filteredArea.programCode)
      console.log('areaProgram: ', areaProgram)
      return ({...filteredArea, areaColor: areaProgram.color})
    })
    setFilteredAreas(updatedFiltered)
  }, [areas, searchTerm, filters])

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }))
  };

   const handleAreaClick = (area) => {
    console.log('Area clicked:', area)
    setSelectedArea(area)
    setShowAreaDetail(true)
  };

  const handleCloseAreaDetail = () => {
    setSelectedArea(null)
    setShowAreaDetail(false)
  };

  const refreshData = async () => {
    setLoading(true)
    try {
      // Refetch both programs and areas
      const [programRes, areaRes] = await Promise.all([
        apiGet('/api/program', { withCredentials: true }),
        apiGet('/api/area', { withCredentials: true })
      ])

      // Update programs
      if (Array.isArray(programRes.data.programs)) {
        const programsData = programRes.data.programs.map(program => ({
          code: program.programCode,
          name: program.programName,
          id: program.programID
        }))
        setPrograms(programsData)
      }

      // Update areas
      if (Array.isArray(areaRes.data.area)) {
        const processedAreas = areaRes.data.area.map(area => ({
          id: area.areaID,                   
          areaNum: area.areaNum,            
          description: area.areaTitle,
          progress: area.progress || 0,
          programCode: area.programCode,
          programName: area.programName,
          programID: area.programID,
          lastUpdated: area.updated_at ? new Date(area.updated_at).toLocaleDateString() : new Date().toLocaleDateString()
        }))

        const uniqueAreas = processedAreas.filter((area, index, self) => 
          index === self.findIndex(a => a.id === area.id)
        )

        setAreas(uniqueAreas)
      }

      setStatusMessage("Data refreshed successfully")
      setStatusType("success")
      setShowStatusModal(true)
    } catch (err) {
      console.error("Error refreshing data", err)
      setStatusMessage("Failed to refresh data")
      setStatusType("error")
      setShowStatusModal(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading && areas.length === 0) {
    return (
      <div className="w-full p-5 bg-neutral-200 border border-neutral-300 text-neutral-800 rounded-[20px] shadow-inner shadow-gray-400 dark:bg-gray-900 dark:shadow-emerald-900 dark:text-white min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400">Loading area progress...</p>
          </div>
        </div>
      </div>
    )
  }

  // Processed data for bar chart
  const displayedAreas = programChart === 'allDept' ? areas : areas.filter(area => area.programCode === programChart)
  const groupedAreas = Object.values(displayedAreas.reduce((acc, curr)=> {
    if(!acc[curr.areaNum]) {
      acc[curr.areaNum] = {areaNum: curr.areaNum, totalProgress: 0, count: 0}
    }
    acc[curr.areaNum].totalProgress =+ curr.progress
    acc[curr.areaNum].count =+ 1
    return acc
  }, {})).map(group => ({
    areaNum: group.areaNum,
    totalProgress: parseInt((group.totalProgress / group.count))
  }))
  console.log('grouped areas: ', groupedAreas)

  return (
    <div className="w-full p-5 bg-neutral-200 border border-neutral-300 text-neutral-800 rounded-[20px] shadow-inner shadow-gray-400 dark:bg-gray-900 dark:shadow-emerald-900 dark:text-white min-h-screen">
      {/* Status Modal */}
      {showStatusModal && (
        <StatusModal 
          message={statusMessage} 
          type={statusType} 
          showModal={showStatusModal} 
          onClick={() => setShowStatusModal(false)} 
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Area Progress Overview</h1>
        <div className="flex items-center gap-4">
          {/* Refresh Button */}
          <button onClick={refreshData} disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300" >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Search */}
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search areas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-200 inset-shadow-sm inset-shadow-gray-400  dark:bg-gray-700 text-gray-700 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Statistics Panel */}
      {areas.length > 0 && <StatsPanel areas={areas} />}

      {/* Error State */}
      {error && !loading && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <button 
            onClick={refreshData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Graphs */}
      <section className=' flex h-100 flex-col items-end p-4 w-full overflow-auto shadow-inner shadow-gray-400 border border-gray-300 bg-gray-200 rounded-xl [&_*:focus]:outline-none ' >
        <select value={programChart} onChange={(e)=> setProgramChart(e.target.value)}  name="selectDept" className='w-1/2 p-2 right-0 outline-0 border mb-8 border-gray-300 shadow-inner shadow-gray-400 rounded text-neutral-800' >
          <option value="allDept" selected  className='text-gray-400' >All Department</option>
          {programs.map((program)=> (
            <option key={program.code} value={program.code}>{program.name}</option>
          ))}
        </select>
        {groupedAreas.length === 0 ? (
          <p className='text-gray-500 text-7xl place-self-center' >This program have no Areas</p>
        ) : (
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={groupedAreas}>
              <CartesianGrid strokeDasharray="5" />
              <XAxis dataKey='areaNum'/>
              <YAxis domain={[0, 100]} tickCount={6} tickFormatter={(value)=> `${value}%`} />
              <Tooltip formatter={(value)=> `${value}%`} />
              <Legend />
              <Bar dataKey="totalProgress" name="Progress" fill="#329a65" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FontAwesomeIcon icon={faFilter} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        <FilterPanel 
          filters={filters} 
          onFilterChange={handleFilterChange}
          programs={programs}
        />
      </div>

      {/* Areas Grid */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-4">
          Areas ({filteredAreas.length} of {areas.length})
        </h2>
        
        {filteredAreas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAreas.map((area) => (
              <Area
                onClick={handleAreaClick}
                key={area.areaID} 
                areaTitle={area.areaNum} 
                desc={area.description} 
                program={area.programCode} 
                progress={area.progress}
                areaColor={area.areaColor}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <FontAwesomeIcon icon={faBookOpen} className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-lg text-gray-500">No areas found matching your criteria.</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {showAreaDetail && selectedArea && (
        <AreaDetailModal
          area={selectedArea}
          showModal={showAreaDetail}
          onClick={handleCloseAreaDetail}
        />
      )}
    </div>
  );
};

export default AreaProgressPage