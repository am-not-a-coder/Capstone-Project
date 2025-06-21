//for imports
import { useState } from "react";

const Institutes = () => {

        {/*use state function*/}
        const [institutes, setinstitutes] = useState([
          {
            code: "CCS",
            name: "College of Computing Studies",
            img: "#FFA500",
            instituteDean: "John Doe",
          },
          {
            code: "CED",
            name: "College of Education",
            img: "#FF0000",
            instituteDean: "John Joe",
          },
          {
            code: "CAS",
            name: "College of Arts and Sciences",
            img: "#FFFF00",
            instituteDean: "John Boe",
          },

        ])
        
    return(
        <main  className="flex-1 p-4 h-full col-span-4 row-span-4 col-start-2 row-start-2 overflow-y-auto">
            
        </main>
    )
};

export default Institutes;