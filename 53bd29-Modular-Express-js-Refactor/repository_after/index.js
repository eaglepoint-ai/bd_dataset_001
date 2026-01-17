const express = require("express");
const cors = require('cors');
const config = require("./config/environment");
const { connectToDB } = require("./config/database");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

// Routes
const authRoutes = require("./routes/authRoutes");
const postsRoutes = require("./routes/postsRoutes");
const interactionsRoutes = require("./routes/interactionsRoutes");
const notificationsRoutes = require("./routes/notificationsRoutes");
const searchRoutes = require("./routes/searchRoutes");
const profileRoutes = require("./routes/profileRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const privateChatsRoutes = require("./routes/privateChatsRoutes");
const botsRoutes = require("./routes/botsRoutes");
const communityRoutes = require("./routes/communityRoutes");

// Root Route
app.get("/philomena/", async (req, res) => {
    res.send(`Welcome to ${config.appName} API dev`);
});

// Mount Routes
app.use("/philomena/authentication", authRoutes);
app.use("/philomena/posts", postsRoutes);
app.use("/philomena/interactions", interactionsRoutes);
app.use("/philomena/notifications", notificationsRoutes);
app.use("/philomena/search", searchRoutes);
app.use("/philomena/profile", profileRoutes);
app.use("/philomena/upload", uploadRoutes);
app.use("/philomena/privateChats", privateChatsRoutes);
app.use("/philomena/bots", botsRoutes);
app.use("/philomena/community", communityRoutes);

// Start Server
app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
});

// Connect to Database
connectToDB();
