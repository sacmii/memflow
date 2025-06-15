Of course! Here is a detailed and professionally formatted README file based on the provided project information. I've expanded on the sections, added examples, and structured it to be clear for anyone wanting to use or contribute to the project.

---

# 🧠 Memory Bank API for LLMs

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

A lightweight, Dockerized **Memory Bank API** built to provide persistent, retrievable memory for **Large Language Models (LLMs)** like Claude, GPT, and others. This project is designed to overcome the context window limitations of LLMs by giving them a long-term memory store.

It's built for easy integration with AI development tools like **Google AI Studio**, custom scripts, or any application that interacts with an LLM. The backend is powered by **Supabase** for its simplicity and robust PostgreSQL features, and it comes with a **basic web dashboard** to view and manage stored memories.

---

## 📌 Key Features

-   🧠 **Persistent Memory:** Save key pieces of information, conversation summaries, or user preferences as "memory chunks."
-   🔍 **Flexible Retrieval:** Fetch memories using powerful filters, including tags, date ranges, and keyword limits.
-   🏷️ **Tagging System:** Organize memories with custom tags for context-specific retrieval (e.g., `project-alpha`, `user-preferences`).
-   🌐 **Simple REST API:** A clean and straightforward API for storing (`POST`) and retrieving (`GET`) memories.
-   🖥️ **Web Dashboard:** A minimal UI to view, search, and filter all saved memories in your database.
-   🐳 **Dockerized:** Packaged with Docker and Alpine Linux for a lightweight, consistent, and easy-to-deploy environment.
-   🚀 **Scalable Backend:** Built on Supabase (PostgreSQL), enabling future expansion to features like semantic search with `pgvector`.

---

## ⚙️ Tech Stack

-   **Backend:** Node.js + Express
-   **Database:** Supabase (PostgreSQL)
-   **Frontend Dashboard:** React (or Plain HTML/CSS/JS)
-   **Containerization:** Docker (Alpine Linux)

---

## 🚀 Getting Started

Follow these steps to get the Memory Bank API running locally.

### Prerequisites

