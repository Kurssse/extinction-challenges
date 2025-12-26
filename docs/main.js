const cycleHives = {
    1: ["mini_lung"],
    2: ["lodge_lung_1", "lodge_lung_2", "lodge_lung_4", "lodge_lung_5", "lodge_lung_6"],
    3: ["lodge_lung_1", "lodge_lung_2", "lodge_lung_4", "lodge_lung_5", "lodge_lung_6"],
    4: ["lodge_lung_1", "lodge_lung_2", "lodge_lung_4", "lodge_lung_5", "lodge_lung_6"],
    5: ["lodge_lung_3"],
    6: ["city_lung_1", "city_lung_2", "city_lung_3", "city_lung_4"],
    7: ["city_lung_1", "city_lung_2", "city_lung_3", "city_lung_4"],
    8: ["city_lung_1", "city_lung_2", "city_lung_3", "city_lung_4"],
    9: ["city_lung_5"],
    10: ["lake_lung_1", "lake_lung_2", "lake_lung_3", "lake_lung_4", "lake_lung_6"],
    11: ["lake_lung_1", "lake_lung_2", "lake_lung_3", "lake_lung_4", "lake_lung_6"],
    12: ["lake_lung_1", "lake_lung_2", "lake_lung_3", "lake_lung_4", "lake_lung_6"],
    13: ["lake_lung_1", "lake_lung_2", "lake_lung_3", "lake_lung_4", "lake_lung_6"],
    14: ["crater_lung"]
};

let challenges = [];

/* LOAD JSON DATA */
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
/* BUTTON CLICK */
document.getElementById("run").addEventListener("click", () => {
    const cycle = Number(document.getElementById("cycle").value);
    const difficulty = document.getElementById("difficulty").value;
    const playerCount = Number(document.getElementById("players").value);

    // Update map image
    document.getElementById("map-image").src = getMapImage(cycle);

    // Load challenges and render table
    loadChallenges("point_of_contact", difficulty).then(() => {
        const grouped = getChallengesByHive(challenges, cycle, playerCount);
        renderTable(grouped);
    });
});

/* FILTERING LOGIC */
function getChallengesByHive(challenges, cycle, playerCount) {
    const result = {};
    const allowedHives = cycleHives[cycle] || [];

    for (const c of challenges) {
        if (playerCount === 1 && !c.allowedinsolo) continue;
        if (!c.allowed_cycles.includes(cycle)) continue;

        for (const hive of c.allowed_hives) {
            if (!allowedHives.includes(hive)) continue;

            if (!result[hive]) result[hive] = [];
            if (!usedChallenges.includes(c.ref)) {
                result[hive].push(c.ref);
            }
        }
    }

    return result;
}

/* DISPLAY RESULTS */
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
        chList.forEach(ch => {
            const span = document.createElement("span");
            span.textContent = ch;
            span.style.cursor = "pointer";
            span.style.marginRight = "5px";
            span.addEventListener("click", () => markUsed(ch));
            cell.appendChild(span);
        });
    }

    container.appendChild(table);
}


// Load from localStorage or start empty
let usedChallenges = JSON.parse(localStorage.getItem("usedChallenges") || "[]");

function saveUsedChallenges() {
    localStorage.setItem("usedChallenges", JSON.stringify(usedChallenges));
}

// Mark a challenge as used
function markUsed(challengeRef) {
    if (!usedChallenges.includes(challengeRef)) {
        usedChallenges.push(challengeRef);
        saveUsedChallenges();
        renderUsedList();
    }
}

// Clear all used challenges
document.getElementById("clear-used").addEventListener("click", () => {
    usedChallenges = [];
    saveUsedChallenges();
    renderUsedList();
});

function renderUsedList() {
    const container = document.getElementById("used-list");
    container.innerHTML = usedChallenges.join(", ") || "None";
}

// Initial render
renderUsedList();

function getMapImage(cycle) {
    if (cycle >= 1 && cycle <= 5) return "images/POC1.png";
    if (cycle >= 6 && cycle <= 9) return "images/POC2.png";
    if (cycle >= 10 && cycle <= 14) return "images/POC3.png";
    return ""; // fallback, should not happen
}
