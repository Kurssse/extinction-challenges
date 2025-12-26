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

    loadChallenges("point_of_contact", difficulty).then(() => {
        const grouped = getChallengesByHive(challenges, cycle, playerCount);
        renderTable(grouped);
    });
});

/* FILTERING LOGIC */
function getChallengesByHive(challenges, cycle, playerCount) {
    const result = {}; // hive -> array of challenges

    for (const c of challenges) {
        // Skip if challenge is not allowed in solo and only 1 player
        if (playerCount === 1 && !c.allowedinsolo) continue;

        if (!c.allowed_cycles.includes(cycle)) continue;

        for (const hive of c.allowed_hives) {
            if (!result[hive]) result[hive] = [];
            result[hive].push(c.ref);
        }
    }

    return result;
}

/* DISPLAY RESULTS */
function renderTable(challengesByHive) {
    const container = document.getElementById("output");
    container.innerHTML = ""; // clear previous results

    const table = document.createElement("table");
    table.border = 1;
    const header = table.insertRow();
    header.insertCell().textContent = "Hive";
    header.insertCell().textContent = "Challenges";

    for (const [hive, chList] of Object.entries(challengesByHive)) {
        const row = table.insertRow();
        row.insertCell().textContent = hive;
        row.insertCell().textContent = chList.join(", ");
    }

    container.appendChild(table);
}


