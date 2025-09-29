import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTriangleExclamation,
    faPen,
    faPlus,
    faTrash
} from '@fortawesome/free-solid-svg-icons';
import { useMemo, useCallback, memo } from 'react';

// Memoized ActionButton component to prevent unnecessary re-renders
const ActionButton = memo(({ action, color, icon, isActive, onClick, children }) => {
  // Define color classes statically to avoid dynamic class generation
  const actionButtonStyles = {
    emerald: {
      active: "bg-emerald-600 text-white shadow-lg scale-105",
      inactive: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:scale-105 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-800/40"
    },
    amber: {
      active: "bg-amber-600 text-white shadow-lg scale-105",
      inactive: "bg-amber-100 text-amber-700 hover:bg-amber-200 hover:scale-105 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-800/40"
    },
    red: {
      active: "bg-red-600 text-white shadow-lg scale-105",
      inactive: "bg-red-100 text-red-700 hover:bg-red-200 hover:scale-105 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/40"
    }
  };

  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 min-w-[120px] justify-center
        ${isActive ? actionButtonStyles[color].active : actionButtonStyles[color].inactive}
      `}
    >
      <FontAwesomeIcon icon={icon} className="text-lg"/>
      {children}
    </button>
  );
});

// Memoized InputField component to prevent unnecessary re-renders
const InputField = memo(({ field, form, handleChange, handleFileChange, employees = [], activeModify, institutes = [] }) => {
  const baseInputClasses = "w-full px-4 py-3 text-black dark:text-white rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 dark:bg-gray-800 dark:border-gray-600 dark:focus:ring-blue-400";
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </label>

        {/* Institute-select: show institutes list */}
        {field.type === "institute-select" ? (
        <select
          name={field.name}
          className={baseInputClasses}
          value={form[field.name] || ""}
          onChange={handleChange}
          required={field.required}
        >
          <option value="" className="text-gray-500">{field.placeholder || "Select Institute"}</option>
          {institutes && institutes.map((inst) => (
            <option key={inst.instID} value={inst.instID}>{inst.instName || inst.Code}</option>
          ))}
        </select>

      ) :  field.type === "select" ? (
        <select
          name={field.name}
          className={baseInputClasses}
          value={form[field.name] || ""}
          onChange={handleChange}
          required={field.required}
        >
          <option value="">{field.placeholder || "Select user"}</option>
          {employees.map(emp => (
            // API returns employeeID and name
            <option key={emp.employeeID} value={emp.employeeID}>
              {emp.name || `${emp.fName} ${emp.lName || ''}`.trim()}
            </option>
          ))}
        </select>

      ) : field.type === "file" ? (
        <div className="space-y-2">
          <input
            type="file"
            name={field.name}
            accept={field.accept}
            onChange={handleFileChange}
            className="w-full px-4 py-3 text-black transition-colors duration-200 border-2 border-gray-300 border-dashed dark:text-white rounded-xl bg-gray-50 hover:border-blue-400 focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600"
            required={activeModify === "add"} // File required only when adding
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Accepted formats: .webp, .png, .jpeg, .jpg
          </p>
        </div>
        
      ) : field.type === "color" ? (
        <div className="flex gap-3">
          <input
            type="color"
            name={field.name}
            value={form[field.name] || "#3B82F6"}
            onChange={handleChange}
            className="w-16 h-12 border border-gray-200 rounded-lg cursor-pointer"
            required={field.required}
          />
          <input
            type="text"
            name={field.name}
            placeholder="#3B82F6"
            className={`${baseInputClasses} flex-1`}
            value={form[field.name] || ""}
            onChange={handleChange}
            required={field.required}
          />
        </div>
      ) : (
        <input
          type={field.type || "text"}
          name={field.name}
          placeholder={field.placeholder || ""}
          className={baseInputClasses}
          value={form[field.name] || ""}
          onChange={handleChange}
          required={field.required}
        />
      )}
    </div>
  );
});

export default function CreateForm({ 
  // Configuration props
  title = "Program", // "Program" or "Institute"
  fields = [], // Array of field configurations
  data = [], // Array of existing data (programs or institutes)
  employees = [], // Array of employees for dropdown
  institutes = [], // Array of institutes for dropdown
  
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
  
  // Memoize the default fields to prevent recreation on every render
  const defaultFields = useMemo(() => {
    let arr = [
      {
        name: title === "Program" ? "programCode" : "instCode",
        label: `${title} Code`,
        placeholder: `e.g. ${title === "Program" ? "BSIT" : "CCS"}`,
        type: "text",
        required: true
      },
      {
        name: title === "Program" ? "programName" : "instName", 
        label: `${title} Name`,
        placeholder: `Full ${title.toLowerCase()} name`,
        type: "text",
        required: true
      }
    ];
    // add Institute select if Program
    if (title === "Program") {
      arr.push({
        name: "instID",
        label: "Institute",
        placeholder: "Select Institute",
        type: "institute-select",
        required: true
      });
    }
    arr.push({
      name: "employeeID",
      label: title === "Program" ? "Program Dean" : "Institute Head",
      placeholder: title === "Program" ? "Select Program Dean" : "Institute Head",
      type: "select",
      required: false
    });
    arr.push({
      name: title === "Program" ? "programColor" : "instPic",
      label: title === "Program" ? `${title} Color` : `${title} Logo`,
      placeholder: title === "Program" ? `${title} Color` : `Select ${title.toLowerCase()} logo`,
      type: title === "Program" ? "color" : "file",
      accept: title === "Program" ? undefined : ".webp,.png,.jpeg,.jpg",
      required: title === "Program" ? true : activeModify === "add"
    });
    return arr;
  }, [title, activeModify]);


  // Memoize formFields to prevent recreation
  const formFields = useMemo(() => {
    return fields.length > 0 ? fields : defaultFields;
  }, [fields, defaultFields]);

  // Memoize file change handler to prevent recreation
  const handleFileChange = useCallback((e) => {
  const file = e.target.files[0];
  if (file) {
    const allowedTypes = ['.webp', '.png', '.jpeg', '.jpg'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (allowedTypes.includes(fileExtension)) {
      // Save the File object to form state
      handleChange({
      target: {
        name: 'instPic',
        value: file
      }
    });

      
    } else {
      alert('Please select a valid image file (.webp, .png, .jpeg, .jpg)');
      e.target.value = '';
    }
  }
}, [handleChange]);


  // Memoize action button handlers to prevent recreation
  const handleAddClick = useCallback(() => handleModify("add"), [handleModify]);
  const handleEditClick = useCallback(() => handleModify("edit"), [handleModify]);
  const handleDeleteClick = useCallback(() => handleModify("delete"), [handleModify]);

  // Memoize the selected item for delete confirmation
  const selectedItemForDelete = useMemo(() => {
    return editIndex !== null ? data[editIndex] : null;
  }, [editIndex, data]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full max-h-[90vh] overflow-y-auto fade-in">
        
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100 dark:border-gray-800">
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            Manage {title}s
          </h1>
          <button 
            onClick={onClose}
            className="absolute flex items-center justify-center w-8 h-8 transition-colors duration-200 bg-gray-100 rounded-full top-4 right-4 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="grid grid-cols-3 gap-3">
            <ActionButton
              action="add"
              color="emerald"
              icon={faPlus}
              isActive={activeModify === "add"}
              onClick={handleAddClick}
            >
              Add
            </ActionButton>
            <ActionButton
              action="edit"
              color="amber"
              icon={faPen}
              isActive={activeModify === "edit"}
              onClick={handleEditClick}
            >
              Edit
            </ActionButton>
            <ActionButton
              action="delete"
              color="red"
              icon={faTrash}
              isActive={activeModify === "delete"}
              onClick={handleDeleteClick}
            >
              Delete
            </ActionButton>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {/* Add Form */}
          {activeModify === "add" && (
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="mb-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full inset-shadow-sm inset-shadow-green-500 bg-emerald-100 dark:bg-emerald-900/30">
                  <FontAwesomeIcon icon={faPlus} className="text-2xl text-emerald-600 dark:text-emerald-400"/>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New {title}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Fill in the details below</p>
              </div>
              
              {formFields.map((field) => (
                <InputField 
                  key={field.name} 
                  field={field} 
                  form={form}
                  handleChange={handleChange}
                  handleFileChange={handleFileChange}
                  activeModify={activeModify}
                  employees={employees}
                  institutes={institutes}
                />
              ))}
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  className="flex-1 px-6 py-3 font-semibold text-gray-700 transition-colors duration-200 bg-gray-100 hover:bg-gray-200 rounded-xl dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300" 
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3 font-semibold text-white transition-colors duration-200 shadow-lg bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  Create {title}
                </button>
              </div>
            </form>
          )}

          {/* Edit Form */}
          {activeModify === "edit" && (
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="mb-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full inset-shadow-sm inset-shadow-amber-500 bg-amber-100 dark:bg-amber-900/30">
                  <FontAwesomeIcon icon={faPen} className="text-xl text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit {title}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Select and modify an existing {title.toLowerCase()}</p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Select {title} to Edit
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <select 
                  className="w-full px-4 py-3 transition-all duration-200 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white" 
                  value={editIndex ?? ""} 
                  onChange={onEditSelect} 
                  required
                >
                  <option value="" disabled className="text-gray-500">Choose a {title.toLowerCase()} to edit</option>
                  {data.map((item, idx) => (
                    <option value={idx} key={item.code || item.programCode}>
                      {item.code || item.programCode} - {item.name || item.programName}
                    </option>
                  ))}
                </select>
              </div>
              
              {editIndex !== null && (
                <div className="pt-4 space-y-6 border-t border-gray-100 dark:border-gray-800">
                  {formFields.map((field) => (
                    <InputField 
                      key={field.name} 
                      field={field}
                      form={form}
                      handleChange={handleChange}
                      handleFileChange={handleFileChange}
                      employees={employees}
                      institutes={institutes}
                    />
                  ))}
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  className="flex-1 px-6 py-3 font-semibold text-gray-700 transition-colors duration-200 bg-gray-100 hover:bg-gray-200 rounded-xl dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300" 
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3 font-semibold text-white transition-colors duration-200 shadow-lg bg-amber-600 hover:bg-amber-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={editIndex === null}
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* Delete Form */}
          {activeModify === "delete" && (
            <form onSubmit={onDelete} className="space-y-6">
              <div className="mb-6 text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full inset-shadow-sm inset-shadow-red-500 dark:bg-red-900/30">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-xl text-red-600 dark:text-red-400"/>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete {title}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This action cannot be undone</p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Select {title} to Delete
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <select 
                  className="w-full px-4 py-3 transition-all duration-200 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white" 
                  value={editIndex ?? ""} 
                  onChange={onDeleteSelect} 
                  required
                >
                  <option value="" disabled className="text-gray-500">Choose a {title.toLowerCase()} to delete</option>
                  {data.map((item, idx) => (
                    <option value={idx} key={item.code || item.programCode}>
                      {item.code || item.programCode} - {item.name || item.programName}
                    </option>
                  ))}
                </select>
              </div>

              {editIndex !== null && selectedItemForDelete && (
                <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-xl dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-red-500 mt-0.5">⚠</div>
                    <div>
                      <h4 className="font-semibold text-red-800 dark:text-red-300">Warning</h4>
                      <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                        You are about to permanently delete <strong>{selectedItemForDelete.programCode}</strong>. 
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  className="flex-1 px-6 py-3 font-semibold text-gray-700 transition-colors duration-200 bg-gray-100 hover:bg-gray-200 rounded-xl dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300" 
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3 font-semibold text-white transition-colors duration-200 bg-red-600 shadow-lg hover:bg-red-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={editIndex === null}
                >
                  Delete {title}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}