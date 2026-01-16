Real-time Voting Application

Context:
You are building an internal tool for team decision-making. The application allows users to create polls with multiple options, share them via unique URLs, vote on polls, and see results update live without refreshing the page. The system must handle concurrent voters and maintain vote integrity.

Business Requirement:
Build a full-stack voting application with a Go backend and React frontend that supports real-time result updates via WebSocket.

Language and Environment:
- Backend: Go (version 1.21+)
- Frontend: React 18 with Vite
- WebSocket library: gorilla/websocket (backend)
- No external databases (in-memory storage only)
- No authentication required (cookie-based session tracking)

Required Deliverables:
1. Go backend with REST API and WebSocket support
2. React frontend with responsive design
3. docker-compose.yml to run both services

Functional Requirements:
1. Create poll: Question + 2-5 options, returns unique poll ID/URL
2. Vote on poll: One vote per browser session (use cookies)
3. Real-time updates: All viewers see vote counts update instantly via WebSocket
4. Close poll: Creator can close poll to stop accepting votes
5. Share URL: Polls accessible via shareable link (e.g., /polls/{id})

Technical Constraints:
1. Backend must handle concurrent vote submissions safely (use mutex/locks)
2. WebSocket must broadcast updates to all connected clients viewing same poll
3. Frontend must reconnect WebSocket on disconnection
4. All data stored in-memory (no persistence required)

API Endpoints:
- POST /api/polls - Create new poll
- GET /api/polls/{id} - Get poll data
- POST /api/polls/{id}/vote - Submit vote
- POST /api/polls/{id}/close - Close poll
- WS /ws/polls/{id} - WebSocket for real-time updates

Validation Scenarios:
1. Create poll with 3 options → Returns valid poll ID
2. Vote on poll → Vote count increments
3. Second browser votes → First browser sees update without refresh
4. Same browser votes twice → Rejected with error
5. Vote on closed poll → Rejected with error
6. Invalid poll ID → 404 error page

Non-Functional Requirements:
1. Handle 100+ concurrent WebSocket connections
2. Responsive UI (mobile and desktop)
3. Page load time under 2 seconds

