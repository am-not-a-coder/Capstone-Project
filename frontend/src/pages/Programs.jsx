//for imports
import { faAngleUp, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import ProgramCard from "../components/ProgramCard";
import CreateCard from "../components/CreateCard";
import CreateForm from "../components/CreateForm";
import { useState, useEffect } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api_utils';
import { getCurrentUser } from '../utils/auth_utils';


  const Programs = () => {
    {/*use state function*/}
  const [programs, setPrograms] = useState([]);
  const [employees, setEmployees] = useState([]);    
  const [showForm, setShowForm] = useState(false);
  const [activeModify, setActiveModify] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
    
    // Get user info using our centralized utility
    const currentUser = getCurrentUser();

useEffect(() => {
  const fetchProgram = async () => {
    try {
      // Use our centralized API utility - no manual token handling!
      const response = await apiGet('/api/program');

      if (response.success) {
        Array.isArray(response.data.programs)
          ? setPrograms(response.data.programs)
          : setPrograms([]);
      } else {
        console.error('Failed to fetch programs:', response.error);
        setPrograms([]); // Set empty array on error
      }
    } catch (err) {
      console.error("Error occurred when fetching programs:", err);
      setPrograms([]);
    }
  };

  const fetchArea = async () => {
    try {
      const response = await apiGet('/api/area', { withCredentials: true });
      Array.isArray(response.data.areas)
        ? setAreas(response.data.areas)
        : setAreas([]);
    } catch (err) {
      console.error("Error occurred when fetching area:", err);
      setAreas([]);
    }
  };

  const fetchSubarea = async () => {
    try {
      const response = await apiGet('/api/subarea', { withCredentials: true });
      Array.isArray(response.data.subareas)
        ? setSubareas(response.data.subareas)
        : setSubareas([]);
    } catch (err) {
      console.log("Error when fetching Subareas:", err);
      setSubareas([]);
    }
  };

  const fetchCriteria = async () => {
    try {
      const response = await apiGet('/api/criteria', { withCredentials: true });
      Array.isArray(response.data.criterias)
        ? setCriterias(response.data.criterias)
        : setCriterias([]);
    } catch (err) {
      console.log("Error when fetching criterias:", err);
      setCriterias([]);
    }
  };

  // Call all functions
  fetchProgram();
  fetchArea();
  fetchSubarea();
  fetchCriteria();
}, []);


    useEffect(() => {
      const fetchEmployees = async () => {
        try {
         
          const response = await apiGet('/api/users');
          
          if (response.success) {
            Array.isArray(response.data.users) ? setEmployees(response.data.users) : setEmployees([]);
          } else {
            console.error("Error fetching employees:", response.error);
            setEmployees([]);
          }
        } catch (err) {
          console.error("Unexpected error fetching employees", err);
          setEmployees([]);
        }
      };
      fetchEmployees();
    }, []); // No more token dependency!

    
    function handleModify(mode) {

      setActiveModify((prev) => (prev === mode ? null : mode));
      if (mode !== "edit") {
        setEditIndex(null);
        setForm({ programCode: "", programName: "", programColor: "", employeeID: null });
      }
  }

  function handleEditSelect(e) {
      const idx = e.target.value;
      setEditIndex(idx);
      const prog = programs[idx];

      setForm({
        programCode: prog.programCode,
        programName: prog.programName,
        programColor: prog.programColor,
        employeeID: prog.employeeID || null  // Use employeeID from program object
      });
    }


  function handleDeleteSelect(e) {
      setEditIndex(e.target.value);
  }

    const handleDelete = async (e) => {
      e.preventDefault();
      if (editIndex !== null) {
        try {
          const programToDelete = programs[editIndex];
          
          // Call DELETE API
          await apiDelete(`/api/program/${programToDelete.programID}`);
          
          // Remove from local state only if API call succeeds
          setPrograms(programs.filter((_, idx) => idx != editIndex));
          setShowForm(false);
          setEditIndex(null);
          setActiveModify(null);
          
        } catch (error) {
          console.error('Error deleting program:', error);
          
          // Show detailed error message if available
          if (error.response && error.response.data) {
            const errorData = error.response.data;
            if (errorData.reason && errorData.suggestion) {
              alert(`${errorData.error}\n\n${errorData.reason}\n\n${errorData.suggestion}`);
            } else {
              alert(errorData.error || 'Failed to delete program. Please try again.');
            }
          } else {
            alert('Failed to delete program. Please try again.');
          }
        }
      }
  }


    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        if (activeModify === "edit" && editIndex !== null) {
          // Edit mode
          const response = await apiPut(`/api/program/${programs[editIndex].programID}`, form)
          
          //update localstate with response
          const updated = [...programs];
          updated[editIndex] = response.data.updated_program
          setPrograms(updated)

        } else {
          // Add mode
          const response = await apiPost('http://localhost:5000/api/program', form);
          //add data to localstate
          setPrograms([...programs, response.data])
        }
        //Success: Reset form
        setShowForm(false);
        setForm({ programCode: "", programName: "", programColor: "", employeeID: null });
        setEditIndex(null);
        setActiveModify(null);
      } catch(error){
        console.error('Error saving program', error);
        alert('Failed to save program. Please try again.')
      }
    };

    const [form, setForm] = useState({
      programCode: "",
      programName: "",
      programColor: "",
      employeeID: null,
    });


  const handleChange = (e) => {
      setForm({...form, [e.target.name]: e.target.value});
  };

  const [visible, setVisible] = useState("programs");
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedSubarea, setSelectedSubarea] = useState(null);

  // Function to set the visible area to "areas" and set the selected program
  function visibleArea(program){
    setVisible("areas");
    setSelectedProgram(program);
  }

  function visibleSubarea(area){
    
  }

  // Clear navigation route to programs
  function backToPrograms(){
    setVisible("programs");
    setSelectedProgram(null);
    setSelectedArea(null);
    setSelectedSubarea(null);
  }

  return (
      <>
          <div className="flex flex-wrap gap-5 mt-20 mb-8 lg:mt-8" >

            {/* Navigation route */}
            <div className="fixed left-0 w-full h-10 p-2 -mt-5 -mb-3 text-center bg-gray-200 lg:relative">
              <p  className="left-0 z-20 flex items-center overflow-scroll overflow-y-hidden font-semibold text-gray-700 text-md lg:text-lg text-nowrap scrollbar-thin lg:relative bg-gray-250">
                <span onClick={()=> backToPrograms()} className="cursor-pointer hover:text-blue-800">Programs</span> 
                <span>{selectedProgram ? ' / ' + selectedProgram.programName : null}</span>
                <span>{selectedArea ? ' / ' + selectedArea.areaName : null}</span>
                <span>{selectedSubarea ? ' / ' + selectedSubarea.subareaName : null}</span>
              </p>
            </div>

            {/* Add, Edit, or Delete program button */}
            <CreateCard setShowForm={setShowForm} className={`${visible == "programs" ? 'block' : 'hidden'}`} />

            {programs.map(program=> (
              // Program cards
              <ProgramCard program={program} key={program.programID} onClick={()=> visibleArea(program)} className={`${visible == 'programs' ? 'block' : 'hidden'} hover:border-zuccini-700 shadow-xl`}/>
            ))}

            {/* Inside the program */}
            {selectedProgram && visible === "areas" && (
              <div className={`${ visible == "areas" ? 'block' : 'hidden'} w-full h-screen mt-6 lg:mt-0 rounded-xl p-2 text-gray-700`}>
                {areas.filter(area => area.programID === selectedProgram.programID)
                  .sort((a, b) => a.areaID - b.areaID)
                  .map(area => (
                    <div key={area.areaID} className="mb-2"> 
                      {/* Areas */}
                      <div onClick={()=> setSelectedArea(prev => {
                          const newArea = prev && prev.areaID === area.areaID ? null : area;
                          setSelectedSubarea(null)
                          return newArea
                        })}  className={`${selectedArea && selectedArea.areaID === area.areaID ? 'border-zuccini-700 border-2' : 'border-gray-400'} w-full relative bg-gray-300 h-10 flex items-center p-3 mb-2 text-xs lg:text-xl text-shadow-xs hover:bg-gray-400 cursor-pointer rounded-md shadow-md border`} >
                        <p>{area.areaName}</p>
                        <FontAwesomeIcon icon={faAngleRight} className={`${selectedArea && selectedArea.areaID === area.areaID ? 'rotate-90' : ''} text-md lg:text-lg right-2 absolute`} />
                      </div>
                    
                      {selectedArea && selectedArea.areaID === area.areaID && (
                        subareas.filter(subarea => subarea.areaID === selectedArea.areaID)
                          .sort((a, b) => a.subareaID - b.subareaID)
                          .map(subarea => (
                            <div key={subarea.subareaID}  className="mb-2">
                              {/* Subareas */}
                              <div onClick={()=> setSelectedSubarea(prev => prev && prev.subareaID === subarea.subareaID ? null : subarea)}  className={`${selectedSubarea && selectedSubarea.subareaID === subarea.subareaID ?  'border-zuccini-700 border-2' : 'border-gray-400'} ml-[5%] w-[95%] relative bg-gray-300 h-10 flex items-center p-3 mb-2 text-xs lg:text-xl hover:border-zuccini-700 cursor-pointer rounded-md shadow-md border `} >
                                <p>{subarea.subareaName}</p>
                                <FontAwesomeIcon icon={faAngleRight} className={`${selectedSubarea && selectedSubarea.subareaID === subarea.subareaID ? 'rotate-90' : ''} text-md lg:text-lg right-2 absolute `} />
                              </div>

                              {selectedSubarea && selectedSubarea.subareaID === subarea.subareaID &&  (
                                criterias.filter(criteria => criteria.subareaID === selectedSubarea.subareaID)
                                  .sort((a, b) => a.criteriaID - b.criteriaID)
                                  .map(criteria => (
                                    // Criterias
                                    <div key={criteria.criteriaID}  className={` ml-[10%] w-[90%] bg-gray-300 items-center p-3 mb-2 text-xs lg:text-xl rounded-md shadow-md border border-gray-400 `} >
                                      <p>{criteria.criteriaType}<br/><br />
                                        <span>{criteria.criteriaContent}</span>
                                      </p>
                                    </div>
                                  ))
                              )}
                            </div>
                          )) 
                      )}
                    </div>
                  ))
                }
                
              </div>
            )}

            {/*Form*/}
            {showForm && 
            <CreateForm 
              title="Program"
              data={programs}
              employees={employees}
              onSubmit={handleSubmit}
              onClose={() => setShowForm(false)}
              onEditSelect={handleEditSelect}
              onDeleteSelect={handleDeleteSelect}
              onDelete={handleDelete}
              activeModify={activeModify}
              editIndex={editIndex}
              form={form}
              handleChange={handleChange}
              handleModify={handleModify}
            />}
          </div>
      </>
  );
}
export default Programs;