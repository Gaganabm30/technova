# TechNova Enterprise Workflow

AI-Powered Employee Workflow & Productivity Management System with role-based access control (Admin, Manager, Team Lead, Employee), automated productivity metrics, and intelligent capacity planning.

## Features
- **Multi-Role Portals**: Distinct dashboards and granular authorization for Admin, Manager, Team Lead, and Employee.
- **Workflow & Sprint Management**: Kanban boards, task lists, calendar timeline, attachments, and project milestones.
- **AI Intelligence Suite**:
  - AI Daily Brief for morning executive overviews
  - AI Workload Analysis for team capacity and burnout risk prediction
  - AI Assistant Chat with workspace context awareness
  - AI Daily Planner with capacity-aware task scheduling
  - AI Meeting Notes Parser for automatic action-item extraction
- **Analytics & Exports**: Department productivity KPIs, velocity metrics, and tenant-scoped CSV exports.
- **Deployment Ready**: Built-in production support for Render and Netlify.

## Run Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env`:
   ```bash
   cp .env.example .env
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

## Production Build & Tests
- `npm run build` — Compile frontend Vite SPA
- `npm test` — Run all unit and integration test suites
- `npm start` — Run production server serving static frontend from `dist/`
