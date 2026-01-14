# Project Trajectory: Personal Snippet Manager

This document outlines the development process, tool choices, and technical strategy used to build and containerize the Personal Snippet Manager.

##  Technology Stack & Documentation

| Component | Technology | Documentation Link |
| :--- | :--- | :--- |
| **Backend** | FastAPI | [FastAPI Docs](https://fastapi.tiangolo.com/) |
| **Database** | PostgreSQL | [PostgreSQL Docs](https://www.postgresql.org/docs/) |
| **ORM** | SQLAlchemy | [SQLAlchemy Docs](https://docs.sqlalchemy.org/en/20/) |
| **Frontend** | React + Vite | [Vite Docs](https://vitejs.dev/) / [React Docs](https://react.dev/) |
| **Styling** | Vanilla CSS | [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS) |
| **Testing (BE)** | Pytest | [Pytest Docs](https://docs.pytest.org/) |
| **Testing (FE)** | Playwright | [Playwright Python Docs](https://playwright.dev/python/docs/intro) |
| **Container** | Docker & Compose | [Docker Docs](https://docs.docker.com/) |

---

##  Development Process

### 1. Backend Foundation
- **Architecture**: Implemented a RESTful API using **FastAPI** for high performance and automatic OpenAPI documentation.
- **Data Layer**: Used **SQLAlchemy** to interface with **PostgreSQL**. The schema was designed to be simple yet robust, with indexed titles and automatic timestamps.
- **Environment Management**: Utilized `python-dotenv` and `pydantic-settings` to manage configuration dynamically across local and Docker environments.

### 2. Frontend Implementation
- **UI/UX**: Built a modern, responsive interface using **React**. Focused on a "Single Page" experience where users can manage snippets without page reloads.
- **State Management**: Implemented **Optimistic Updates** in the `useSnippets` custom hook. This ensures the UI feels instantaneous by adding snippets to the list before the server confirms the save.
- **Aesthetics**: Used a clean, slate-based design system with smooth transitions and clear validation feedback.

### 3. Containerization Strategy
- **Layer Optimization**: Dockerfiles were refactored to use multi-stage builds and specific `COPY` patterns. This maximizes layer caching, reducing build times from minutes to seconds after the initial run.
- **Orchestration**: `docker-compose.yml` was configured to manage five distinct services:
    - `db`: Persistent PostgreSQL storage.
    - `backend`: The FastAPI application.
    - `frontend`: The React application served via Nginx.
    - `test-runner`: An isolated environment for running the full test suite.
    - `eval-runner`: A specialized service for generating compliance reports.

### 4. Verification & Testing
- **Backend Tests**: 10 tests using `FastAPI TestClient` and an in-memory SQLite database to verify logic, persistence, and validation without side effects.
- **Frontend Tests**: 6 end-to-end tests using **Playwright**. Mocks were used to isolate the frontend from the backend, ensuring tests are deterministic and fast.


---


