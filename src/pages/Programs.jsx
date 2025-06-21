//for imports
import ProgramCard from "../components/ProgramCard";
import CreateCard from "../components/CreateCard";
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
            <CreateCard setShowForm={setShowForm}/>
            {/*Program Cards Row */}
            {programs.map(program=> (
              <ProgramCard program={program} key={program.code}/>
            ))}

            {/*Form*/}
            {showForm &&(
              
              <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 text-black">
                <div className="bg-white p-8 rounded-lg shadow-lg min-w-[400px] flex flex-col items-center">
                  <div className="flex gap-4 mb-4 w-full justify-center">
                    <button onClick={() => handleModify("add")}
                      className={`px-4 py-2 rounded font-semibold transition text-white ${activeModify === "add" ? "bg-green-700" : "bg-green-500 hover:bg-green-600"}`}>Add Program</button>
                    <button onClick={() => handleModify("edit")}
                      className={`px-4 py-2 rounded font-semibold transition text-white ${activeModify === "edit" ? "bg-yellow-700" : "bg-yellow-500 hover:bg-yellow-600"}`}>Edit Program</button>
                    <button onClick={() => handleModify("delete")}
                      className={`px-4 py-2 rounded font-semibold transition text-white ${activeModify === "delete" ? "bg-red-700" : "bg-red-500 hover:bg-red-600"}`}>Delete Program</button>
                  </div>
                  {/* Add Program Form */}
                  {activeModify === "add" && (
                    <form 
                      onSubmit={handleSubmit} 
                      className="bg-white p-6 rounded-lg shadow-lg flex flex-col gap-4 min-w-[350px] w-full">
                      <h2 className="text-lg font-bold mb-2">Add New Program</h2>
                      <input 
                        type="text" name="code" 
                        placeholder="Program Name (e.g. BSIT)" 
                        className="border rounded p-2" 
                        value={form.code} 
                        onChange={handleChange} 
                        required
                      />
                      <input
                        type="text"
                        name="name"
                        placeholder="Program Full Name"
                        className="border rounded p-2"
                        value={form.name}
                        onChange={handleChange}
                        required
                      />
                      <input
                        type="text"
                        name="programDean"
                        placeholder="Program Dean"
                        className="border rounded p-2"
                        value={form.programDean}
                        onChange={handleChange}
                        required
                      />
                      <input
                        type="color"
                        name="color"
                        placeholder="Program Color"
                        className="border rounded p-2 w-full"
                        value={form.color}
                        onChange={handleChange}
                        required
                      />
                      <div className="flex gap-2 justify-end">
                        <button type="button" className="px-4 py-2 rounded bg-gray-300" onClick={() => setShowForm(false)}>Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded bg-blue-500 text-white">Submit</button>
                      </div>
                    </form>
                  )}
                  {/* Edit Program Form */}
                  {activeModify === "edit" && (
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg flex flex-col gap-4 min-w-[350px] w-full">
                      <h2 className="text-lg font-bold mb-2">Edit Program</h2>
                      <select className="border rounded p-2" value={editIndex ?? ""} onChange={handleEditSelect} required>
                        <option value="" disabled>Select a program to edit</option>
                        {programs.map((p, idx) => (
                          <option value={idx} key={p.code}>{p.code} - {p.name}</option>
                        ))}
                      </select>
                      {editIndex !== null && (
                        <>
                          <input
                            type="text"
                            name="code"
                            placeholder="Program Name (e.g. BSIT)"
                            className="border rounded p-2"
                            value={form.code}
                            onChange={handleChange}
                            required
                          />
                          <input
                            type="text"
                            name="name"
                            placeholder="Program Full Name"
                            className="border rounded p-2"
                            value={form.name}
                            onChange={handleChange}
                            required
                          />
                          <input
                            type="text"
                            name="programDean"
                            placeholder="Program Dean"
                            className="border rounded p-2"
                            value={form.programDean}
                            onChange={handleChange}
                            required
                          />
                          <input
                            type="color"
                            name="color"
                            placeholder="Program Color"
                            className="border rounded p-2 w-full"
                            value={form.color}
                            onChange={handleChange}
                            required
                          />
                        </>
                      )}
                      <div className="flex gap-2 justify-end">
                        <button type="button" className="px-4 py-2 rounded bg-gray-300" onClick={() => setShowForm(false)}>Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded bg-blue-500 text-white" disabled={editIndex === null}>Save</button>
                      </div>
                    </form>
                  )}
                  {/* Delete Program Form */}
                  {activeModify === "delete" && (
                    <form onSubmit={handleDelete} className="bg-white p-6 rounded-lg shadow-lg flex flex-col gap-4 min-w-[350px] w-full">
                      <h2 className="text-lg font-bold mb-2">Delete Program</h2>
                      <select className="border rounded p-2" value={editIndex ?? ""} onChange={handleDeleteSelect} required>
                        <option value="" disabled>Select a program to delete</option>
                        {programs.map((p, idx) => (
                          <option value={idx} key={p.code}>{p.code} - {p.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2 justify-end">
                        <button type="button" className="px-4 py-2 rounded bg-gray-300" onClick={() => setShowForm(false)}>Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded bg-red-500 text-white" disabled={editIndex === null}>Delete</button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  };

export default Programs;