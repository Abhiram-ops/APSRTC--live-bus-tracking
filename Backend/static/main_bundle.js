const API_BASE = ""; // Relative path for same-domain deployment
let trackingMap = null;
let trackingMarker = null;
let trackingInterval = null;

document.addEventListener("DOMContentLoaded", () => {
    initServiceVehicleSearch();
    initTicketSearch();
    initTimetableSearch();
    initRoutesView();
    loadStationsForAutocomplete();

    // Version Indicator
    const brand = document.querySelector('.navbar-brand');
    if (brand) brand.innerHTML += ' <span style="font-size:0.6em; color:#ddd;">v4.0</span>';
    console.log("APP VERSION: 4.0 ADVANCED MAPS LOADED");
});


// ---------------------------
// SERVICE / VEHICLE SEARCH
// ---------------------------

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

        // Clear previous interval if any
        if (trackingInterval) clearInterval(trackingInterval);

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
                const serviceNo = data.service_no;

                html = `
                    <div class="bus-card fade-in">
                         <div class="bus-header">
                            <span class="service-no">${serviceNo}</span>
                            <span class="bus-type">Service</span>
                        </div>
                        <div class="route-info"><i class="bi bi-signpost-split"></i> ${data.route}</div>
                        
                        <div class="mt-3 p-2 bg-light rounded border">
                            <div class="d-flex justify-content-between">
                                <span id="speedValue"><i class="bi bi-speedometer2"></i> -- km/h</span>
                                <span class="text-success fw-bold">RUNNING</span>
                            </div>
                             <div class="small text-muted mt-1" id="locValue">
                                <i class="bi bi-geo-alt"></i> --, --
                            </div>
                             <div class="small text-muted" id="updatedValue">
                                <i class="bi bi-clock-history"></i> Updated: --
                            </div>
                        </div>

                        <!-- MAP CONTAINER -->
                        <div id="map" style="height: 400px; width: 100%; margin-top: 15px; border-radius: 8px; z-index: 1;"></div>
                    </div>
                `;

                resultBox.innerHTML = html;

                // Start Live Tracking
                startLiveMap(serviceNo);

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
                resultBox.innerHTML = html;
            }

        } catch (error) {
            console.error(error);
            resultBox.innerHTML = '<div class="alert alert-danger">❌ Backend Connection Failed</div>';
        }
    });
}

async function startLiveMap(serviceNo) {
    // Initial Fetch
    await updateMapLocation(serviceNo, true);

    // Fetch Route Details (Polyline & Stops)
    drawRouteOnMap(serviceNo);

    // Polling every 3 seconds
    trackingInterval = setInterval(() => {
        updateMapLocation(serviceNo, false);
    }, 3000);
}

// Custom Bus Icon
const busIcon = L.icon({
    iconUrl: 'https://img.icons8.com/color/48/bus.png', // Bus Icon
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});

async function drawRouteOnMap(serviceNo) {
    try {
        console.log("Fetching route details for:", serviceNo);
        const res = await fetch(`${API_BASE}/api/route_details/${serviceNo}`);
        if (!res.ok) {
            console.error("Route details fetch failed:", res.status);
            return;
        }

        const stops = await res.json();
        console.log("Stops received:", stops);

        if (!stops || stops.length === 0) {
            console.warn("No stops found for this service.");
            // alert("Debug: No stops found for this service. Check database.");
            return;
        }

        const routeCoords = stops.map(s => [s.lat, s.lng]);

        if (trackingMap) {
            // Draw Polyline
            L.polyline(routeCoords, { color: 'blue', weight: 4, opacity: 0.7 }).addTo(trackingMap);

            // Add Stop Markers
            stops.forEach(stop => {
                L.circleMarker([stop.lat, stop.lng], {
                    radius: 6,
                    fillColor: "#ff0000",
                    color: "#fff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(trackingMap).bindPopup(`🚏 <b>${stop.name}</b>`);
            });

            // Adjust view to fit route
            trackingMap.fitBounds(routeCoords);
        }

    } catch (err) {
        console.error("Error fetching route details:", err);
    }
}

async function updateMapLocation(serviceNo, isFirstTime) {
    try {
        const res = await fetch(`${API_BASE}/api/live/${serviceNo}`);
        if (!res.ok) return; // Silent fail on subsequent updates if data missing

        const liveData = await res.json();

        // Update Text Info
        document.getElementById("speedValue").innerHTML = `<i class="bi bi-speedometer2"></i> ${liveData.speed} km/h`;
        document.getElementById("locValue").innerHTML = `<i class="bi bi-geo-alt"></i> ${liveData.lat.toFixed(4)}, ${liveData.lng.toFixed(4)}`;
        document.getElementById("updatedValue").innerHTML = `<i class="bi bi-clock-history"></i> Updated: ${liveData.updated_at.split(' ')[1]}`;

        const lat = liveData.lat;
        const lng = liveData.lng;

        if (isFirstTime) {
            if (trackingMap) {
                trackingMap.off();
                trackingMap.remove();
                trackingMap = null;
            }

            if (typeof L === 'undefined') {
                console.error("Leaflet JS not loaded");
                document.getElementById("map").innerHTML = "<div class='alert alert-danger'>Error: Map library not loaded. Check internet connection.</div>";
                return;
            }

            // Init Map (using Leaflet global L)
            trackingMap = L.map('map').setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(trackingMap);

            trackingMarker = L.marker([lat, lng], { icon: busIcon }).addTo(trackingMap)
                .bindPopup(`<b>${serviceNo}</b><br>Speed: ${liveData.speed} km/h`)
                .openPopup();
        } else {
            // Update Marker
            if (trackingMarker && trackingMap) {
                trackingMarker.setLatLng([lat, lng]);
                trackingMap.panTo([lat, lng]);
                trackingMarker.setPopupContent(`<b>${serviceNo}</b><br>Speed: ${liveData.speed} km/h`);
            }
        }

    } catch (err) {
        console.error("Tracking Error:", err);
    }
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