//for imports
import ProgramCard from "../components/ProgramCard";
import CreateCard from "../components/CreateCard";
import CreateForm from "../components/CreateForm";
import { useState } from "react";


  const Programs = () => {

    {/*use state function*/}
    const [programs, setPrograms] = useState([
      {
        code: "BSIT",
        name: "Bachelor of Science in Information Technology",
        color: "#FFA500",
        programDean: "John Doe",
      },
      {
        code: "BSCrim",
        name: "Bachelor of Science in Criminology",
        color: "#FF0000",
        programDean: "John Joe",
      },
      {
        code: "BSN",
        name: "Bachelor of Science in Nursing",
        color: "#FFFF00",
        programDean: "John Boe",
      },
      {
        code: "CBA",
        name: "Bachelor of Science in Education",
        color: "#008000",
        programDean: "John Coe",
      },
      
    ])


    
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
      <main className="flex-1 p-4 h-full col-span-4 row-span-4 col-start-2 row-start-2 overflow-y-auto">
        <div className="border rounded-lg p-6 bg-white">
          <div className="flex flex-wrap gap-15 mb-8">

            {/* Create Card */} 
            <button className="w-full sm:w-1/2 md:w-1/3 lg:w-1/5 h-48 bg-gray-500 rounded-lg flex items-center justify-center text-4xl text-white cursor-pointer
            " onClick={() => setShowForm(true)}>
              +
            </button>

            {/* Create Card */}
            <CreateCard setShowForm={setShowForm}/>
              
            {/*Program Cards Row */}
            {programs.map(program=> (
              <ProgramCard program={program} key={program.code}/>
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