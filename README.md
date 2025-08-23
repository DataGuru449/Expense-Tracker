# Expense-Tracker
```mermaid
flowchart LR
  %% ====== STYLES ======
  classDef fe fill:#E3F2FD,stroke:#1E88E5,color:#0D47A1,stroke-width:2px;
  classDef be fill:#E8F5E9,stroke:#43A047,color:#1B5E20,stroke-width:2px;
  classDef db fill:#FFF3E0,stroke:#FB8C00,color:#E65100,stroke-width:2px;
  classDef infra fill:#F3E5F5,stroke:#8E24AA,color:#4A148C,stroke-width:2px;
  classDef test fill:#EDE7F6,stroke:#5E35B1,color:#311B92,stroke-width:1px;
  classDef step fill:#FCE4EC,stroke:#D81B60,color:#880E4F,stroke-width:1px;

  %% ====== FRONTEND ======
  subgraph F[Frontend (React)]
    UI[React App (App.jsx)\n- Add Expense Form\n- Recent Table\n- Recharts KPIs]:::fe
    AX[Axios HTTP Client]:::fe
    ST[State & Hooks\nuseState, useEffect, useMemo]:::fe
  end

  %% ====== BACKEND ======
  subgraph B[Backend (Node.js / Express)]
    RT[Express Router\n/api/expenses]:::be
    CT[Controllers\nget, create, update, delete]:::be
    MD[Middleware\nJSON parse, CORS, validation]:::be
    MG[Mongoose Model\nExpense {date, category,\nmerchant, paymentMethod,\namount, notes}]:::be
  end

  %% ====== DATA ======
  subgraph D[Data Layer]
    DB[(MongoDB\nexpenses collection)]:::db
  end

  %% ====== INFRA ======
  CDN[Static Assets / Dev Server\n(Vite/CRA)]:::infra

  %% ====== TESTING ======
  subgraph T[Testing]
    FEtest[Jest + RTL (Frontend)]:::test
    BEtest[Jest + Supertest (Backend)]:::test
  end

  %% ====== FLOWS ======
  UI -- User input --> ST
  ST -- triggers API calls --> AX

  %% CRUD
  AX -- "GET /api/expenses":::step --> RT
  AX -- "POST /api/expenses":::step --> RT
  AX -- "PUT /api/expenses/:id":::step --> RT
  AX -- "DELETE /api/expenses/:id":::step --> RT

  %% Express pipeline
  RT --> MD --> CT --> MG --> DB
  DB --> MG --> CT --> RT --> AX

  %% Render updates
  AX -- "JSON data":::step --> ST
  ST -- updates --> UI

  %% Assets
  CDN -. serves FE bundle .- UI

  %% Tests
  FEtest -.-> UI
  BEtest -.-> RT
