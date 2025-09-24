import { useEffect, useState } from 'react';
import StatusModal from './StatusModal';
import { apiGet, apiPostForm } from '../../utils/api_utils';

const CreateModal = ({onClick, onCreate, setShowCreateModal}) => {
    const [programID, setProgramID] = useState('');
    const [areaNum, setAreaNum] = useState('');
    const [areaName, setAreaName] = useState('');
    const [subAreaName, setSubAreaName] = useState('');
    const [criteria, setCriteria] = useState('');
    const [criteriaType, setCriteriaType] = useState('Inputs');

    const [programCode, setProgramCode] = useState('');
    const [selectedAreaID, setSelectedAreaID] = useState();
    const [selectedSubAreaID, setSelectedSubAreaID] = useState()
    const [activeForm, setActiveForm] = useState("Area")

    // options
    const [programOption, setProgramOption] = useState([]);
    const [areaOption, setAreaOption] = useState([]);
    const [subAreaOption, setSubAreaOption] = useState([]);
    const [allSubareas, setAllSubareas] = useState([]);

    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [statusType, setStatusType] = useState("success");

    // All your existing useEffect and handler functions remain exactly the same
    useEffect(() => {
        const fetchProgram = async () => {
            try{
                const res = await apiGet('/api/program', {withCredentials: true})
                Array.isArray(res.data.programs) ? setProgramOption(res.data.programs) : setProgramOption([]);
                console.log(res.data.programs)
            } catch (err){
                console.error("Error occurred when fetching program", err)
            }
        }
        fetchProgram();
    }, [])
    
    const fetchSubAreas = async (programCode) =>{
        try{
            const res = await apiGet(`/api/accreditation?programCode=${encodeURIComponent(programCode)}`,{withCredentials: true})

            const allSubareas = [];
                if (Array.isArray(res.data)) {res.data.forEach(area => {
                    if (Array.isArray(area.subareas)) {
                        area.subareas.forEach(subarea => {
                            allSubareas.push({
                                ...subarea,
                                areaID: area.areaID
                            });
                        });
                    }
                });
            }
            setAllSubareas(allSubareas);
            setSubAreaOption(allSubareas);
        } catch(err){
            console.error("Error occurred when fetching sub-area", err)
        }
    };

    const fetchAreas = async (programCode) => {
        try{
            const res = await apiGet(`/api/accreditation?programCode=${encodeURIComponent(programCode)}`, {withCredentials: true})
            Array.isArray(res.data) ? setAreaOption(res.data) : setAreaOption([]);
        } catch(err){
            console.error("Error occurred when fetching area", err)
        }
    }

    const handleCreateArea = async (e) => {
        e.preventDefault();
        
        const formData = new FormData()
            formData.append("programID", programID)
            formData.append("areaNum", areaNum)
            formData.append("areaName", areaName)

        try{
            const response = await apiPostForm('/api/accreditation/create_area', formData, {withCredentials: true});
            setShowStatusModal(true)
            setStatusMessage(response.data.message)
            setStatusType("success")    
        } catch(err){
            setShowStatusModal(true)
            setStatusMessage("An error occurred when creating area")
            setStatusType("error")
        }
    }

    const handleCreateSubArea = async (e) => {
        e.preventDefault();

        const formData = new FormData()
            formData.append("selectedAreaID", selectedAreaID)
            formData.append("subAreaName", subAreaName)
            
        try{
            const response = await apiPostForm('/api/accreditation/create_subarea', formData, {withCredentials: true});                   
            setShowStatusModal(true)
            setStatusMessage(response.data.message)
            setStatusType("success")
        } catch(err){
            setShowStatusModal(true)
            setStatusMessage("An error occurred when creating sub-area")
            console.error(err)
            setStatusType("error")
        }
    }

    const handleCreateCriteria = async (e) => {
        e.preventDefault();

        const formData = new FormData()
        formData.append("selectedSubAreaID", selectedSubAreaID)
        formData.append("criteriaType", criteriaType)
        formData.append("criteria", criteria)

        try{
            const response = await apiPostForm('/api/accreditation/create_criteria', formData, {withCredentials: true});
            setShowStatusModal(true)
            setStatusMessage(response.data.message)
            setStatusType("success")
        }catch(err){
            setShowStatusModal(true)
            setStatusMessage("An error occurred when creating criteria")
            console.error(err)
            setStatusType("error")
        }
    }

    useEffect(() => {
        if (programCode){
            fetchAreas(programCode);
            fetchSubAreas(programCode);
        } else{
            setAreaOption([]);
            setSubAreaOption([]);
        }
    }, [programCode])

    useEffect(() => {
        if(selectedAreaID){
            const filteredSubAreas = allSubareas.filter(
                (sub) => sub.areaID === parseInt(selectedAreaID)
            );
            setSubAreaOption(filteredSubAreas);
        } else{
            setSubAreaOption(allSubareas);
        }
            setSelectedSubAreaID('');
        }, [selectedAreaID, allSubareas])

    const handleChange = (e) =>{
        setProgramID(e.target.value);
                        
        const selectedProgram = programOption.find(p => p.programID === parseInt(e.target.value))

        if (selectedProgram){
            setProgramCode(selectedProgram.programCode);
        } else{
            setProgramCode('');
        }
    }

    const handleCloseModal = () => {
        setShowStatusModal(false);
        setShowCreateModal(false);
        
        setSelectedAreaID('')
        setSelectedSubAreaID('')
        setCriteriaType('Inputs')
        setCriteria('')
        setSelectedAreaID('');
        setSubAreaName('');
        setCriteria('');
        setCriteriaType('');
        if (onCreate) onCreate(programCode);
    }

    return(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            {showStatusModal && (
                <StatusModal message={statusMessage} type={statusType} showModal={showStatusModal} onClick={handleCloseModal} />
            )}

            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-primary">
                
                {/* Header */}
                <div className="relative p-8 pb-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="text-center">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                            Create {activeForm}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Add new {activeForm.toLowerCase()} to your accreditation system
                        </p>
                    </div>
                    
                    <button 
                        onClick={onClick}
                        className="absolute flex items-center justify-center w-10 h-10 transition-colors duration-200 bg-gray-100 rounded-full top-6 right-6 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="px-8 pt-6 pb-2">
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5">
                        {["Area", "Sub-Area", "Criteria"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveForm(tab)}
                                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                                    activeForm === tab
                                        ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-lg transform scale-105'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Form Content */}
                <div className="px-8 pb-8">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 min-h-[400px]">
                        
                        {/* Area Form */}
                        {activeForm === "Area" && (
                            <form onSubmit={handleCreateArea} className="space-y-6">
                                <div>
                                    <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Program <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="programID"
                                        value={programID}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 text-gray-900 transition-all duration-200 bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                                        required
                                    >
                                        <option value="">Select a Program</option>
                                        {programOption.map((program) => (
                                            <option key={program.programID} value={program.programID}>
                                                {program.programName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Area Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="areaNum"
                                        type="text"
                                        placeholder="e.g. Area I, Area II, Area III"
                                        value={areaNum}
                                        onChange={(e) => setAreaNum(e.target.value)}
                                        className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Area Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="areaName"
                                        type="text"
                                        placeholder="Enter the area name"
                                        value={areaName}
                                        onChange={(e) => setAreaName(e.target.value)}
                                        className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                                        required
                                    />
                                </div>
                            </form>
                        )}

                        {/* Sub-Area Form */}
                        {activeForm === "Sub-Area" && (
                            <form onSubmit={handleCreateSubArea} className="space-y-6">
                                <div>
                                    <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Program <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="programID"
                                        value={programID}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 text-gray-900 transition-all duration-200 bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                                        required
                                    >
                                        <option value="">Select a Program</option>
                                        {programOption.map((program) => (
                                            <option key={program.programID} value={program.programID}>
                                                {program.programName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Assign Area <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="selectedAreaID"
                                        value={selectedAreaID}
                                        onChange={(e) => setSelectedAreaID(e.target.value)}
                                        className="w-full px-4 py-3 text-gray-900 transition-all duration-200 bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                                        required
                                    >
                                        <option value="">Select Designated Area</option>
                                        {areaOption.map((area) => (
                                            <option key={area.areaID} value={area.areaID}>
                                                {area.areaName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Sub-Area Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="subAreaName"
                                        type="text"
                                        placeholder="e.g. A. Administration, B. Finance"
                                        value={subAreaName}
                                        onChange={(e) => setSubAreaName(e.target.value)}
                                        className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                                        required
                                    />
                                </div>
                            </form>
                        )}

                        {/* Criteria Form */}
                        {activeForm === "Criteria" && (
                            <form onSubmit={handleCreateCriteria} className="space-y-6">
                                <div>
                                    <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Program <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="programID"
                                        value={programID}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 text-gray-900 transition-all duration-200 bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                                        required
                                    >
                                        <option value="">Select a Program</option>
                                        {programOption.map((program) => (
                                            <option key={program.programID} value={program.programID}>
                                                {program.programName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Area <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="selectedAreaID"
                                        value={selectedAreaID}
                                        onChange={(e) => setSelectedAreaID(e.target.value)}
                                        className="w-full px-4 py-3 text-gray-900 transition-all duration-200 bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                                        required
                                    >
                                        <option value="">Select Designated Area</option>
                                        {areaOption.map((area) => (
                                            <option key={area.areaID} value={area.areaID}>
                                                {area.areaName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Sub-Area <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="subareaID"
                                            value={selectedSubAreaID}
                                            onChange={(e) => setSelectedSubAreaID(e.target.value)}
                                            className="w-full px-4 py-3 text-gray-900 transition-all duration-200 bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                                            required
                                        >
                                            <option value="">Select Designated Sub-Area</option>
                                            {subAreaOption.map((subareas) => (
                                                <option key={subareas.subareaID} value={subareas.subareaID}>
                                                    {subareas.subareaName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Criteria Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="criteriaType"
                                            value={criteriaType}
                                            onChange={(e) => setCriteriaType(e.target.value)}
                                            className="w-full px-4 py-3 text-gray-900 transition-all duration-200 bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                                            required
                                        >
                                            <option value="">Select Criteria Type</option>
                                            <option value="Inputs">Inputs</option>
                                            <option value="Processes">Processes</option>
                                            <option value="Outcomes">Outcomes</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Criteria <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="criteria"
                                        placeholder="Enter the criteria"
                                        value={criteria}
                                        onChange={(e) => setCriteria(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 bg-white border border-gray-200 resize-none dark:bg-gray-900 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                                        required
                                    />
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between gap-4 mt-8">
                        <button
                            onClick={onClick}
                            className="px-8 py-3 font-semibold text-gray-700 transition-all duration-200 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 rounded-xl hover:shadow-lg hover:scale-105"
                        >
                            Cancel
                        </button>
                        
                        <button
                            onClick={
                                activeForm === "Area" ? handleCreateArea :
                                activeForm === "Sub-Area" ? handleCreateSubArea :
                                handleCreateCriteria
                            }
                            className="flex items-center gap-2 px-8 py-3 font-semibold text-white transition-all duration-200 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl hover:shadow-lg hover:scale-105"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create {activeForm}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CreateModal;