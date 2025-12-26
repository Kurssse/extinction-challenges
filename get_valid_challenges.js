function getValidChallenges(challenges, context) {
    const valid = [];

    for (const c of challenges) {
        if (c.already_issued) continue;
        if (context.players === 1 && !c.allowedinsolo) continue;
        if (!c.allowed_cycles) continue;

        const cycles = c.allowed_cycles.split(" ").map(Number);
        if (!cycles.includes(context.cycle - 1)) continue;

        const hives = c.allowed_hives.split(" ");
        if (!hives.includes(context.hive)) continue;

        valid.push(c);
    }

    return valid;
}
