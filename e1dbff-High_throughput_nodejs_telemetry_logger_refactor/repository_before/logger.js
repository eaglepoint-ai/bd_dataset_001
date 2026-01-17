function logTrade(tradeData) {
    console.log("Processing trade: " + tradeData.id);

    const metadata = { timestamp: Date.now(), ...tradeData };

    function sanitize(obj) {
        if (obj.isPrivate) {
            delete obj.userId;
        }
        return obj;
    }

    const finalData = sanitize(metadata);
    return JSON.stringify(finalData);
}