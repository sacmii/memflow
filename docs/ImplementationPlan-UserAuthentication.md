# Implementation Plan: User Authentication and API Token Handling with Supabase (Server-Side Focus)

This document outlines the plan to implement user authentication and API token handling for all API calls within an existing server-side project that already utilizes Supabase.

## Goal

Implement robust server-side user authentication and ensure all API calls are authenticated using Supabase's authentication services and JWTs.

## Detailed Plan

### 1. Supabase Integration (Existing Project)

- **Assumption:** This project is already integrated with Supabase, meaning `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_ANON_KEY` for client-side interactions if applicable) are configured in the environment.
- **Backend Supabase Client:** Ensure your server-side application initializes the Supabase client using the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The service role key is crucial for privileged operations like verifying JWTs securely on the backend.

### 2. Database Schema Considerations

- Supabase manages its own `auth.users` table for user authentication. No custom `User` model is required in your Prisma schema for core authentication.
- If your application requires additional user-specific data, create separate tables (e.g., `profiles`) and link them to `auth.users` using foreign keys and Supabase Row Level Security (RLS) for secure data access.

### 3. User Authentication Flow (Server-Side Perspective)

- **User Creation/Management:**
  - Users will be created and managed directly through the Supabase Admin Panel. This project does not include a frontend for user sign-up or sign-in.
- **JWT Issuance:** Upon successful authentication (e.g., via Supabase's client-side libraries from a separate client application, or direct login via the Admin Panel), Supabase issues a JSON Web Token (JWT) to the client. This JWT is the "API token" for subsequent authenticated requests.

### 4. API Token (JWT) Validation Middleware

- **Purpose:** To protect API endpoints by verifying the authenticity and validity of the JWT sent by the client.
- **Location:** Create a new middleware file, e.g., `src/middleware/auth.ts`.
- **Implementation:**
  1.  **Extract JWT:** Retrieve the JWT from the `Authorization` header (e.g., `Bearer YOUR_JWT`).
  2.  **Verify JWT:** Use the server-side Supabase client (`supabase.auth.verifyJwt()`) to verify the JWT. This function checks the token's signature, expiration, and other claims against Supabase's public key.
  3.  **Attach User Context:** If the JWT is valid, the decoded token will contain the `sub` (Supabase user ID) and other user metadata. Attach this user ID (e.g., `req.userId = decodedJwt.sub`) to the request object for downstream controllers to use.
  4.  **Error Handling:** If the JWT is missing, invalid, or expired, return a 401 Unauthorized HTTP response.

### 5. Integrating Middleware into API Routes

- **Apply to Protected Routes:** Apply the newly created authentication middleware to all API routes that require user authentication.
- **Example (`src/routes/memory.ts`):**

  ```typescript
  import { Router } from 'express';
  import { authMiddleware } from '../middleware/auth'; // Assuming auth.ts
  import {
    createMemory,
    getMemoryById,
    updateMemory,
    deleteMemory,
  } from '../controllers/memory-controller';

  const router = Router();

  router.post('/', authMiddleware, createMemory);
  router.get('/:id', authMiddleware, getMemoryById);
  router.put('/:id', authMiddleware, updateMemory);
  router.delete('/:id', authMiddleware, deleteMemory);

  export default router;
  ```

### 6. Controller Modifications (Accessing Authenticated User)

- **Access User ID:** Within your controllers (e.g., `src/controllers/memory-controller.ts`), access the authenticated user's ID from the request object (e.g., `req.userId`) to perform user-specific operations (e.g., filtering memories by owner).

## Mermaid Diagrams

### Server-Side JWT Validation Flow:

```mermaid
graph TD
    A[Client (with JWT)] --> B{API Call to Server with Authorization: Bearer JWT};
    B --> C[Server-Side Auth Middleware];
    C --> D{Verify JWT using Supabase Service Role Key};
    D -- Valid --> E[Attach User ID to Request];
    E --> F[API Controller (e.g., Memory Controller)];
    F --> G[Perform User-Specific Logic];
    G --> H[Return Response to Client];
    D -- Invalid --> I[Return 401 Unauthorized];
```
