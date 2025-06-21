# Postman Collection Plan: MemFlow API

This document outlines the structure and details for a Postman collection to interact with the MemFlow API.

## Collection Variables

- `baseUrl`: `http://localhost:3000` (This should be updated to the deployed URL if applicable)
- `accessToken`: (This variable will hold the JWT obtained from Supabase authentication)
- `memoryId`: (This variable will be set dynamically after creating a memory, for use in subsequent requests)

## Collection Structure

```
MemFlow API
├── Authentication (Pre-requisite)
│   └── Get Access Token (Instructions Only)
└── Memories
    ├── Create Memory
    ├── Search Memories
    ├── Get Memory by ID
    ├── Update Memory by ID
    └── Delete Memory by ID
```

## Detailed Request Specifications

### Folder: Authentication (Pre-requisite)

This section provides instructions on how to obtain an `accessToken` from Supabase, as the backend itself does not expose a direct login/signup endpoint.

#### Request: Get Access Token (Instructions Only)

- **Method:** N/A (This is an informational request, not an actual API call to this backend)
- **Description:**
  To obtain an `accessToken`, you need to authenticate with your Supabase project. This typically involves:

  1.  **Using the Supabase Client Library:** If you have a frontend application, use the Supabase JavaScript client (or your language's equivalent) to sign up or sign in a user.
      ```javascript
      // Example using Supabase JS client
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'user@example.com',
        password: 'your-password',
      });
      if (data.session) {
        console.log(data.session.access_token); // This is your accessToken
      }
      ```
  2.  **Direct Supabase API Call:** You can also make a direct `POST` request to your Supabase project's `auth/v1/token` endpoint.
      - **URL:** `YOUR_SUPABASE_URL/auth/v1/token`
      - **Headers:** `Content-Type: application/json`
      - **Body (raw, JSON):**
        ```json
        {
          "email": "user@example.com",
          "password": "your-password"
        }
        ```
      - **Response:** Look for `access_token` in the response.

  **Once you have obtained the `access_token`, set it as the value for the `accessToken` collection variable in Postman.**

### Folder: Memories

All requests in this folder require authentication. Ensure the `accessToken` collection variable is set.

#### Request: Create Memory

- **Method:** `POST`
- **URL:** `{{baseUrl}}/memory`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{accessToken}}`
- **Body (raw, JSON):**
  ```json
  {
    "content": "This is a new memory about a great idea for a project."
  }
  ```
- **Tests (Post-request script):**
  ```javascript
  // Extract memory ID from response and set as collection variable
  const responseJson = pm.response.json();
  if (responseJson && responseJson.data && responseJson.data.id) {
    pm.collectionVariables.set('memoryId', responseJson.data.id);
    console.log('Memory ID set:', responseJson.data.id);
  }
  ```
- **Description:** Creates a new memory for the authenticated user. The `content` field is required.

#### Request: Search Memories

- **Method:** `GET`
- **URL:** `{{baseUrl}}/memory`
- **Headers:**
  - `Authorization`: `Bearer {{accessToken}}`
- **Query Parameters (Optional):**
  - `limit`: (e.g., `5`) - Maximum number of memories to return.
  - `tag`: (e.g., `idea`) - Filter memories by a specific tag.
  - `keyword`: (e.g., `project`) - Search for memories containing this keyword in their content.
- **Description:** Retrieves a list of memories for the authenticated user. Supports optional filtering by `limit`, `tag`, and `keyword`.

#### Request: Get Memory by ID

- **Method:** `GET`
- **URL:** `{{baseUrl}}/memory/{{memoryId}}`
- **Headers:**
  - `Authorization`: `Bearer {{accessToken}}`
- **Description:** Retrieves a single memory by its unique ID. The `memoryId` variable should be set from a previous "Create Memory" request.

#### Request: Update Memory by ID

- **Method:** `PUT`
- **URL:** `{{baseUrl}}/memory/{{memoryId}}`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{accessToken}}`
- **Body (raw, JSON):**
  ```json
  {
    "content": "This is an updated memory about an amazing idea for a new feature.",
    "tags": ["updated", "feature", "idea"]
  }
  ```
- **Description:** Updates an existing memory. Both `content` and `tags` fields in the request body are optional; only provided fields will be updated.

#### Request: Delete Memory by ID

- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/memory/{{memoryId}}`
- **Headers:**
  - `Authorization`: `Bearer {{accessToken}}`
- **Description:** Deletes a memory by its ID. A successful deletion will return a `204 No Content` status.

---

## API Flow Diagram

```mermaid
graph TD
    A[User Authenticates with Supabase] --> B{Obtain JWT (accessToken)};
    B --> C[Set Postman Collection Variable: accessToken];

    subgraph MemFlow API Backend
        D[POST /memory] --> E[Create Memory];
        E -- Returns memoryId --> F[Set Postman Collection Variable: memoryId];
        F --> G[GET /memory];
        G --> H[Search Memories];
        H --> I[GET /memory/:id];
        I --> J[Get Specific Memory];
        J --> K[PUT /memory/:id];
        K --> L[Update Memory];
        L --> M[DELETE /memory/:id];
        M --> N[Delete Memory];
    end

    C --> D;
    C --> G;
    C --> I;
    C --> K;
    C --> M;
```
