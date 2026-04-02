## BB84 Quantum Key Distribution Simulator

Interactive BB84 QKD demo with a **FastAPI + Qiskit** backend and a **Vite + React (TypeScript)** frontend.  
You can simulate:

- **BB84 key exchange**: prepare → send → compare bases → generate key
- **Eavesdropping attack models**:
  - **Intercept–resend**
  - **Partial (probabilistic) interception**
  - **Biased basis interception** (always uses the selected basis)
- **Photon loss** in the quantum channel
- **SHA-256 hashing** of the generated shared key

---

## Project structure

- `bb84_backend/`: FastAPI backend (Qiskit simulation + API)
- `bb84-frontend/`: React frontend (UI + simulation controls)

---

## Prerequisites

- **Python 3.10+** (recommended)
- **Node.js 18+** (recommended) and npm

---

## Backend setup (FastAPI)

From the repo root:

```bash
cd bb84_backend
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Backend will be available at:

- `GET /health` → health check
- Docs: `http://127.0.0.1:8000/docs`

---

## Frontend setup (Vite + React)

From the repo root:

```bash
cd bb84-frontend
npm install
npm run dev
```

---

## Environment variables

### Frontend

Create/edit `bb84-frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Notes:
- Vite only exposes variables prefixed with `VITE_`.
- After changing `.env`, **restart** `npm run dev`.

---

## How to run the full project

In two terminals:

1) Backend:

```bash
cd bb84_backend
source .venv/bin/activate
uvicorn app:app --reload --port 8000
```

2) Frontend:

```bash
cd bb84-frontend
npm run dev
```

Open the frontend URL printed by Vite (usually `http://localhost:5173`).

---

## Using the simulator

1) Choose **Mode**:
   - **Secure Channel** (no Eve)
   - **Eve Intercepts**
2) If Eve is enabled, choose **Attack**:
   - **Intercept-resend**
   - **Partial** (set interception probability)
   - **Biased basis** (choose + or ×)
3) Optionally adjust:
   - **Photon loss**
   - Simulation **speed**
   - Number of **qubits**
4) Run the steps:
   - **Prepare Qubits**
   - **Send Qubits**
   - **Compare Bases**
   - **Generate Key**

After key generation the UI shows:
- **Shared key**
- **SHA-256 hash** of the shared key
- **QBER** (error rate)

---

## Troubleshooting

- **Frontend can’t reach backend**
  - Verify backend is running on port 8000.
  - Check `bb84-frontend/.env` → `VITE_API_BASE_URL`.
  - Restart the Vite dev server after changing `.env`.

- **Slow backend / timeouts**
  - Qiskit simulation can be heavy depending on your environment.
  - Try fewer qubits (e.g., 8–16) during development.

---

## Notes

- The backend keeps simulation state in memory; use the UI reset/prepare flow for a clean run.

