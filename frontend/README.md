# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
flowchart LR
  %% ====== STYLES ======
  classDef fe fill:#E3F2FD,stroke:#1E88E5,color:#0D47A1,stroke-width:2px;
  classDef be fill:#E8F5E9,stroke:#43A047,color:#1B5E20,stroke-width:2px;
  classDef db fill:#FFF3E0,stroke:#FB8C00,color:#E65100,stroke-width:2px;
  classDef infra fill:#F3E5F5,stroke:#8E24AA,color:#4A148C,stroke-width:2px;
  classDef step fill:#FCE4EC,stroke:#D81B60,color:#880E4F,stroke-width:1px;

  %% ====== FRONTEND ======
  subgraph F[Frontend (React)]
    UI[React App (App.jsx)\n- Form (Add Expense)\n- Table (Recent)\n- Charts (Recharts)\n- KPI (Total Spend)]:::fe
    AX[Axios HTTP Client]:::fe
    ST[State & Hooks\nuseState/useEffect/useMemo]:::fe
  end

  %% ====== BACKEND ======
  subgraph B[Backend (Node.js / Express)]
    RT[Express Router\n/api/expenses]:::be
    CT[Controllers\nget/create/update/delete]:::be
    MD[Middleware\nJSON parse, CORS, validation]:::be
    MG[Mongoose Model\nExpense {date, category,\nmerchant, paymentMethod,\namount, notes}]:::be
  end

  %% ====== DATA ======
  subgraph D[Data Layer]
    DB[(MongoDB\nexpenses collection)]:::db
  end

  %% ====== (Optional Infra) ======
  CDN[Static Assets / Dev Server\n(Vite/CRA)]:::infra

  %% ====== FLOWS ======
  UI -- User input --> ST
  ST -- triggers calls --> AX

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
  ST -- re-compute --> UI

  %% Assets
  CDN -. serves FE bundle .- UI
