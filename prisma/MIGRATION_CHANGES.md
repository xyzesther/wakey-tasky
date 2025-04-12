# Prisma Migration Changes

## 20250411211347_updated_schema

- Updated the database schema to include:
  - Modified User model structure
  - Added MainTask model
  - Added Subtask model
  - Established relationships between models

## 20250411214702_add_status_model

- Added Status model with fields:
  - id: String (Primary Key)
  - name: String
- Created relationships:
  - Status to MainTask (one-to-many)
  - Status to Subtask (one-to-many)
- Added default status "PENDING" for both MainTask and Subtask

## Current Schema Structure

```prisma
model User {
  id                     String     @id @default(uuid())
  hasAddedThreeMainTasks Boolean    @default(false)
  tasks                  MainTask[]
}

model MainTask {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  title       String
  description String?
  subtasks    Subtask[]
  status      Status    @relation(fields: [statusId], references: [id])
  statusId    String    @default("PENDING")
}

model Subtask {
  id          String   @id @default(uuid())
  taskId      String
  task        MainTask  @relation(fields: [taskId], references: [id])
  title       String
  description String?
  startAt     DateTime?
  endAt       DateTime?
  status      Status    @relation(fields: [statusId], references: [id])
  statusId    String    @default("PENDING")
}

model Status {
  id        String     @id
  name      String
  mainTasks MainTask[]
  subtasks  Subtask[]
}
```
