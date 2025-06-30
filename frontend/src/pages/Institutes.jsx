//for imports
import { useState } from "react";
import ProgramCard from "../components/ProgramCard";
import CreateCard from "../components/CreateCard";
import CreateForm from "../components/CreateForm";

const Institutes = () => {

        {/*use state function*/}
        const [institutes, setInstitutes] = useState([
          {
            code: "CCS",
            name: "College of Computing Studies",
            img: "../src/assets/instituteImage/CET-logo.webp",
            instituteHead: "John Doe",
          },
          {
            code: "CED",
            name: "College of Education",
            img: "../src/assets/instituteImage/CED-LOGO.webp",
            instituteHead: "John Joe",
          },
          {
            code: "CAS",
            name: "College of Arts and Sciences",
            img: "../src/assets/instituteImage/CAS-logo.webp",
            instituteHead: "John Boe",
          },
        ])

        //show form useState
        const [showForm, setShowForm] = useState(false);
        const [activeModify, setActiveModify] = useState(null);
        const [editIndex, setEditIndex] = useState(null);

        function handleModify(mode) {
          setActiveModify((prev) => (prev === mode ? null : mode));
          if (mode !== "edit") {
            setEditIndex(null);
            setForm({ code: "", name: "", img: "", instituteHead: "" });
          }
        }

        function handleEditSelect(e) {
          const idx = e.target.value;
          setEditIndex(idx);
          const institute = institutes[idx];
          setForm({ ...institute });
        }

        function handleDeleteSelect(e) {
          setEditIndex(e.target.value);
        }

        function handleDelete(e) {
          e.preventDefault();
          if (editIndex !== null) {
            setInstitutes(institutes.filter((_, idx) => idx != editIndex));
            setShowForm(false);
            setEditIndex(null);
            setActiveModify(null);
          }
        }

        const handleSubmit = (e) => {
          e.preventDefault();
          if (activeModify === "edit" && editIndex !== null) {
            // Edit mode
            const updated = [...institutes];
            updated[editIndex] = { ...form };
            setInstitutes(updated);
          } else {
            // Add mode
            setInstitutes([
              ...institutes,
              {
                code: form.code,
                name: form.name,
                img: form.img,
                instituteHead: form.instituteHead,
              },
            ]);
          }
          setShowForm(false);
          setForm({ code: "", name: "", img: "", instituteHead: "" });
          setEditIndex(null);
          setActiveModify(null);
        };

        const [form, setForm] = useState({
          code: "",
          name: "",
          img: "",
          instituteHead: "",
        });

        const handleChange = (e) => {
          setForm({...form, [e.target.name]: e.target.value});
        };
        
    return(
        <main  className="flex-1 h-full col-span-4 col-start-2 row-span-4 row-start-2 p-4 overflow-y-auto">
            <div className="p-6 border border-neutral-800 rounded-xl dark:inset-shadow-sm dark:inset-shadow-zuccini-800 dark:bg-[#19181A]">
                <div className="flex flex-wrap gap-16 mb-8">
                  <CreateCard setShowForm={setShowForm}/>
                {institutes.map(institute => (
                    <ProgramCard program={institute} key={institute.code}/>
                ))}
                </div>

                {/*Form*/}
                {showForm && 
                <CreateForm 
                  title="Institute"
                  data={institutes}
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
        </main>

    )
};

export default Institutes;  