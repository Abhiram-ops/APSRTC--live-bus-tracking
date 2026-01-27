const API_BASE = ""; // Relative path for same-domain deployment

document.addEventListener("DOMContentLoaded", () => {
    initServiceVehicleSearch();
    initTicketSearch();
    initTimetableSearch();
    initRoutesView();
    loadStationsForAutocomplete();
});


// ---------------------------
// SERVICE / VEHICLE SEARCH
// ---------------------------
function initServiceVehicleSearch() {
    const searchBtn = document.getElementById("searchBtn");
    const resultBox = document.getElementById("trackingResult");

    searchBtn.addEventListener("click", async () => {
        const searchInput = document.getElementById("searchInput").value.trim();
        const activeOption = document.querySelector(".toggle-option.active");
        const type = activeOption.getAttribute("data-type");

        if (!searchInput) {
            resultBox.innerHTML = '<div class="alert alert-warning">Please enter a number</div>';
            return;
        }

        resultBox.innerHTML = "⏳ Searching...";

        try {
            let url = "";

            if (type === "service") {
                url = `${API_BASE}/api/service/${searchInput}`;
            } else {
                url = `${API_BASE}/api/vehicle/${searchInput}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                resultBox.innerHTML = '<div class="alert alert-danger">❌ Not found in database</div>';
                return;
            }

            const data = await response.json();
            let html = "";

            if (type === "service") {
                // Fetch LIVE STATUS for this service
                let liveData = null;
                try {
                    const liveRes = await fetch(`${API_BASE}/api/live/${data.service_no}`);
                    if (liveRes.ok) liveData = await liveRes.json();
                } catch (e) { }

                html = `
                    <div class="bus-card fade-in">
                         <div class="bus-header">
                            <span class="service-no">${data.service_no}</span>
                            <span class="bus-type">Service</span>
                        </div>
                        <div class="route-info"><i class="bi bi-signpost-split"></i> ${data.route}</div>
                        
                        ${liveData ? `
                        <div class="mt-3 p-2 bg-light rounded border">
                            <div class="d-flex justify-content-between">
                                <span><i class="bi bi-speedometer2"></i> ${liveData.speed} km/h</span>
                                <span class="text-success fw-bold">RUNNING</span>
                            </div>
                             <div class="small text-muted mt-1">
                                <i class="bi bi-geo-alt"></i> ${liveData.lat.toFixed(4)}, ${liveData.lng.toFixed(4)}
                            </div>
                             <div class="small text-muted">
                                <i class="bi bi-clock-history"></i> Updated: ${liveData.updated_at.split(' ')[1]}
                            </div>
                        </div>
                        ` : '<div class="mt-2 text-muted small"><i class="bi bi-exclamation-circle"></i> Live data unavailable</div>'}
                    </div>
                `;
            } else {
                html = `
                    <div class="bus-card fade-in">
                        <div class="bus-header">
                            <span class="service-no">${data.vehicle_no}</span>
                            <span class="bus-type ${data.status === 'Running' ? 'text-success' : 'text-danger'}">${data.status}</span>
                        </div>
                        <div class="route-info">Service: <b>${data.service_no}</b></div>
                        <div class="vehicle-info"><i class="bi bi-signpost-split"></i> ${data.route}</div>
                    </div>
                `;
            }
            resultBox.innerHTML = html;

        } catch (error) {
            console.error(error);
            resultBox.innerHTML = '<div class="alert alert-danger">❌ Backend Connection Failed</div>';
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

        const from = document.getElementById("ticketFrom").value.trim();
        const to = document.getElementById("ticketTo").value.trim();
        const service = document.getElementById("ticketService").value;

        const resultBox = document.getElementById("ticketResult");
        resultBox.innerHTML = "<div class='text-center p-3 text-muted'><i class='bi bi-hourglass-split spinning'></i> Searching available buses...</div>";

        try {
            let url = `${API_BASE}/api/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

            if (service) {
                url += `&service=${encodeURIComponent(service)}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                resultBox.innerHTML = '<div class="alert alert-warning text-center">❌ No buses found on this route</div>';
                return;
            }

            let html = "";

            data.forEach(bus => {
                html += `
                    <div class="bus-card fade-in">
                        <div class="bus-header">
                            <span class="service-no">${bus.service_no}</span>
                            <span class="bus-type">${bus.service_type}</span>
                        </div>
                        <div class="route-info">
                            <i class="bi bi-arrow-right-circle-fill text-primary"></i> ${bus.route_name}
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                             <div class="vehicle-info">
                                <i class="bi bi-bus-front"></i> ${bus.vehicle_no}
                            </div>
                            <span class="badge bg-success" style="font-size: 0.9rem;">₹ ${bus.ticket_price}</span>
                        </div>
                    </div>
                `;
            });

            resultBox.innerHTML = html;

        } catch (error) {
            console.error(error);
            resultBox.innerHTML = '<div class="alert alert-danger">❌ Backend Error</div>';
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

        const from = document.getElementById("timetableFrom").value.trim();
        const to = document.getElementById("timetableTo").value.trim();

        const resultBox = document.getElementById("timetableResult");
        resultBox.innerHTML = "⏳ Fetching timetable...";

        try {
            const url = `${API_BASE}/api/timetable?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
            const response = await fetch(url);
            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                resultBox.innerHTML = '<div class="alert alert-warning">❌ No timetable found</div>';
                return;
            }

            let html = "";

            data.forEach(t => {
                html += `
                    <div class="bus-card fade-in" style="border-left-color: #333;">
                        <div class="bus-header">
                            <span class="service-no" style="color: #333;">${t.service_no}</span>
                            <span class="bus-type" style="background: #eee; color: #333;">
                                <i class="bi bi-clock"></i> ${t.arrival_time}
                            </span>
                        </div>
                        <div class="vehicle-info">
                            Expected Arrival at ${from}
                        </div>
                    </div>
                `;
            });

            resultBox.innerHTML = html;

        } catch (error) {
            console.error(error);
            resultBox.innerHTML = '<div class="alert alert-danger">❌ Backend Error</div>';
        }
    });
}


// ---------------------------
// 🛣️ VIEW ALL ROUTES
// ---------------------------
function initRoutesView() {
    const viewRoutesBtn = document.getElementById("viewRoutesBtn");
    const routesResult = document.getElementById("routesResult");

    viewRoutesBtn.addEventListener("click", async () => {
        if (routesResult.style.display === "block") {
            routesResult.style.display = "none";
            viewRoutesBtn.textContent = "Load All Routes";
            return;
        }

        routesResult.innerHTML = "⏳ Loading routes...";
        routesResult.style.display = "block";
        viewRoutesBtn.textContent = "Hide Routes";

        try {
            const response = await fetch(`${API_BASE}/api/routes`);
            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                routesResult.innerHTML = '<div class="alert alert-warning">❌ No routes found</div>';
                return;
            }

            let html = "";
            data.forEach(r => {
                html += `
                    <div class="bus-card fade-in" style="border-left-color: #007bff;">
                        <div class="bus-header">
                            <span class="service-no" style="font-size: 1rem; color: #007bff;">${r.route_name}</span>
                        </div>
                        <div class="route-info text-muted small">
                            ${r.from} <i class="bi bi-arrow-right"></i> ${r.to}
                        </div>
                    </div>
                `;
            });
            routesResult.innerHTML = html;

        } catch (error) {
            console.error(error);
            routesResult.innerHTML = '<div class="alert alert-danger">❌ Error fetching routes</div>';
        }
    });
}


// ---------------------------
// 🔍 AUTOCOMPLETE STATIONS
// ---------------------------
async function loadStationsForAutocomplete() {
    try {
        const response = await fetch(`${API_BASE}/api/stations`);
        const stations = await response.json();

        const datalist = document.getElementById("stationList");
        datalist.innerHTML = "";

        stations.forEach(station => {
            const option = document.createElement("option");
            option.value = station;
            datalist.appendChild(option);
        });

    } catch (error) {
        console.error("Failed to load stations for autocomplete", error);
    }
}