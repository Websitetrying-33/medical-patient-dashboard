let globalPatientsData = [];
let bpChart = null;
let currentActiveChatPatient = null;

// Mock database para sa Schedule at Transactions
let scheduleData = [
    { id: 1, patient: "Jessica Taylor", type: "Routine Consultation", date: "Oct 12, 2026 - 10:00 AM", status: "Confirmed" },
    { id: 2, patient: "Ryan Johnson", type: "Follow-up Checkup", date: "Oct 14, 2026 - 02:30 PM", status: "Pending" },
    { id: 3, patient: "Brandon Kelly", type: "Cardiology Screening", date: "Oct 15, 2026 - 09:15 AM", status: "Confirmed" }
];

let transactionsData = [
    { id: "INV-2026-089", patient: "Jessica Taylor", desc: "General Consultation & BP Monitoring", status: "Paid", amount: "₱1,500.00" },
    { id: "INV-2026-090", patient: "Ryan Johnson", desc: "Follow-up Lab Review", status: "Pending", amount: "₱800.00" },
    { id: "INV-2026-091", patient: "Brandon Kelly", desc: "ECG Diagnostic Screening", status: "Paid", amount: "₱2,500.00" }
];

document.addEventListener("DOMContentLoaded", () => {
    const apiUrl = "https://fedskillstest.coalitiontechnologies.workers.dev";
    const authHeader = {
        "Authorization": "Basic " + btoa("coalition:skills-test")
    };

    fetch(apiUrl, { headers: authHeader })
        .then(response => response.json())
        .then(data => {
            globalPatientsData = data;
            populatePatientsList(data);
            const jessica = data.find(patient => patient.name === "Jessica Taylor") || data[0];
            if (jessica) {
                loadPatientData(jessica);
            }
            setupChatInbox(data);
        })
        .catch(error => console.error("Error fetching data:", error));

    setupNavigationViews();
    setupInteractiveActions();
});

// Modern Toast Notification Function (Pamalit sa alert())
function showToast(message, type = "success") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "fixed bottom-5 right-5 z-50 flex flex-col space-y-2";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    const bgColor = type === "success" ? "bg-teal-600" : "bg-gray-800";
    toast.className = `${bgColor} text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium toast-slide-in flex items-center space-x-2`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : 'ℹ️'}</span><span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove("toast-slide-in");
        toast.classList.add("toast-slide-out");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Navigation Switcher Logic
function setupNavigationViews() {
    const navLinks = document.querySelectorAll(".nav-link");
    const views = {
        "nav-overview": document.getElementById("view-overview"),
        "nav-patients": document.getElementById("view-overview"),
        "nav-schedule": document.getElementById("view-schedule"),
        "nav-message": document.getElementById("view-message"),
        "nav-transactions": document.getElementById("view-transactions")
    };

    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove("text-teal-600", "bg-teal-50", "font-bold"));
            link.classList.add("text-teal-600", "bg-teal-50", "font-bold");

            Object.values(views).forEach(v => v.classList.add("hidden"));

            const targetView = views[link.id];
            if (targetView) {
                targetView.classList.remove("hidden");
                if (link.id === "nav-schedule") renderScheduleTable();
                if (link.id === "nav-transactions") renderTransactionsTable();
            }
        });
    });
}

// Patients List with Real-Time Search Filtering
function populatePatientsList(patients) {
    const container = document.getElementById("patients-list-container");

    const renderList = (filteredPatients) => {
        container.innerHTML = "";
        if (filteredPatients.length === 0) {
            container.innerHTML = `<p class="text-xs text-gray-400 text-center py-4">No patients found.</p>`;
            return;
        }

        filteredPatients.forEach(patient => {
            const item = document.createElement("div");
            const isJessica = patient.name === "Jessica Taylor";
            
            item.className = `flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${isJessica ? 'bg-[#07CBD9]/15' : 'hover:bg-gray-50'}`;
            item.innerHTML = `
                <div class="flex items-center space-x-3">
                    <img src="${patient.profile_picture}" alt="${patient.name}" class="w-12 h-12 rounded-full object-cover">
                    <div>
                        <p class="font-bold text-sm text-gray-800">${patient.name}</p>
                        <p class="text-xs text-gray-400">${patient.gender}, ${patient.age}</p>
                    </div>
                </div>
                <span class="text-gray-400 font-bold">...</span>
            `;

            item.addEventListener("click", () => {
                loadPatientData(patient);
            });

            container.appendChild(item);
        });
    };

    renderList(patients);

    const searchInput = document.getElementById("patient-search-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = patients.filter(p => p.name.toLowerCase().includes(query));
            renderList(filtered);
        });
    }
}

