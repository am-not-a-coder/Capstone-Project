//for imports
import { faAngleUp, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import ProgramCard from "../components/ProgramCard";
import CreateCard from "../components/CreateCard";
import CreateForm from "../components/CreateForm";
import { useState, useEffect } from "react";
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Programs = () => {
  const token = localStorage.getItem('token');
    
  useEffect(() => {
    const fetchProgram = async () =>{
      if(!token){
        alert("Token not found!");
        return;
      }

      try{
        const response = await axios.get('http://localhost:5000/api/program', 
          { headers: {'Authorization' : `Bearer ${token}`},
            withCredentials: true
          }
        );
        Array.isArray(response.data.programs) ? setPrograms(response.data.programs) : setPrograms([]);
      }

      catch (err){
        console.error("Error occurred when fetching program", err)
      }
    } 
    fetchProgram()

    const fetchArea = async () => {
      if(!token){
        alert("Token not found!");
        return;
      }

      try{
        const response = await axios.get('http://localhost:5000/api/area', 
          { headers: {'Authorization' : `Bearer ${token}`},
            withCredentials: true
          }
        );
        Array.isArray(response.data.areas) ? setAreas(response.data.areas) : setAreas([]);
      }

      catch (err){
        console.error("Error occurred when fetching area", err)
      }
    } 
    fetchArea()

    const fetchSubarea = async()=> {
      if(!token){
        alert("Token not found");
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/subarea',
        { headers: {'Authorization': `Bearer ${token}`},
          withCredentials: true
        }
      );
      Array.isArray(response.data.subareas ? setSubareas(response.data.subareas) : setSubareas([]))
      }
      catch (err){
        console.log("Error when fetching Subareas: ", err)
      }
    }
    fetchSubarea()

    const fetchCriteria = async()=> {
      if(!token){
        alert("Token not found")
        return
      }

      try {
        const response = await axios.get('http://localhost:5000/api/criteria',
          { headers: {'Authorization': `Bearer${token}`},
            withCredentials:true
          }
        )
        Array.isArray(response.data.criterias ? setCriterias(response.data.criterias) : setCriterias([]))
      }
      catch(err){
        console.log("Error when fetching criterias", err)
      }
    }
    fetchCriteria()

  }, [])

  {/*use state function*/}
  const [programs, setPrograms] = useState([]);
  const [areas, setAreas] = useState([]);
  const [subareas, setSubareas] = useState([]);
  const [criterias, setCriterias] = useState([]);
    
  const [showForm, setShowForm] = useState(false);
  const [activeModify, setActiveModify] = useState(null);
  const [editIndex, setEditIndex] = useState(null);

  function handleModify(mode) {
      setActiveModify((prev) => (prev === mode ? null : mode));
      if (mode !== "edit") {
        setEditIndex(null);
        setForm({ code: "", name: "", color: "", programDean: "" });
      }
  }

  function handleEditSelect(e) {
      const idx = e.target.value;
      setEditIndex(idx);
      const prog = programs[idx];
      setForm({ ...prog });
  }

  function handleDeleteSelect(e) {
      setEditIndex(e.target.value);
  }

  function handleDelete(e) {
      e.preventDefault();
      if (editIndex !== null) {
        setPrograms(programs.filter((_, idx) => idx != editIndex));
        setShowForm(false);
        setEditIndex(null);
        setActiveModify(null);
      }
  }

  const handleSubmit = (e) => {
      e.preventDefault();
      if (activeModify === "edit" && editIndex !== null) {
        // Edit mode
        const updated = [...programs];
        updated[editIndex] = { ...form };
        setPrograms(updated);
      } else {
        // Add mode
        setPrograms([
          ...programs,
          {
            code: form.code,
            name: form.name,
            color: form.color,
            programDean: form.programDean,
          },
        ]);
      }
      setShowForm(false);
      setForm({ code: "", name: "", color: "", programDean: "" });
      setEditIndex(null);
      setActiveModify(null);
  };

  const [form, setForm] = useState({
      code: "",
      name: "",
      color: "",
      programDean: "",
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

  // Clear navigation route to programs
  function backToPrograms(){
    setVisible("programs");
    setSelectedProgram(null);
    setSelectedArea(null);
    setSelectedSubarea(null);
  }

  // Created Programs Tab part 5

  return (
      <>
          <div className="flex flex-wrap mb-8 gap-5 mt-20 lg:mt-8" >

            {/* Navigation route */}
            <div className="w-full h-10 p-2 bg-gray-200 fixed lg:relative left-0 -mt-5 -mb-3 text-center">
              <p  className=" text-md lg:text-lg text-gray-700 font-semibold text-nowrap overflow-scroll scrollbar-thin overflow-y-hidden left-0 lg:relative z-20 bg-gray-250 flex items-center">
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
                        <p>{area.areaNum}:
                          <span> {area.areaName}</span>
                        </p>
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