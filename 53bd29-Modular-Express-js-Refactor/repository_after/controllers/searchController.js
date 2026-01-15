const accountModel = require("../models/Account");
const postsModel = require("../models/Post");
const asyncHandler = require("../middleware/asyncHandler");

const getSearchRoot = asyncHandler(async (req, res) => {
    res.send("Welcome to search route");
});

const search = asyncHandler(async (req, res) => {
    let searchTerm = req.params.searchTerm;
    console.log(searchTerm);

    // Search Accounts
    let fullnameRegex = RegExp(searchTerm, 'i'); 
    let usernameRegex = RegExp('^' + searchTerm, 'i'); 
    let accountResults = await accountModel.find(
        {
            $or: [
                {"fullname": {$regex: fullnameRegex}}, 
                {"username": {$regex: usernameRegex}},
            ],
        },
    )

    // Search Posts
    let timeRegex = RegExp('^' + searchTerm, 'i'); 
    let contentRegex = RegExp(searchTerm, 'i'); 
    let postResults = await postsModel.find(
        {
            $or: [
                {"content": {$regex: contentRegex}},
            ],
        },
    )
    
    console.log(accountResults);
    console.log(postResults);
    
    // Result
    let searchResults = {
        "accountResults": accountResults,
        "postResults": postResults,
    }

    // Respond
    res.status(200).send(searchResults);
});

module.exports = {
    getSearchRoot,
    search
};
