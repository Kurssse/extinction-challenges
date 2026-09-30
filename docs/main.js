let challenges = [];        
let mapData = null;         
let usedChallenges = JSON.parse(localStorage.getItem("usedChallenges") || "[]"); 
let exodusConduitOrder = JSON.parse(localStorage.getItem("exodusConduitOrder") || "[]");

const exodusConduits = [
    { value: "conduit_gas_station_1", label: "Gas Station 1", area: 0 },
    { value: "conduit_gas_station_2", label: "Gas Station 2", area: 0 },
    { value: "conduit_parking_1", label: "Parking 1", area: 1 },
    { value: "conduit_parking_2", label: "Parking 2", area: 1 },
    { value: "conduit_rooftop_1", label: "Rooftop 1", area: 2 },
    { value: "conduit_rooftop_2", label: "Rooftop 2", area: 2 }
];

function loadChallenges(map, difficulty) {
    const path = `challenges/${map}_${difficulty}.json`;
    return fetch(path)
        .then(r => r.json())
        .then(data => challenges = data.challenges)
        .catch(err => {
            console.error("Failed to load JSON:", err);
            challenges = [];
        });
}

function loadMapData(map) {
    return fetch(`maps/${map}.json`)
        .then(r => r.json())
        .then(data => {
            mapData = data;
            populateCycles(); 
        });
}

function populateCycles() {
    const cycleSelect = document.getElementById("cycle");
    cycleSelect.innerHTML = "";

    const { min, max } = mapData.cycle_ranges;
    const names = mapData.cycle_names;

    for (let i = min; i <= max; i++) {
        if (!names || !names[i]) {
            throw new Error(`Missing cycle name for cycle ${i}`); 
        }
        const opt = document.createElement("option");
        opt.value = i;           
        opt.textContent = names[i]; 
        cycleSelect.appendChild(opt);
    }

    renderExodusTracker();
    updateCycleLabels();
}

function renderExodusTracker() {
    const tracker = document.getElementById("exodus-tracker");
    const container = document.getElementById("conduit-order");
    const isExodus = mapData?.map === "exodus";
    tracker.hidden = !isExodus;
    container.innerHTML = "";

    if (!isExodus) return;

    for (let slot = 0; slot < 6; slot++) {
        const label = document.createElement("label");
        label.textContent = `Generator ${slot + 1}: `;

        const select = document.createElement("select");
        select.dataset.slot = slot;

        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = "Select generator";
        select.appendChild(emptyOption);

        for (const conduit of exodusConduits) {
            const option = document.createElement("option");
            option.value = conduit.value;
            option.textContent = conduit.label;
            select.appendChild(option);
        }

        select.value = exodusConduitOrder[slot] || "";
        select.addEventListener("change", () => {
            exodusConduitOrder[slot] = select.value;
            localStorage.setItem("exodusConduitOrder", JSON.stringify(exodusConduitOrder));
            updateConduitOptions();
            updateCycleLabels();
        });

        label.appendChild(select);
        container.appendChild(label);
    }

    updateConduitOptions();
}

function updateConduitOptions() {
    const selects = document.querySelectorAll("#conduit-order select");
    selects.forEach(select => {
        const selectedElsewhere = new Set(
            exodusConduitOrder.filter((value, slot) => value && slot !== Number(select.dataset.slot))
        );
        for (const option of select.options) {
            option.disabled = selectedElsewhere.has(option.value);
        }
    });
}

function getExodusAssignments() {
    const assignments = [];
    const areaOccurrences = [0, 0, 0];

    for (let slot = 0; slot < 6; slot++) {
        const conduit = exodusConduits.find(item => item.value === exodusConduitOrder[slot]);
        if (!conduit) {
            assignments.push(null);
            continue;
        }

        const occurrence = areaOccurrences[conduit.area]++;
        const cycle = 6 + Math.floor(slot / 2) * 6 + conduit.area * 2 + occurrence;
        assignments.push({ cycle, hive: conduit.value, label: conduit.label });
    }

    return assignments;
}

function updateCycleLabels() {
    if (mapData?.map !== "exodus") return;

    const assignments = getExodusAssignments();
    const cycleSelect = document.getElementById("cycle");
    for (const option of cycleSelect.options) {
        const slot = Number(option.value) - 6;
        if (slot < 0 || slot >= 6) continue;

        const assignment = assignments[slot];
        const generator = mapData.cycle_names[option.value];
        option.textContent = assignment
            ? `${generator}`
            : generator;
    }
}

