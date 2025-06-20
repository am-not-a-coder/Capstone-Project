//for imports
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
    const [form, setForm] = useState({
      code: "",
      name: "",
      color: "",
      programDean: "",
    });

    const handleChange = (e) => {
      setForm({...form, [e.target.name]: e.target.value});
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      setPrograms([...programs, 
        {
          code: form.code,
          name: form.name,
          color: form.color,
          programDean: form.programDean,
        }
      ])
      console.log(form.color);
      setShowForm(false);
      setForm({code: "", name: "", programDean: ""});

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
            {/*Program Cards Row */}
            {programs.map((program) => (
              <div
                key={program.code}
                className="w-full sm:w-1/2 md:w-1/3 lg:w-1/5 h-48 bg-white rounded-lg shadow flex flex-col overflow-hidden"
              >
                <div className="h-2/5" style={{backgroundColor: program.color}}></div>
                <div className="flex-1 flex flex-col justify-between p-2">
                  <div>
                    <div className="font-semibold text-black text-lg">{program.code}</div>
                    <div className="text-xs text-gray-500 mb-5">{program.name}</div>
                    <div className="text-lg text-gray-500 ">Facilitator: {program.programDean}</div>
                  </div>
                </div>
              </div>
            ))}

            {/*Form*/}
            {showForm &&(
              <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 text-black">
                <form 
                  onSubmit={handleSubmit} 
                  className="bg-white p-6
                  rounded-lg 
                  shadow-lg flex
                  flex-col gap-4 
                  min-w-[300px]">
                  
                  <h2 className="text-lg 
                  font-bold 
                  mb-2">Add New Program</h2>

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
              </div>
            )}
          </div>
        </div>
      </main>
    );
  };

export default Programs;