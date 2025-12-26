let challenges = [];

/* LOAD JSON DATA */
fetch("challenges/point_of_contact.json")
    .then(response => response.json())
    .then(data => {
        challenges = data.challenges;
    });

/* BUTTON CLICK */
document.getElementById("run").addEventListener("click", () => {
    const playerCount = Number(document.getElementById("players").value);
    const cycle = Number(document.getElementById("cycle").value);
    const hive = document.getElementById("hive").value;

    const context = {
        players: Array.from({ length: playerCount }, () => ({
            pistolsOnlyPrestige: false
        })),
        cycle: cycle,
        hive: hive
    };

    const valid = getValidChallenges(challenges, context);
    render(valid);
});

/* FILTERING LOGIC */
function getValidChallenges(challenges, context) {
    const valid = [];

    for (const c of challenges) {
        if (context.players.length === 1 && !c.allowedinsolo) continue;
        if (!c.allowed_cycles.includes(context.cycle - 1)) continue;
        if (!c.allowed_hives.includes(context.hive)) continue;

        valid.push(c);
    }

    return valid;
}

/* DISPLAY RESULTS */
function render(list) {
    const out = document.getElementById("output");

    if (list.length === 0) {
        out.textContent = "No valid challenges.";
        return;
    }

    out.textContent = list.map(c => c.ref).join("\n");
}
