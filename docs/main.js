// =======================
// GLOBAL VARIABLES
// =======================
let challenges = [];        // Loaded challenge data
let mapData = null;         // Loaded map data
let usedChallenges = JSON.parse(localStorage.getItem("usedChallenges") || "[]"); // Used challenges


// =======================
// LOAD CHALLENGE DATA
// =======================
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


// =======================
// LOAD MAP DATA
// =======================
function loadMapData(map) {
    return fetch(`maps/${map}.json`)
        .then(r => r.json())
        .then(data => {
            mapData = data;
            populateCycles(); // Populate cycles when map changes
        });
}


// =======================
// POPULATE CYCLE SELECT
// =======================
function populateCycles() {
    const cycleSelect = document.getElementById("cycle");
    cycleSelect.innerHTML = "";

    const { min, max } = mapData.cycle_ranges;
    const names = mapData.cycle_names;

    for (let i = min; i <= max; i++) {
        if (!names || !names[i]) {
            throw new Error(`Missing cycle name for cycle ${i}`); // Enforce named cycles
        }
        const opt = document.createElement("option");
        opt.value = i;           // numeric value for JS logic
        opt.textContent = names[i]; // always display text
        cycleSelect.appendChild(opt);
    }
}


// =======================
// GET VALID CHALLENGES
// =======================
function getChallengesByHive(challenges, cycle, playerCount, cycleHives) {
    const result = {};
    const allowedHives = cycleHives[cycle] || [];

    for (const c of challenges) {
        if (playerCount === 1 && !c.allowedinsolo) continue; // Solo restriction
        if (!c.allowed_cycles.includes(cycle)) continue;       // Cycle restriction

        for (const hive of c.allowed_hives) {
            if (!allowedHives.includes(hive)) continue;      // Hive restriction

            if (!result[hive]) result[hive] = [];
            if (!usedChallenges.includes(c.ref)) {          // Exclude used challenges
                result[hive].push(c.ref);
            }
        }
    }

    return result;
}


// =======================
// RENDER TABLE OF CHALLENGES
// =======================
function renderTable(challengesByHive) {
    const container = document.getElementById("output");
    container.innerHTML = "";

    const table = document.createElement("table");
    table.border = 1;

    // Header row
    const header = table.insertRow();
    header.insertCell().textContent = "Hive";
    header.insertCell().textContent = "Challenges";

    // Data rows
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

            // Add separator
            if (index < chList.length - 1) {
                cell.appendChild(document.createTextNode(" | "));
            }
        });
    }

    container.appendChild(table);

    // Note to users
    const note = document.createElement("p");
    note.textContent = "Click a challenge to mark it as used.";
    container.appendChild(note);
}


// =======================
// MANAGE USED CHALLENGES
// =======================
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

// Clear all used challenges
document.getElementById("clear-used").addEventListener("click", () => {
    usedChallenges = [];
    saveUsedChallenges();
    renderUsedList();
});

// Initial render of used challenges
renderUsedList();


// =======================
// MAP IMAGE HANDLING
// =======================
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


// =======================
// EVENT LISTENERS
// =======================

// Map selector changes → load new map and populate cycles
document.getElementById("map").addEventListener("change", () => {
    const map = document.getElementById("map").value;

    loadMapData(map);
});

// Run button → load challenges and show table & map image
document.getElementById("run").addEventListener("click", () => {
    const map = document.getElementById("map").value;
    const difficulty = document.getElementById("difficulty").value;
    const cycle = Number(document.getElementById("cycle").value);
    const playerCount = Number(document.getElementById("players").value);

    loadChallenges(map, difficulty).then(() => {
        const grouped = getChallengesByHive(challenges, cycle, playerCount, mapData.cycle_hives);
        renderTable(grouped);
        updateMapImage(cycle);
    });
});