function getChallengesByHive(challenges, cycle, playerCount, cycleHives) {
    const result = {};

    const assignments = mapData.map === "exodus" ? getExodusAssignments() : null;
    const assignment = assignments?.[cycle - 6];
    if (mapData.map === "exodus" && cycle >= 6 && cycle <= 11 && !assignment) return result;

    const realCycles = assignment
        ? [assignment.cycle]
        : (mapData.ui_cycles?.[cycle] ?? [cycle]);
    
    const allowedHives = new Set();
    for (const rc of realCycles) {
        const hives = cycleHives[rc] || [];
        hives.forEach(h => allowedHives.add(h));
    }

    for (const c of challenges) {
        if (playerCount === 1 && !c.allowedinsolo) continue; 
        
        if (!realCycles.some(rc => c.allowed_cycles.includes(rc))) continue;       

        for (const hive of c.allowed_hives) {
            if (!allowedHives.has(hive)) continue;      

            if (!result[hive]) result[hive] = [];
            if (!usedChallenges.includes(c.ref)) {          
                result[hive].push(c.ref);
            }
        }
    }

    return result;
}

function renderTable(challengesByHive) {
    const container = document.getElementById("output");
    container.innerHTML = "";

    const table = document.createElement("table");
    table.border = 1;

    const header = table.insertRow();
    header.insertCell().textContent = "Hive";
    header.insertCell().textContent = "Challenges";

    for (const [hive, chList] of Object.entries(challengesByHive)) {
        const row = table.insertRow();
        row.insertCell().textContent = hive;

        const cell = row.insertCell();
        chList.forEach((ch, index) => {
            const span = document.createElement("span");
            span.textContent = ch;
            span.style.cursor = "pointer";
            span.style.display = "inline";
            span.addEventListener("click", () => markUsed(ch));
            cell.appendChild(span);

            if (index < chList.length - 1) {
                cell.appendChild(document.createTextNode(" | "));
            }
        });
    }

    container.appendChild(table);
}

function saveUsedChallenges() {
    localStorage.setItem("usedChallenges", JSON.stringify(usedChallenges));
}

function markUsed(challengeRef) {
    if (!usedChallenges.includes(challengeRef)) {
        usedChallenges.push(challengeRef);
        saveUsedChallenges();
        renderUsedList();
    }
}

function renderUsedList() {
    const container = document.getElementById("used-list");
    container.innerHTML = usedChallenges.join(", ") || "None";
}

document.getElementById("clear-used").addEventListener("click", () => {
    usedChallenges = [];
    saveUsedChallenges();
    renderUsedList();
});

renderUsedList();

function getMapImage(cycle) {
    if (!mapData || !mapData.images) return "";

    const entry = mapData.images.find(img => cycle >= img.min && cycle <= img.max);
    return entry ? entry.file : "";
}

function updateMapImage(cycle) {
    const img = document.getElementById("map-image");
    const src = getMapImage(cycle);

    if (src) {
        img.src = src;
        img.style.display = "block";
    } else {
        img.style.display = "none";
    }
}

document.getElementById("map").addEventListener("change", () => {
    const map = document.getElementById("map").value;

    loadMapData(map).catch(err => console.error("Error loading map:", err));
});

document.getElementById("run").addEventListener("click", () => {
    const map = document.getElementById("map").value;
    const difficulty = document.getElementById("difficulty").value;
    const cycle = Number(document.getElementById("cycle").value);
    const playerCount = Number(document.getElementById("players").value);

    const mapDataPromise = mapData ? Promise.resolve() : loadMapData(map);

    mapDataPromise.then(() => {
        return loadChallenges(map, difficulty);
    }).then(() => {
        const cycleHives = { ...mapData.cycle_hives };
        if (mapData.map === "exodus") {
            for (const assignment of getExodusAssignments()) {
                if (assignment) cycleHives[assignment.cycle] = [assignment.hive];
            }
        }

        const grouped = getChallengesByHive(
            challenges,
            cycle,
            playerCount,
            cycleHives
        );
        renderTable(grouped);
        updateMapImage(cycle);
    }).catch(err => {
        console.error("Error loading map or challenges:", err);
    });
});
