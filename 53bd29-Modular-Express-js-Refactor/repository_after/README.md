# Philomena Backend - Modular Express.js Application

A clean, modular, and production-ready Express.js backend with MVC architecture.

## Project Structure

```
├── config/              # Configuration files
│   ├── database.js      # Database connection
│   ├── environment.js   # Environment variables
│   └── upload.js        # File upload configuration
├── models/              # Mongoose models (one per feature)
│   ├── Account.js
│   ├── Post.js
│   ├── Comment.js
│   ├── Community.js
│   ├── CommunityChat.js
│   ├── PrivateChat.js
│   ├── Notification.js
│   └── Bot.js
├── controllers/         # Business logic (one per feature)
│   ├── authController.js
│   ├── postsController.js
│   ├── interactionsController.js
│   ├── notificationsController.js
│   ├── searchController.js
│   ├── profileController.js
│   ├── uploadController.js
│   ├── privateChatsController.js
│   ├── botsController.js
│   └── communityController.js
├── routes/              # Route definitions (one per feature)
│   ├── authRoutes.js
│   ├── postsRoutes.js
│   ├── interactionsRoutes.js
│   ├── notificationsRoutes.js
│   ├── searchRoutes.js
│   ├── profileRoutes.js
│   ├── uploadRoutes.js
│   ├── privateChatsRoutes.js
│   ├── botsRoutes.js
│   └── communityRoutes.js
├── middleware/          # Custom middleware
│   └── asyncHandler.js  # Async error handling
├── index.js             # Application entry point
└── package.json         # Dependencies
```

## Features

- **MVC Architecture**: Clean separation of concerns
- **Modular Design**: One model/controller/route per feature
- **Async Error Handling**: Robust error handling for all async operations
- **Centralized Configuration**: Database, environment, and upload configs
- **CommonJS Modules**: Uses require/module.exports
- **Production-Ready**: Scalable and maintainable codebase

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file or set the following environment variables:

- `APP_NAME` - Application name (default: "Philomena")
- `PORT` - Server port (default: 7000)
- `DBURL` - MongoDB connection URL

## Running the Application

```bash
npm start
```

The server will start on the configured port (default: 7000).

## API Endpoints

### Authentication
- `GET /philomena/authentication/` - Auth root
- `POST /philomena/authentication/signup` - User signup
- `POST /philomena/authentication/signupAnonymous` - Anonymous signup
- `POST /philomena/authentication/login` - User login

### Posts
- `GET /philomena/posts/` - Posts root
- `POST /philomena/posts/newPost` - Create new post
- `GET /philomena/posts/getAllPosts` - Get all posts
- `GET /philomena/posts/getFeed/:username` - Get user feed
- `POST /philomena/posts/getUserPosts` - Get user's posts
- `GET /philomena/posts/getPostComments/:postID` - Get post comments
- `POST /philomena/posts/deletePost` - Delete post

### Interactions
- `GET /philomena/interactions/` - Interactions root
- `POST /philomena/interactions/likeDislikePosts` - Like/unlike post
- `GET /philomena/interactions/followUnfollowUser/:username/:newUsername` - Follow/unfollow user
- `POST /philomena/interactions/commentOnPost` - Comment on post
- `POST /philomena/interactions/likeUnlikeComments` - Like/unlike comment
- `GET /philomena/interactions/deleteComment/:postID/:commentID` - Delete comment

### Notifications
- `GET /philomena/notifications/` - Notifications root
- `POST /philomena/notifications/getNotifications` - Get user notifications
- `POST /philomena/notifications/readNotifications` - Mark notification as read
- `GET /philomena/notifications/readAllNotifications/:username` - Mark all as read
- `GET /philomena/notifications/unreadAllNotifications/:username` - Mark all as unread
- `GET /philomena/notifications/getNotificationContent/:notificationID` - Get notification content

### Search
- `GET /philomena/search/` - Search root
- `GET /philomena/search/:searchTerm` - Search accounts and posts

### Profile
- `GET /philomena/profile/` - Profile root
- `GET /philomena/profile/getProfile/:username` - Get user profile
- `GET /philomena/profile/getAllProfiles/` - Get all profiles
- `GET /philomena/profile/getAllFollowing/:username` - Get user's following
- `GET /philomena/profile/getAllFollowers/:username` - Get user's followers

### Upload
- `GET /philomena/upload/` - Upload root
- `POST /philomena/upload/images` - Upload image post
- `POST /philomena/upload/videos` - Upload video post

### Private Chats
- `GET /philomena/privateChats/` - Private chats root
- `POST /philomena/privateChats/sendPrivateMessage` - Send private message
- `GET /philomena/privateChats/getPrivateChat/:from/:to` - Get private chat
- `GET /philomena/privateChats/clearPrivateChat/:from/:to` - Clear private chat
- `GET /philomena/privateChats/getChats/:username` - Get all chats for user

### Bots
- `GET /philomena/bots/` - Bots root
- `GET /philomena/bots/allBotsPost` - All bots post

### Community
- `GET /philomena/community/` - Community root
- `GET /philomena/community/getMyCommunities/:username` - Get user's communities
- `POST /philomena/community/createCommunity` - Create community
- `GET /philomena/community/deleteCommunity/:communityUsername/:ownerUsername` - Delete community
- `GET /philomena/community/joinCommunity/:communityUsername/:newMemberUsername` - Join community
- `GET /philomena/community/leaveCommunity/:communityUsername/:oldMemberUsername` - Leave community
- `POST /philomena/community/sendCommunityChat` - Send community chat
- `GET /philomena/community/getCommunityChat/:communityUsername` - Get community chat
- `GET /philomena/community/getCommunityMembers/:communityUsername` - Get community members
- `GET /philomena/community/clearCommunityChat/:communityUsername/:from` - Clear user's community chat
- `GET /philomena/community/clearAllCommunityChat/:communityUsername` - Clear all community chat
- `POST /philomena/community/updateCommunityInfo` - Update community info
- `GET /philomena/community/discoverCommunities` - Discover public communities

## Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **cors**: CORS middleware
- **multer**: File upload handling
- **nodemon**: Development server with auto-reload
