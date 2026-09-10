document.addEventListener("DOMContentLoaded", () => {
    const apiUrl = "https://fedskillstest.coalitiontechnologies.workers.dev";
    const authHeader = {
        "Authorization": "Basic " + btoa("coalition:skills-test")
    };

    fetch(apiUrl, { headers: authHeader })
        .then(response => response.json())
        .then(data => {
            const jessica = data.find(patient => patient.name === "Jessica Taylor");
            
            if (jessica) {
                populatePatientProfile(jessica);
                populateDiagnosisHistory(jessica.diagnosis_history);
                populateDiagnosticList(jessica.diagnostic_list);
                setupInteractiveButtons();
            }
        })
        .catch(error => console.error("Error fetching patient data:", error));
});

function populatePatientProfile(patient) {
    document.getElementById("patient-avatar").src = patient.profile_picture;
    document.getElementById("patient-name").innerText = patient.name;
    document.getElementById("patient-dob").innerText = patient.date_of_birth;
    document.getElementById("patient-gender").innerText = patient.gender;
    document.getElementById("patient-phone").innerText = patient.phone_number;
    document.getElementById("patient-emergency").innerText = patient.emergency_contact;
    document.getElementById("patient-insurance").innerText = patient.insurance_type;
}

let bpChart = null;

function populateDiagnosisHistory(history) {
    const ctx = document.getElementById("bpChart").getContext("2d");
    
    const labels = history.slice(0, 6).map(item => `${item.month}, ${item.year}`).reverse();
    const systolicData = history.slice(0, 6).map(item => item.blood_pressure.systolic.value).reverse();
    const diastolicData = history.slice(0, 6).map(item => item.blood_pressure.diastolic.value).reverse();

    bpChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Systolic',
                    data: systolicData,
                    borderColor: '#E66FD2',
                    backgroundColor: '#E66FD2',
                    tension: 0.4
                },
                {
                    label: 'Diastolic',
                    data: diastolicData,
                    borderColor: '#8C6FE6',
                    backgroundColor: '#8C6FE6',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });

    const historyListContainer = document.getElementById("diagnosis-history-list");
    historyListContainer.innerHTML = "";

    history.forEach((item) => {
        const row = document.createElement("div");
        row.className = "p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition flex justify-between items-center";
        row.innerHTML = `
            <div>
                <p class="font-bold text-sm text-gray-800">${item.month}, ${item.year}</p>
                <p class="text-xs text-gray-500">Systolic: ${item.blood_pressure.systolic.value} | Diastolic: ${item.blood_pressure.diastolic.value}</p>
            </div>
            <span class="text-xs text-teal-600 font-semibold bg-teal-50 px-2 py-1 rounded">View</span>
        `;

        row.addEventListener("click", () => {
            updateChartValues(item);
        });

        historyListContainer.appendChild(row);
    });
}

function updateChartValues(record) {
    if (bpChart) {
        bpChart.data.labels = [`${record.month}, ${record.year}`];
        bpChart.data.datasets[0].data = [record.blood_pressure.systolic.value];
        bpChart.data.datasets[1].data = [record.blood_pressure.diastolic.value];
        bpChart.update();
    }
}

function populateDiagnosticList(diagnostics) {
    const tableBody = document.getElementById("diagnostic-table-body");
    tableBody.innerHTML = "";

    diagnostics.forEach(diag => {
        const tr = document.createElement("tr");
        tr.className = "border-b hover:bg-gray-50";
        tr.innerHTML = `
            <td class="py-3 px-4 text-sm text-gray-800 font-medium">${diag.problem}</td>
            <td class="py-3 px-4 text-sm text-gray-600">${diag.description}</td>
            <td class="py-3 px-4 text-sm text-gray-800">${diag.status}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function setupInteractiveButtons() {
    const actionBtn = document.getElementById("show-all-info-btn");
    if (actionBtn) {
        actionBtn.addEventListener("click", () => {
            alert("All patient historical information and reports loaded successfully.");
        });
    }
}