-   [Docker](https://www.docker.com/get-started) installed on your machine.
-   A free [Supabase](https://supabase.com/) account.
-   [Git](https://git-scm.com/) for cloning the repository.

### 1. Clone the Repository

```sh
git clone <your-repository-url>
cd memory-bank-api
```

### 2. Set Up Supabase

1.  Go to your [Supabase Dashboard](https://app.supabase.com) and create a new project.
2.  Once the project is ready, navigate to the **SQL Editor**.
3.  Click **New query** and run the following SQL to create the `memory` table:

```sql
-- Create the memory table
CREATE TABLE public.memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Optional: Enable Row Level Security (RLS) for future use
ALTER TABLE public.memory ENABLE ROW LEVEL SECURITY;

-- Optional: Create a policy that allows public read access (for anon key)
-- For production, you should create more restrictive policies.
CREATE POLICY "Public read access" ON public.memory
  FOR SELECT USING (true);

-- Optional: Create a policy that allows authenticated write access
CREATE POLICY "Users can insert their own memories" ON public.memory
  FOR INSERT WITH CHECK (true); -- Adjust this based on your auth rules
```

### 3. Configure Environment Variables

1.  In your Supabase project, go to **Project Settings > API**.
2.  Find your **Project URL** and your **API Keys** (`anon` and `service_role`).
3.  Create a `.env` file in the root of the project by copying the example:

    ```sh
    cp .env.example .env
    ```

4.  Open the `.env` file and add your Supabase credentials. For backend services, using the `service_role` key is recommended as it bypasses any Row Level Security (RLS) policies.

    ```env
    # .env
    SUPABASE_URL=https://your-project-id.supabase.co
    SUPABASE_KEY=your-supabase-service-role-key
    ```

### 4. Build and Run with Docker

Build the Docker image and run the container. The `--env-file` flag will load your credentials securely.

```sh
# Build the Docker image
docker build -t memory-api .

# Run the container
docker run -p 3000:3000 --env-file .env memory-api
```

Your API is now running at `http://localhost:3000`.

---

## 🔌 API Reference

All requests must include an `apikey` header containing your Supabase API Key (`anon` or `service_role`).

### `POST /memory`

Saves a new memory entry to the database.

**Request Body:**

```json
{
  "content": "The user's favorite color is blue.",
  "tags": ["user-preferences", "color"]
}
```

**Example `curl` Request:**

```sh
curl -X POST http://localhost:3000/memory \
  -H "Content-Type: application/json" \
  -H "apikey: <YOUR_SUPABASE_KEY>" \
  -d '{
    "content": "The user mentioned they are working on a project named \'Project Phoenix\'.",
    "tags": ["project-phoenix", "user-work"]
  }'
```

**Success Response (201 Created):**

```json
{
  "message": "Memory created successfully",
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "content": "The user mentioned they are working on a project named 'Project Phoenix'.",
      "tags": ["project-phoenix", "user-work"],
      "created_at": "2023-10-27T10:00:00Z"
    }
  ]
}
```

### `GET /memory`

Retrieves memory entries based on query parameters.

**Query Parameters:**

| Parameter | Type     | Description                                                              |
| :-------- | :------- | :----------------------------------------------------------------------- |
| `limit`   | `number` | The maximum number of memories to return. Defaults to `10`.              |
| `tag`     | `string` | Filter memories containing this specific tag.                            |
| `from`    | `string` | ISO 8601 timestamp. Retrieve memories created after this date.           |
| `to`      | `string` | ISO 8601 timestamp. Retrieve memories created before this date.          |

**Example `curl` Requests:**

1.  **Get latest 5 memories:**
    ```sh
    curl "http://localhost:3000/memory?limit=5" -H "apikey: <YOUR_SUPABASE_KEY>"
    ```

2.  **Get all memories with the tag `user-preferences`:**
    ```sh
    curl "http://localhost:3000/memory?tag=user-preferences" -H "apikey: <YOUR_SUPABASE_KEY>"
    ```

3.  **Get memories from a specific date range:**
    ```sh
    curl "http://localhost:3000/memory?from=2023-01-01T00:00:00Z&to=2023-01-31T23:59:59Z" -H "apikey: <YOUR_SUPABASE_KEY>"
    ```

**Success Response (200 OK):**

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "content": "The user's favorite color is blue.",
    "tags": ["user-preferences", "color"],
    "created_at": "2023-10-26T18:30:00Z"
  }
]
```

### `DELETE /memory`

Deletes memory entries by `id` or `tag`.

**Query Parameters:**

| Parameter | Type     | Description                                  |
| :-------- | :------- | :------------------------------------------- |
| `id`      | `string` | The UUID of the single memory to delete.     |
| `tag`     | `string` | Deletes **all** memories with this tag.      |

**Example `curl` Requests:**

1.  **Delete a single memory by ID:**
    ```sh
    curl -X DELETE "http://localhost:3000/memory?id=a1b2c3d4-e5f6-7890-1234-567890abcdef" \
      -H "apikey: <YOUR_SUPABASE_KEY>"
    ```

2.  **Delete all memories with the tag `project-phoenix`:**
    ```sh
    curl -X DELETE "http://localhost:3000/memory?tag=project-phoenix" \
      -H "apikey: <YOUR_SUPABASE_KEY>"
    ```

---

## 🖥️ Dashboard (Memory Viewer)

Once the container is running, you can access a simple web dashboard to view and manage your memories.

-   **URL:** `http://localhost:3000`
-   **Features:**
    -   View all saved memories in a table.
    -   Filter memories by tag.
    -   Filter memories by a date range.
    -   Sort by creation date.

---

## 📦 Project Structure

```
.
├── api/
│   ├── index.js        # Express server entry point
│   ├── routes/         # API routes (e.g., memory.js)
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/            # React source files
│   └── package.json
├── .env                # Local environment variables (ignored by git)
├── .env.example        # Example environment file
├── .gitignore
├── Dockerfile          # Docker configuration
└── README.md
```

---

## 📍 Roadmap

-   [x] Basic save (`POST`) and fetch (`GET`) endpoints
-   [x] Filter by tags and date range
-   [x] Basic web dashboard for viewing memories
-   [ ] **Semantic Search:** Integrate `pgvector` for similarity-based memory retrieval.
-   [ ] **Advanced Auth:** Implement scoped access using Supabase RLS and JWTs.
-   [ ] **LLM Integration Guides:** Provide detailed examples for Claude, OpenAI, and LangChain.
-   [ ] **Advanced Dashboard:** Add analytics, a tag manager, and in-line editing.
-   [ ] **Batch Operations:** Endpoints for creating and deleting memories in bulk.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

1.  Fork the repository.
2.  Create a new feature branch (`git checkout -b feature/your-feature-name`).
3.  Commit your changes (`git commit -m 'Add some feature'`).
4.  Push to the branch (`git push origin feature/your-feature-name`).
5.  Open a Pull Request.

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.