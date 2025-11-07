import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale,LinearScale, Title,Tooltip, Legend)

const SimilarityChart = ({ similarDocs }) => {

    const data = {
        labels: similarDocs.map((doc) => doc.docName),
        datasets: [
            {
                label: "Similarity Score",
                data: similarDocs.map((doc) => (doc.similarity * 100).toFixed(1)),
                backgroundColor: "rgba(54, 162, 235, 0.6)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1,
                borderRadius: 3,
            }
        ]
    };

    const options = {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,  
        plugins: {
            legend: {display: false},
            title: {
                display: true,
                text: "Top Similar Documents",
                font: { size: 16, weight: "bold"},
            },
            tooltip:{
                callbacks: {
                    label: (context) => `${context.parsed.x.toFixed(1)}% similarity`,
                },
            },
        },
        scales: {
            x: {
                min: 0,
                max: 100,
                ticks: {
                    callback: (value) => `${value}%`,
                },
            },
            y: {
                ticks: {
                    autoSkip: false,
                }
            }
        },
    };

    return (
        <div className="h-[150px]">
            <Bar data={data} options={options} /> 
        </div>
    )
};

export default SimilarityChart;