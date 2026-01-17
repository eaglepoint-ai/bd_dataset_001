const asyncHandler = require("../middleware/asyncHandler");

const getBotsRoot = asyncHandler(async (req, res) => {
    res.status(200).send("Welcome to Bots route");
});

const allBotsPost = asyncHandler(async (req, res) => {
    let bot;
    res.status(200).send("BOTS POSTED!");
});

module.exports = {
    getBotsRoot,
    allBotsPost
};
