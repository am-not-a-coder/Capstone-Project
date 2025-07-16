//for imports
import ProgramCard from "../components/ProgramCard";
import CreateCard from "../components/CreateCard";
import CreateForm from "../components/CreateForm";
import { useState, useEffect } from "react";


  const Programs = () => {
    
    useEffect(() => {
      const fetchProgram = async () =>{
        const token = localStorage.getItem('token');

        if(!token){
          alert("Token not found!");
                return;
            }
      
      try{
         const response = await axios.get('http://localhost:5000/api/program', 
          {headers: {'Authorization' : `Bearer ${token}`}},
          {withCredentials: true});

          

      } catch (err){

      }
      }

    }, []);

    {/*use state function*/}
    const [programs, setPrograms] = useState(
    //   [
    //   {
    //     code: "BSIT",
    //     name: "Bachelor of Science in Information Technology",
    //     color: "#FFA500",
    //     programDean: "John Doe",
    //   },
    //   {
    //     code: "BSCrim",
    //     name: "Bachelor of Science in Criminology",
    //     color: "#FF0000",
    //     programDean: "John Joe",
    //   },
    //   {
    //     code: "BSN",
    //     name: "Bachelor of Science in Nursing",
    //     color: "#FFFF00",
    //     programDean: "John Boe",
    //   },
    //   {
    //     code: "CBA",
    //     name: "Bachelor of Science in Education",
    //     color: "#008000",
    //     programDean: "John Coe",
    //   },
    // ]
  )


    
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

    return (
      <main className="flex-1 h-full col-span-4 col-start-2 row-span-4 row-start-2 p-4 overflow-y-auto">
        <div className="p-6 border rounded-xl border-neutral-800 dark:bg-[#19181A] dark:inset-shadow-sm dark:inset-shadow-zuccini-800">
          <div className="flex flex-wrap mb-8 gap-15">

            {/* Create Card */} 
            <button className="flex items-center justify-center w-full text-4xl text-white bg-gray-500 rounded-lg cursor-pointer min-h-48 sm:w-1/2 md:w-1/3 lg:w-1/5 " onClick={() => setShowForm(true)}>
              +
            </button>

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
      </main>
    );
  };

export default Programs;