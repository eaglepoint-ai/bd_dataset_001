const config = {
    appName: process.env.APP_NAME || "Philomena",
    port: process.env.PORT || 7000,
    mongoUrl: process.env.DBURL || "",
    emailDomain: process.env.APP_NAME || "philomena"
};

module.exports = config;
