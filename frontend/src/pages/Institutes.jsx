//for imports
import { useState } from "react";
import ProgramCard from "../components/ProgramCard";
import CreateCard from "../components/CreateCard";
import CreateForm from "../components/CreateForm";
import { adminHelper } from '../utils/auth_utils';

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
        const isAdmin = adminHelper()

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
        <>
             <div className="min-h-screen p-3 border rounded-[20px] border-neutral-300 dark:bg-gray-900 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-800">
                <div className="flex flex-wrap gap-5 mt-20 mb-8 lg:mt-8" >
                    { isAdmin && (<CreateCard setShowForm={setShowForm}/>)}
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
        </>

    )
};

export default Institutes;  