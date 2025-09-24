//for imports
import { useState, useEffect } from "react";
import ProgramCard from "../components/ProgramCard";
import CreateCard from "../components/CreateCard";
import CreateForm from "../components/CreateForm";
import CollegeInfoModal from "../components/modals/CollegeInfoModal";
import { apiGet, apiPut, apiDelete, apiPostForm, apiGetBlob } from "../utils/api_utils";
import StatusModal from "../components/modals/StatusModal";
import { CardSkeleton } from "../components/Skeletons";

const Institutes = () => {

        // State for institutes data
        const [institutes, setInstitutes] = useState([]);
        const [loading, setLoading] = useState(true);        
        
        const [showStatusModal, setShowStatusModal] = useState(false); // shows the status modal
        const [statusMessage, setStatusMessage] = useState(null); // status message
        const [statusType, setStatusType] = useState("success"); // status type (success/error)


        const [employees, setEmployees] = useState([]);

        
        // Fetch institutes
               
          const fetchInstitutes = async () => {
            setLoading(true);            

            try {
              console.log("Fetching institutes...");
              const response = await apiGet('/api/institute');

              if (response.success && response.data.institutes) {

                const instituteData = response.data.institutes || response.data.programs || [];                            
                
                // inside fetchInstitutes
              if (Array.isArray(instituteData)) {
                  const mappedInstitutes = await Promise.all(
                    instituteData.map(async (inst) => {
                      try {
                        const logoBlobRes = await apiGetBlob(`/api/institute/logos/${inst.instCode}`);
                          let logoUrl = "../assets/UDM-logo.png";
                          if (logoBlobRes.success && logoBlobRes.data instanceof Blob) {
                            logoUrl = URL.createObjectURL(logoBlobRes.data);
                          }
                        return {
                          code: inst.instCode,
                          name: inst.instName,
                          img: logoUrl,
                          instituteHead: inst.instDean,
                          instID: inst.instID,
                          employeeID: inst.employeeID
                        };
                        
                      } catch (err) {
                        console.warn(`Failed to fetch logo for ${inst.instCode}`, err);                        
                      }
                    })
                  );

                  setInstitutes(mappedInstitutes);
                }
                
              } else {
              console.error(response.error || "Failed to fetch institutes.");
            }
          } catch (err) {
            console.error("Server error. Please try again.", err);
          } finally {
            setLoading(false);
          }
        };
        
        useEffect(() => {   
         fetchInstitutes();
        }, []);

        
        //Fetch users
        useEffect(() => {
          const fetchEmployees = async () => {
            try{
              const res = await apiGet('/api/users')

              Array.isArray(res.data.users) ? setEmployees(res.data.users) : setEmployees([]);
              
            } catch(err) {
              console.error("Failed to fetch users", err)
            }
          }
          fetchEmployees();
        }, [])


        // Function to handle create institute
        const handleCreateInstitute = async (e) => {
          e.preventDefault();

          if (!(form.instPic instanceof File)) {
            setShowStatusModal(true);
            setStatusMessage("Please upload a logo before submitting.");
            setStatusType("error");
            return;
          }
          const formData = new FormData();
          formData.append("instCode", form.instCode);
          formData.append("instName", form.instName);
          formData.append("employeeID", form.employeeID);
          formData.append("instPic", form.instPic);
          
          console.log("Submitting Form: ", form)
          try {
            const response = await apiPostForm('/api/institutes', formData);

            setShowStatusModal(true);
            setStatusMessage(response.data.message);
            setStatusType("success");

            // Reset form + reload
            setShowForm(false);
            setForm({ code: "", name: "", img: "", instituteHead: "" });
            setActiveModify(null);

            fetchInstitutes();
          } catch (err) {
            console.error("Error creating institute.", err);
            setShowStatusModal(true);
            setStatusMessage("Failed to create institute");
            setStatusType("error");
          }
        };


        // Function to handle edit institute
        const handleEditInstitute = async (e) => {
          e.preventDefault();

          const instituteToEdit = institutes[editIndex];

          // Data to send
          const instituteData = {            
            instCode: form.code,
            instName: form.name,
            instPic: form.img,
            employeeID: form.instituteHead
          };

          try {
            // Send PUT request
            const response = await apiPut(`/api/institute/${instituteToEdit.instID}`, instituteData);

            if (response.success) {
              // Refetch data              
              setShowForm(false);
              setForm({ code: "", name: "", img: "", instituteHead: ""});
              setEditIndex(null);
              setActiveModify(null);
              alert("Institute updated successfully!");
            } else {
              alert(response.error || "Failed to update institute.");
            }
          } catch (err) {
            console.error("Error updating institute.", err);
            alert("Server error. Please try again.");
          }
        };

        // Function to delete an institute
        const handleDelete = async (e) => {
          e.preventDefault();

          if (editIndex === null) return;

          const instituteToDelete = institutes[editIndex];

          try {
            // Send DELETE request
            const response = await apiDelete(`/api/institute/${instituteToDelete.instID}`);

            if (response.success) {
              // Refetch data
              await fetchInstitutes();
              setShowForm(false);
              setEditIndex(null);
              setActiveModify(null);
              alert("institute deleted successfully!"); 
            } else {
              alert(response.error || "Failed to delete institute.");
            }
          } catch (err) {
            console.error("Error Deleting institute.", err);
            alert("Server error. Please try again.");
          }
        };

        // State for Modal
        const [showCollegeModal, setShowCollegeModal] = useState(false);

        // Selected college state 
        const [selectedCollege, setSelectedCollege] = useState(null);

        // Funtion to handle when college card is clicked
        const handleCollegeClick = (college) => {
          setSelectedCollege(college);
          setShowCollegeModal(true);
        }

        // funtion to close modal
        const handleCloseModal = () => {
          setShowCollegeModal(false);
          setSelectedCollege(null);
        }

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
          setForm({
            code: institute.code,
            name: institute.name,
            img: institute.img,
            instituteHead: institute.employeeID || institute.instituteHead
          });
          // setForm({ ...institute });
        }

        function handleDeleteSelect(e) {
          setEditIndex(e.target.value);
        }

        // function handleDelete(e) {
        //   e.preventDefault();
        //   if (editIndex !== null) {
        //     setInstitutes(institutes.filter((_, idx) => idx != editIndex));
        //     setShowForm(false);
        //     setEditIndex(null);
        //     setActiveModify(null);
        //   }
        // }

        const handleSubmit = (e) => {
          e.preventDefault();
          if (activeModify === "edit" && editIndex !== null) {
            // Edit mode
            handleEditInstitute(e);
            // const updated = [...institutes];
            // updated[editIndex] = { ...form };
            // setInstitutes(updated);
          } else {
            // Add mode
            handleCreateInstitute(e);
            // setInstitutes([
            //   ...institutes,
            //   {
            //     code: form.code,
            //     name: form.name,
            //     img: form.img,
            //     instituteHead: form.instituteHead,
            //   },
            // ]);
          }
          // setShowForm(false);
          // setForm({ code: "", name: "", img: "", instituteHead: "" });
          // setEditIndex(null);
          // setActiveModify(null);
        };

        const [form, setForm] = useState({
          instCode: "",
          instName: "",
          instPic: "",
          employeeID: "",
        });

        const handleChange = (e) => {
          setForm({ ...form, [e.target.name]: e.target.value });
        };
        
    return(
        <>
        {showStatusModal && (
            <StatusModal message={statusMessage} type={statusType} showModal={showStatusModal} onClick={()=>setShowStatusModal(false)} />
        )}
            <div className="min-h-screen p-3 border rounded-[20px] border-neutral-300 dark:bg-gray-900 inset-shadow-sm inset-shadow-gray-400 dark:shadow-md dark:shadow-zuccini-800">

              
             
                {/* Main Content */}
              <div className="flex flex-wrap gap-5 mt-20 mb-8 lg:mt-8" >
                <CreateCard setShowForm={setShowForm}/>

                {/* Loading  */}
                 {loading ? (
                    <>
                      <CardSkeleton />
                      <CardSkeleton />
                      <CardSkeleton />
                    </>
                  ) : (
                    <>                    
                      {institutes.map(institute => (
                        <ProgramCard 
                          program={institute} 
                          key={institute.instID}
                          onClick={() => handleCollegeClick(institute)}
                        />
                      ))}
                    </> 
                  )}
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
                employees={employees}
              />}

              <CollegeInfoModal
                college={selectedCollege}
                isOpen={showCollegeModal}
                onClose={handleCloseModal}
              />
          </div>
        </>

    )
};

export default Institutes;  