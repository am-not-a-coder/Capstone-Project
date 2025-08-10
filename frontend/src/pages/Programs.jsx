//for imports
import ProgramCard from "../components/ProgramCard";
import CreateCard from "../components/CreateCard";
import CreateForm from "../components/CreateForm";
import { useState, useEffect } from "react";
import axios from 'axios';


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
          {headers: {'Authorization' : `Bearer ${token}`}},
          {withCredentials: true});

          Array.isArray(response.data.programs) ? setPrograms(response.data.programs) : setPrograms([]);
          console.log(response.data.programs)

      } catch (err){
        console.error("Error occurred when fetching programs", err)

      }
    }
      fetchProgram()
    }, []);

    useEffect(() => {
      const fetchEmployees = async () => {
        if (!token) {
          return;
        }
        try {
          const response = await axios.get('http://localhost:5000/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          Array.isArray(response.data.users) ? setEmployees(response.data.users) : setEmployees([]);
        } catch (err) {
          console.error("Error fetching employees", err);
        }
      };
      fetchEmployees();
    }, [token]);

    {/*use state function*/}
    const [programs, setPrograms] = useState([]);
    const [employees, setEmployees] = useState([]);
    
    const [showForm, setShowForm] = useState(false);
    const [activeModify, setActiveModify] = useState(null);
    const [editIndex, setEditIndex] = useState(null);



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
          await axios.delete(`http://localhost:5000/api/program/${programToDelete.programID}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
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
          const response = await axios.put(`
            http://localhost:5000/api/program/${programs[editIndex].programID}`, form,
            { headers: {'Authorization': `Bearer ${token}`}}
          )
          //update localstate with response
          const updated = [...programs];
          updated[editIndex] = response.data.updated_program
          setPrograms(updated)

        } else {
          // Add mode
          const response = await axios.post('http://localhost:5000/api/program', form,
            { headers: {'Authorization': `Bearer ${token}`} }
          );
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

    return (
      <>
        <div className="p-6 border rounded-xl border-neutral-800 dark:bg-[#19181A] dark:inset-shadow-sm dark:inset-shadow-zuccini-800">
          <div className="flex flex-wrap mb-8 gap-15">
            {/* Create Card */}
            <CreateCard setShowForm={setShowForm}/>
              
            {/*Program Cards Row */}
            {programs.map(program=> (
              <ProgramCard program={program} key={program.programID}/>
            ))}

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
        </div>
      </>
    );
  };

export default Programs;