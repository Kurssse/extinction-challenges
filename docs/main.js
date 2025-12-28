let challenges = [];        
let mapData = null;         
let usedChallenges = JSON.parse(localStorage.getItem("usedChallenges") || "[]"); 

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
}

function getChallengesByHive(challenges, cycle, playerCount, cycleHives) {
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

    loadMapData(map);
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
        const grouped = getChallengesByHive(
            challenges,
            cycle,
            playerCount,
            mapData.cycle_hives 
        );
        renderTable(grouped);
        updateMapImage(cycle);
    }).catch(err => {
        console.error("Error loading map or challenges:", err);
    });
});
