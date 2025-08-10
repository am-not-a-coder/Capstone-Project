import { useState } from "react";

export default function CreateForm({ 
  // Configuration props
  title = "Program", // "Program" or "Institute"
  fields = [], // Array of field configurations
  data = [], // Array of existing data (programs or institutes)
  employees = [], // Array of employees for dropdown
  
  // Event handlers
  onSubmit,
  onClose,
  onEditSelect,
  onDeleteSelect,
  onDelete,
  
  // State from parent
  activeModify,
  editIndex,
  form,
  handleChange,
  handleModify
}) {
  
  // Default field configuration for Programs
  const defaultFields = [
    {
      name: "programCode",
      label: `${title} Code`,
      placeholder: `e.g. ${title === "Program" ? "BSIT" : "CCS"}`,
      type: "text",
      required: true
    },
    {
      name: "programName", 
      label: `${title} Name`,
      placeholder: `Full ${title.toLowerCase()} name`,
      type: "text",
      required: true
    },
    {
      name: title === "Program" ? "employeeID" : "instituteHead",
      label: title === "Program" ? "Program Dean" : "Institute Head",
      placeholder: title === "Program" ? "Select Program Dean" : "Institute Head",
      type: title === "Program" ? "select" : "text",
      required: false
    },
    {
      name: title === "Program" ? "programColor" : "img",
      label: title === "Program" ? `${title} Color` : `${title} Logo`,
      placeholder: title === "Program" ? `${title} Color` : `Select ${title.toLowerCase()} logo`,
      type: title === "Program" ? "color" : "file",
      accept: title === "Program" ? undefined : ".webp,.png,.jpeg,.jpg",
      required: true
    }
  ];

  // Use provided fields or default fields
  const formFields = fields.length > 0 ? fields : defaultFields;

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['.webp', '.png', '.jpeg', '.jpg'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (allowedTypes.includes(fileExtension)) {
        // Create a URL for the selected file
        const fileUrl = URL.createObjectURL(file);
        handleChange({
          target: {
            name: 'img',
            value: fileUrl
          }
        });
      } else {
        alert('Please select a valid image file (.webp, .png, .jpeg, .jpg)');
        e.target.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 text-black">
      <div className="bg-white p-8 rounded-lg shadow-lg min-w-[400px] flex flex-col items-center">
        <div className="flex gap-4 mb-4  w-full justify-center">
          <button onClick={() => handleModify("add")}
            className={`px-4 py-2 rounded font-semibold transition text-white ${activeModify === "add" ? "bg-green-700" : "bg-green-500 hover:bg-green-600"}`}>
            Add {title}
          </button>
          <button onClick={() => handleModify("edit")}
            className={`px-4 py-2 rounded font-semibold transition text-white ${activeModify === "edit" ? "bg-yellow-700" : "bg-yellow-500 hover:bg-yellow-600"}`}>
            Edit {title}
          </button>
          <button onClick={() => handleModify("delete")}
            className={`px-4 py-2 rounded font-semibold transition text-white ${activeModify === "delete" ? "bg-red-700" : "bg-red-500 hover:bg-red-600"}`}>
            Delete {title}
          </button>
        </div>

        {/* Add Form */}
        {activeModify === "add" && (
          <form onSubmit={onSubmit} className="bg-white p-6 rounded-lg shadow-lg flex flex-col gap-4 min-w-[350px] w-full">
            <h2 className="text-lg font-bold mb-2">Add New {title}</h2>
            {formFields.map((field) => (
              <div key={field.name}>
                {field.type === "select" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                    </label>
                    <select
                      name={field.name}
                      className="border rounded p-2 w-full"
                      value={form[field.name] || ""}
                      onChange={handleChange}
                      required={field.required}
                    >
                      <option value="">{field.placeholder}</option>
                      {employees.map((employee) => (
                        <option key={employee.employeeID} value={employee.employeeID}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : field.type === "file" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      accept={field.accept}
                      onChange={handleFileChange}
                      className="border rounded p-2 w-full"
                      required={field.required}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted formats: .webp, .png, .jpeg, .jpg
                    </p>
                  </div>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    className="border rounded p-2 w-full"
                    value={form[field.name] || ""}
                    onChange={handleChange}
                    required={field.required}
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-4 py-2 rounded bg-gray-300" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded bg-blue-500 text-white">
                Submit
              </button>
            </div>
          </form>
        )}

        {/* Edit Form */}
        {activeModify === "edit" && (
          <form onSubmit={onSubmit} className="bg-white p-6 rounded-lg shadow-lg flex flex-col gap-4 min-w-[350px] w-full">
            <h2 className="text-lg font-bold mb-2">Edit {title}</h2>
            <select className="border rounded p-2" value={editIndex ?? ""} onChange={onEditSelect} required>
              <option value="" disabled>Select a {title.toLowerCase()} to edit</option>
              {data.map((item, idx) => (
                <option value={idx} key={item.programCode}>{item.programCode} - {item.programName}</option>
              ))}
            </select>
            {editIndex !== null && (
              <>
                {formFields.map((field) => (
                  <div key={field.name}>
                    {field.type === "select" ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                        </label>
                        <select
                          name={field.name}
                          className="border rounded p-2 w-full"
                          value={form[field.name] || ""}
                          onChange={handleChange}
                          required={field.required}
                        >
                          <option value="">{field.placeholder}</option>
                          {employees.map((employee) => (
                            <option key={employee.employeeID} value={employee.employeeID}>
                              {employee.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : field.type === "file" ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          name={field.name}
                          accept={field.accept}
                          onChange={handleFileChange}
                          className="border rounded p-2 w-full"
                          required={field.required}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Accepted formats: .webp, .png, .jpeg, .jpg
                        </p>
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        placeholder={field.placeholder}
                        className="border rounded p-2 w-full"
                        value={form[field.name] || ""}
                        onChange={handleChange}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </>
            )}
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-4 py-2 rounded bg-gray-300" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded bg-blue-500 text-white" disabled={editIndex === null}>
                Save
              </button>
            </div>
          </form>
        )}

        {/* Delete Form */}
        {activeModify === "delete" && (
          <form onSubmit={onDelete} className="bg-white p-6 rounded-lg shadow-lg flex flex-col gap-4 min-w-[350px] w-full">
            <h2 className="text-lg font-bold mb-2">Delete {title}</h2>
            <select className="border rounded p-2" value={editIndex ?? ""} onChange={onDeleteSelect} required>
              <option value="" disabled>Select a {title.toLowerCase()} to delete</option>
              {data.map((item, idx) => (
                <option value={idx} key={item.programCode}>{item.programCode} - {item.programName}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-4 py-2 rounded bg-gray-300" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded bg-red-500 text-white" disabled={editIndex === null}>
                Delete
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}