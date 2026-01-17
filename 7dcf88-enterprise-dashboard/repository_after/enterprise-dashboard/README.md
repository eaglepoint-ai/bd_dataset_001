# Enterprise Dashboard Performance Refactor

## Prompt
You are a Senior Full-Stack Engineer tasked with improving the performance of a high-traffic enterprise dashboard serving 50,000+ daily active users. The system currently suffers from severe latency due to inefficient data-fetching behavior. Your goal is to redesign the data-fetching architecture to eliminate request amplification while preserving component independence and backward compatibility. The solution must meet strict performance, scalability, and architectural constraints without altering existing component interfaces.

## Problem Statement
The dashboard experiences excessive load times during peak usage due to sequential and redundant API requests.
A component-first data-fetching strategy has introduced an N+1 request pattern that scales poorly.
As the number of projects increases, network overhead grows linearly, degrading user experience.
The system must be optimized without breaking component reusability or existing APIs.

## Requirements

### Functional Requirements
- Eliminate N+1 API request patterns
- Ensure all required data renders correctly on initial load
- Maintain backward compatibility for standalone components

### Non-Functional Requirements
- Maximum of 3 API requests per dashboard load
- All requests must execute in parallel
- Page load time must be less than 1 second (simulated)
- Request count must remain constant as project count scales

### Architectural Constraints
- No changes to component props or public interfaces
- No global state management or client-side caching libraries
- No monolithic component refactors
- No manual prop drilling across multiple component layers

## Tech Stack
- Frontend: React
- State Distribution: React Context API
- Backend: Existing REST APIs
- Language: JavaScript / TypeScript
- Testing: Component and integration testing
