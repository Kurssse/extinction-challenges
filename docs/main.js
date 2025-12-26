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
  const map = document.getElementById("map").value;
  const difficulty = document.getElementById("difficulty").value;
  const cycle = Number(document.getElementById("cycle").value);
  const playerCount = Number(document.getElementById("players").value);

  Promise.all([
    loadMapData(map),
    loadChallenges(map, difficulty)
  ]).then(() => {
    const grouped = getChallengesByHive(
      challenges,
      cycle,
      playerCount,
      mapData.cycle_hives
    );
    renderTable(grouped);
  });
});

/* FILTERING LOGIC */
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

let mapData = null;

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

  for (let i = mapData.cycle_ranges.min; i <= mapData.cycle_ranges.max; i++) {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i;
    cycleSelect.appendChild(opt);
  }
}



