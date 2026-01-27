const API_BASE = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", () => {
    initServiceVehicleSearch();
    initTicketSearch();
    initTimetableSearch();
});


// ---------------------------
// SERVICE / VEHICLE SEARCH
// ---------------------------
function initServiceVehicleSearch() {
    const searchBtn = document.getElementById("searchBtn");

    searchBtn.addEventListener("click", async () => {
        const searchInput = document.getElementById("searchInput").value.trim();
        const activeOption = document.querySelector(".toggle-option.active");
        const type = activeOption.getAttribute("data-type");

        if (!searchInput) {
            alert("Please enter Service No or Vehicle No");
            return;
        }

        try {
            let url = "";

            if (type === "service") {
                url = `${API_BASE}/api/service/${searchInput}`;
            } else {
                url = `${API_BASE}/api/vehicle/${searchInput}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                alert("❌ Not found in database");
                return;
            }

            const data = await response.json();

            if (type === "service") {
                alert(
                    "✅ SERVICE FOUND\n\n" +
                    "Service No: " + data.service_no + "\n" +
                    "Route: " + data.route
                );
            } else {
                alert(
                    "✅ VEHICLE FOUND\n\n" +
                    "Vehicle No: " + data.vehicle_no + "\n" +
                    "Service No: " + data.service_no + "\n" +
                    "Route: " + data.route + "\n" +
                    "Status: " + data.status
                );
            }

        } catch (error) {
            console.error(error);
            alert("❌ Backend not responding");
        }
    });
}


// ---------------------------
// 🎟️ TICKET SEARCH (FROM - TO)
// ---------------------------
function initTicketSearch() {
    const ticketForm = document.getElementById("ticketForm");

    ticketForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const from = ticketForm.querySelector('input[placeholder*="Gajuwaka"]').value;
        const to = ticketForm.querySelector('input[placeholder*="Beach"]').value;
        const service = ticketForm.querySelector("select").value;

        const resultBox = document.getElementById("ticketResult");
        resultBox.innerHTML = "⏳ Searching buses...";

        try {
            let url = `${API_BASE}/api/search?from=${from}&to=${to}`;

            if (service) {
                url += `&service=${service}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.length === 0) {
                resultBox.innerHTML = "❌ No buses found";
                return;
            }

            let html = "<h5>✅ Available Buses:</h5><ul>";

            data.forEach(bus => {
                html += `
                    <li>
                        <b>${bus.service_no}</b> — ${bus.route_name} 
                        (${bus.service_type}) | Vehicle: ${bus.vehicle_no}
                    </li>
                `;
            });

            html += "</ul>";
            resultBox.innerHTML = html;

        } catch (error) {
            console.error(error);
            resultBox.innerHTML = "❌ Backend not responding";
        }
    });
}


// ---------------------------
// 🕒 TIMETABLE SEARCH
// ---------------------------
function initTimetableSearch() {
    const timetableForm = document.getElementById("timetableForm");

    timetableForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const inputs = timetableForm.querySelectorAll("input");
        const from = inputs[0].value;
        const to = inputs[1].value;

        const resultBox = document.getElementById("timetableResult");
        resultBox.innerHTML = "⏳ Fetching timetable...";

        try {
            const url = `${API_BASE}/api/timetable?from=${from}&to=${to}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.length === 0) {
                resultBox.innerHTML = "❌ No timetable found";
                return;
            }

            let html = "<h5>🕒 Timetable:</h5><ul>";

            data.forEach(t => {
                html += `
                    <li>
                        Service <b>${t.service_no}</b> — Arrival: ${t.arrival_time}
                    </li>
                `;
            });

            html += "</ul>";
            resultBox.innerHTML = html;

        } catch (error) {
            console.error(error);
            resultBox.innerHTML = "❌ Backend not responding";
        }
    });
}