function loadPatientData(patient) {
    document.getElementById("patient-avatar").src = patient.profile_picture;
    document.getElementById("patient-name").innerText = patient.name;
    document.getElementById("patient-dob").innerText = patient.date_of_birth;
    document.getElementById("patient-gender").innerText = patient.gender;
    document.getElementById("patient-phone").innerText = patient.phone_number;
    document.getElementById("patient-emergency").innerText = patient.emergency_contact;
    document.getElementById("patient-insurance").innerText = patient.insurance_type;

    if (patient.diagnosis_history && patient.diagnosis_history.length > 0) {
        const latest = patient.diagnosis_history[0];
        document.getElementById("systolic-value").innerText = latest.blood_pressure.systolic.value;
        document.getElementById("systolic-levels").innerText = latest.blood_pressure.systolic.levels;
        
        document.getElementById("diastolic-value").innerText = latest.blood_pressure.diastolic.value;
        document.getElementById("diastolic-levels").innerText = latest.blood_pressure.diastolic.levels;

        updateBloodPressureChart(patient.diagnosis_history);

        document.getElementById("respiratory-rate").innerText = `${latest.respiratory_rate.value} bpm`;
        document.getElementById("respiratory-status").innerText = latest.respiratory_rate.levels;

        document.getElementById("temperature-value").innerText = `${latest.temperature.value}°F`;
        document.getElementById("temperature-status").innerText = latest.temperature.levels;

        document.getElementById("heart-rate").innerText = `${latest.heart_rate.value} bpm`;
        document.getElementById("heart-rate-status").innerText = latest.heart_rate.levels;
    }

    const tableBody = document.getElementById("diagnostic-table-body");
    tableBody.innerHTML = "";
    if (patient.diagnostic_list) {
        patient.diagnostic_list.forEach(diag => {
            const tr = document.createElement("tr");
            tr.className = "border-b hover:bg-gray-50 text-sm";
            tr.innerHTML = `
                <td class="py-3 px-4 text-gray-800 font-medium">${diag.problem}</td>
                <td class="py-3 px-4 text-gray-600">${diag.description}</td>
                <td class="py-3 px-4 text-gray-800">${diag.status}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    const labContainer = document.getElementById("lab-results-container");
    labContainer.innerHTML = "";
    if (patient.lab_results) {
        patient.lab_results.forEach(lab => {
            const labItem = document.createElement("div");
            labItem.className = "flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded-lg cursor-pointer";
            labItem.innerHTML = `
                <span class="text-gray-700">${lab}</span>
                <span class="text-teal-600 font-semibold text-xs bg-teal-50 px-2 py-1 rounded">Download</span>
            `;
            labItem.addEventListener("click", () => showToast(`Downloading lab result: ${lab}`));
            labContainer.appendChild(labItem);
        });
    }
}

function updateBloodPressureChart(history) {
    const ctx = document.getElementById("bpChart").getContext("2d");
    const labels = history.slice(0, 6).map(item => `${item.month.slice(0, 3)}, ${item.year}`).reverse();
    const systolicData = history.slice(0, 6).map(item => item.blood_pressure.systolic.value).reverse();
    const diastolicData = history.slice(0, 6).map(item => item.blood_pressure.diastolic.value).reverse();

    if (bpChart) bpChart.destroy();

    bpChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Systolic', data: systolicData, borderColor: '#E66FD2', backgroundColor: '#E66FD2', tension: 0.4, borderWidth: 2, pointRadius: 4 },
                { label: 'Diastolic', data: diastolicData, borderColor: '#8C6FE6', backgroundColor: '#8C6FE6', tension: 0.4, borderWidth: 2, pointRadius: 4 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { display: true, color: '#f3f4f6' }, ticks: { font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { font: { size: 10 } } }
            }
        }
    });
}

function renderScheduleTable() {
    const container = document.getElementById("schedule-list");
    container.innerHTML = "";
    scheduleData.forEach(item => {
        const div = document.createElement("div");
        div.className = "p-4 bg-gray-50 border rounded-xl flex justify-between items-center";
        div.innerHTML = `
            <div>
                <p class="font-bold text-gray-800">${item.patient} - <span class="text-teal-600">${item.type}</span></p>
                <p class="text-xs text-gray-500 mt-1">📅 ${item.date}</p>
            </div>
            <span class="text-xs px-3 py-1 rounded-full font-semibold ${item.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">${item.status}</span>
        `;
        container.appendChild(div);
    });
}

function setupChatInbox(patients) {
    const chatList = document.getElementById("chat-list");
    const chatMessages = document.getElementById("chat-messages");
    const chatInput = document.getElementById("chat-input");
    const chatSubmit = document.getElementById("chat-submit");
    const activeChatName = document.getElementById("active-chat-name");
    const chatForm = document.getElementById("chat-form");

    const messagesStore = {};
    patients.forEach(p => {
        messagesStore[p.name] = [
            { sender: p.name, text: `Hello Dr. Simmons, I have a quick question regarding my prescription.`, time: "Yesterday, 3:45 PM" }
        ];
    });

    chatList.innerHTML = "";
    patients.forEach(p => {
        const item = document.createElement("div");
        item.className = "p-3 hover:bg-white rounded-xl cursor-pointer transition border border-transparent hover:border-gray-200 flex items-center space-x-3";
        item.innerHTML = `
            <img src="${p.profile_picture}" class="w-10 h-10 rounded-full object-cover">
            <div>
                <p class="font-bold text-sm text-gray-800">${p.name}</p>
                <p class="text-xs text-gray-400 truncate w-36">Click to chat...</p>
            </div>
        `;

        item.addEventListener("click", () => {
            currentActiveChatPatient = p.name;
            activeChatName.innerText = `Chat with ${p.name}`;
            chatInput.disabled = false;
            chatSubmit.disabled = false;
            renderMessages(messagesStore[p.name], chatMessages);
        });

        chatList.appendChild(item);
    });

    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!currentActiveChatPatient || !chatInput.value.trim()) return;

        messagesStore[currentActiveChatPatient].push({
            sender: "Dr. Simmons",
            text: chatInput.value,
            time: "Just now"
        });

        renderMessages(messagesStore[currentActiveChatPatient], chatMessages);
        chatInput.value = "";
    });
}

function renderMessages(messages, container) {
    container.innerHTML = "";
    messages.forEach(m => {
        const isDoctor = m.sender === "Dr. Simmons";
        const bubble = document.createElement("div");
        bubble.className = `flex flex-col ${isDoctor ? 'items-end' : 'items-start'} space-y-1`;
        bubble.innerHTML = `
            <div class="max-w-md p-3 rounded-2xl text-sm ${isDoctor ? 'bg-teal-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}">
                <p>${m.text}</p>
            </div>
            <span class="text-[10px] text-gray-400">${m.sender} • ${m.time}</span>
        `;
        container.appendChild(bubble);
    });
    container.scrollTop = container.scrollHeight;
}

function renderTransactionsTable() {
    const tbody = document.getElementById("transactions-table-body");
    tbody.innerHTML = "";
    transactionsData.forEach(tx => {
        const tr = document.createElement("tr");
        tr.className = "border-b hover:bg-gray-50 text-sm";
        tr.innerHTML = `
            <td class="py-3 px-4 font-bold text-teal-600">${tx.id}</td>
            <td class="py-3 px-4 text-gray-800">${tx.patient}</td>
            <td class="py-3 px-4 text-gray-600">${tx.desc}</td>
            <td class="py-3 px-4"><span class="text-xs px-2.5 py-1 rounded-full font-semibold ${tx.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}">${tx.status}</span></td>
            <td class="py-3 px-4 text-right font-bold text-gray-800">${tx.amount}</td>
        `;
        tbody.appendChild(tr);
    });
}

function setupInteractiveActions() {
    document.getElementById("show-all-info-btn").addEventListener("click", () => {
        showToast("Comprehensive medical records loaded successfully.");
    });

    document.getElementById("add-schedule-btn").addEventListener("click", () => {
        const patientName = prompt("Enter patient name for new appointment:");
        if (patientName) {
            scheduleData.push({ id: scheduleData.length + 1, patient: patientName, type: "General Checkup", date: "Oct 20, 2026 - 11:00 AM", status: "Pending" });
            renderScheduleTable();
            showToast("New appointment added successfully!");
        }
    });

    document.getElementById("add-transaction-btn").addEventListener("click", () => {
        const patientName = prompt("Enter patient name for new invoice:");
        if (patientName) {
            transactionsData.push({ id: `INV-2026-09${transactionsData.length}`, patient: patientName, desc: "Specialist Consultation", status: "Pending", amount: "₱1,200.00" });
            renderTransactionsTable();
            showToast("New invoice created successfully!");
        }
    });

    document.getElementById("settings-btn").addEventListener("click", () => showToast("Practitioner Settings loaded.", "info"));
}
