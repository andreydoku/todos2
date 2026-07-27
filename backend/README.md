# Backend API

Base URLs:
- **dev:** `https://y4dpl1wdu1.execute-api.us-east-2.amazonaws.com`
- **prod:** *(set after prod stack is deployed)*

---

## Endpoints

### GET /todos
List all todos.

```bash
curl https://y4dpl1wdu1.execute-api.us-east-2.amazonaws.com/todos
```

**Response 200:**
```json
[
  {
    "id": "e2a1f3b4-...",
    "title": "Buy groceries",
    "completed": false,
    "createdAt": "2026-07-19T12:00:00.000Z"
  }
]
```

---

### POST /todos
Create a new todo.

```bash
curl -X POST https://y4dpl1wdu1.execute-api.us-east-2.amazonaws.com/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries"}'
```

**Response 201:**
```json
{
  "id": "e2a1f3b4-...",
  "title": "Buy groceries",
  "completed": false,
  "createdAt": "2026-07-19T12:00:00.000Z"
}
```

**Response 400** (missing title):
```json
{ "error": "title is required" }
```

---

### PUT /todos/{id}
Update one or more fields on a todo. Supports `title` and `completed` in any combination. `id` and `createdAt` cannot be changed.

Update completed only:
```bash
curl -X PUT https://y4dpl1wdu1.execute-api.us-east-2.amazonaws.com/todos/e2a1f3b4-... \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

Update title only:
```bash
curl -X PUT https://y4dpl1wdu1.execute-api.us-east-2.amazonaws.com/todos/e2a1f3b4-... \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy organic groceries"}'
```

Update both title and completed:
```bash
curl -X PUT https://y4dpl1wdu1.execute-api.us-east-2.amazonaws.com/todos/e2a1f3b4-... \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy organic groceries", "completed": true}'
```

**Response 200:**
```json
{
  "id": "e2a1f3b4-...",
  "title": "Buy organic groceries",
  "completed": true,
  "createdAt": "2026-07-19T12:00:00.000Z"
}
```

**Response 400** (no fields provided):
```json
{ "error": "at least one of title or completed is required" }
```

**Response 400** (empty title):
```json
{ "error": "title cannot be empty" }
```

**Response 400** (non-boolean completed):
```json
{ "error": "completed must be a boolean" }
```

**Response 404** (id not found):
```json
{ "error": "todo not found" }
```

---

### DELETE /todos/{id}
Delete a todo.

```bash
curl -X DELETE https://y4dpl1wdu1.execute-api.us-east-2.amazonaws.com/todos/e2a1f3b4-...
```

**Response 204:** *(no body)*

**Response 404** (id not found):
```json
{ "error": "todo not found" }
```
