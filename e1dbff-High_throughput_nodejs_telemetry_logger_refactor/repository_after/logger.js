function logTrade(tradeData) {
    console.log("Processing trade: " + tradeData.id);

    const metadata = { timestamp: Date.now(), ...tradeData };
    if (metadata.isPrivate) {
        delete metadata.userId;
    }

    return JSON.stringify(metadata);
}

module.exports = { logTrade };
