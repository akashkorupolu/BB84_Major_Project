from fastapi import FastAPI, Query
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
import random
import hashlib

app = FastAPI(title="BB84 Quantum Key Distribution API (Qiskit)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow frontend requests
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Data Models
# ---------------------------
class Qubit(BaseModel):
    bit: int          # 0 or 1
    basis: str        # "+" (rectilinear) or "x" (diagonal)

class BobMeasure(BaseModel):
    basis: str        # Bob’s chosen basis

class ResetConfig(BaseModel):
    eve_count: int | None = None


# ---------------------------
# In-Memory State
# ---------------------------
qubits_sent = []      # Store Alice’s qubits
qubits_eve = []       # Single Eve intercepted results (legacy)
qubits_eves = []      # Multi-eve: list[eve_idx][qubit_idx] -> {basis, measured, qc}
eve_count = 0         # Active eavesdroppers in this run (0..4)
qubits_bob = []       # Bob’s measurements


def normalize_basis(b: str) -> str:
    """Canonical + / x only. Accepts Unicode diagonal sign × (U+00D7) and ASCII."""
    if b is None:
        return "+"
    t = str(b).strip()
    if t in ("x", "X", "×", "\u00d7"):
        return "x"
    return "+"


def _bit_value(v) -> int:
    """0/1 for comparisons (handles bool from JSON or simulators)."""
    if isinstance(v, bool):
        return int(v)
    return int(v) & 1


def sifted_bit_errors(alice_bits: list, bob_bits: list) -> int:
    """How often Alice's classical bit disagrees with Bob's outcome (sifted positions only)."""
    n = min(len(alice_bits), len(bob_bits))
    return sum(
        1
        for i in range(n)
        if _bit_value(alice_bits[i]) != _bit_value(bob_bits[i])
    )


def bb84_qber_fraction(errors: int, sifted_count: int) -> float:
    """Standard BB84 QBER on the sifted sample: errors / sifted_count → [0, 1]."""
    if sifted_count <= 0:
        return 0.0
    return float(errors) / float(sifted_count)


def bb84_qber_percent(errors: int, sifted_count: int) -> float:
    """Same as bb84_qber_fraction, percentage in [0, 100]."""
    return 100.0 * bb84_qber_fraction(errors, sifted_count)


def pick_eve_basis(attack_model: str, bias_basis: str, bias_prob: float) -> str:
    """
    attack_model:
      - "intercept-resend" (random basis)
      - "biased" (choose bias_basis with bias_prob)
    """
    bias_basis = normalize_basis(bias_basis)
    if attack_model == "biased":
        # Deterministic biased strategy: always pick the preferred basis.
        # This matches the UI expectation: if user selects rectilinear (+),
        # Eve always measures in + (same for diagonal x).
        return bias_basis
    return random.choice(["+", "x"])


# ---------------------------
# Helper: Prepare qubit state with Qiskit
# ---------------------------
def prepare_qubit(bit: int, basis: str):
    basis = normalize_basis(basis)
    qc = QuantumCircuit(1, 1)

    # Encode classical bit
    if bit == 1:
        qc.x(0)

    # Apply diagonal basis (Hadamard)
    if basis == "x":
        qc.h(0)

    return qc

def measure_qubit(qc: QuantumCircuit, basis: str) -> int:
    basis = normalize_basis(basis)
    # Apply measurement basis
    if basis == "x":
        qc.h(0)  # switch to diagonal basis

    qc.measure(0, 0)

    # New Qiskit API: transpile + run
    simulator = Aer.get_backend("aer_simulator")
    compiled_circuit = transpile(qc, simulator)
    result = simulator.run(compiled_circuit, shots=1).result()

    counts = result.get_counts()
    measured_bit = int(max(counts, key=counts.get))
    return measured_bit


# ---------------------------
# API Endpoints
# ---------------------------


@app.get("/")
def welcome():
    return {"message": "Welcome to api"}

@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/alice/send")
def alice_send(q: Qubit):
    """Alice prepares a qubit and stores it."""
    basis = normalize_basis(q.basis)
    qc = prepare_qubit(q.bit, basis)
    qubits_sent.append({"bit": q.bit, "basis": basis, "qc": qc})
    return {"msg": "Alice sent a qubit", "qubit": q}

@app.get("/eve/intercept/{index}")
def eve_intercept(
    index: int,
    attack_model: str = Query("intercept-resend"),
    intercept_prob: float = Query(1.0, ge=0.0, le=1.0),
    bias_basis: str = Query("+"),
    bias_prob: float = Query(0.75, ge=0.0, le=1.0),
):
    if index >= len(qubits_sent):
        return {"error": "Invalid qubit index"}

    # Partial attack: probabilistically choose whether Eve acts at all.
    if attack_model == "partial":
        if random.random() >= float(intercept_prob):
            if len(qubits_eve) <= index:
                qubits_eve.extend([None] * (index - len(qubits_eve) + 1))
            qubits_eve[index] = None
            return {"msg": "Eve skipped", "index": index, "acted": False}

    q = qubits_sent[index]
    eve_basis = pick_eve_basis(attack_model, bias_basis, bias_prob)
    eve_basis = normalize_basis(eve_basis)
    qc = q["qc"].copy()
    measured = measure_qubit(qc, eve_basis)

    # Save Eve’s collapsed qc internally
    eve_qc = prepare_qubit(measured, eve_basis)
    eve_result = {"basis": eve_basis, "measured": measured}

    if len(qubits_eve) <= index:
        qubits_eve.extend([None] * (index - len(qubits_eve) + 1))
    qubits_eve[index] = {"basis": eve_basis, "measured": measured, "qc": eve_qc}

    return {
        "msg": "Eve intercepted",
        "index": index,
        "acted": True,
        "eve_result": eve_result,
    }

@app.get("/eves/intercept/{index}")
def eves_intercept(
    index: int,
    count: int = Query(2, ge=2, le=4),
    attack_model: str = Query("intercept-resend"),
    bias_basis: str = Query("+"),
    bias_prob: float = Query(0.75, ge=0.0, le=1.0),
):
    global qubits_eves, eve_count
    if index >= len(qubits_sent):
        return {"error": "Invalid qubit index"}

    eve_count = count
    if len(qubits_eves) < eve_count:
        qubits_eves.extend([[] for _ in range(eve_count - len(qubits_eves))])

    qc_in = qubits_sent[index]["qc"].copy()
    results = []
    for e in range(eve_count):
        eve_basis = normalize_basis(pick_eve_basis(attack_model, bias_basis, bias_prob))
        qc_work = qc_in.copy()
        measured = measure_qubit(qc_work, eve_basis)
        eve_qc = prepare_qubit(measured, eve_basis)

        if len(qubits_eves[e]) <= index:
            qubits_eves[e].extend([None] * (index - len(qubits_eves[e]) + 1))
        qubits_eves[e][index] = {"basis": eve_basis, "measured": measured, "qc": eve_qc}

        results.append({"eve": e + 1, "basis": eve_basis, "measured": measured})
        qc_in = eve_qc

    return {"msg": "Eves intercepted", "index": index, "results": results}


@app.post("/bob/measure/{index}")
def bob_measure(index: int, b: BobMeasure, loss_prob: float = Query(0.0, ge=0.0, le=1.0)):
    if index >= len(qubits_sent):
        return {"error": "Invalid qubit index"}

    # Photon loss simulation: sometimes Bob receives nothing.
    if random.random() < float(loss_prob):
        if len(qubits_bob) <= index:
            qubits_bob.extend([None] * (index - len(qubits_bob) + 1))
        qubits_bob[index] = None
        return {"msg": "Photon lost in channel", "index": index, "lost": True}

    q = qubits_sent[index]

    qc = None
    if eve_count and len(qubits_eves) >= eve_count:
        last = qubits_eves[eve_count - 1]
        if len(last) > index and last[index]:
            eve_info = last[index]
            qc = prepare_qubit(eve_info["measured"], eve_info["basis"])
    if qc is None and len(qubits_eve) > index and qubits_eve[index]:
        eve_info = qubits_eve[index]
        qc = prepare_qubit(eve_info["measured"], eve_info["basis"])
    if qc is None:
        qc = q["qc"].copy()

    bob_basis = normalize_basis(b.basis)
    measured = measure_qubit(qc, bob_basis)

    bob_qc = prepare_qubit(measured, bob_basis)
    bob_result = {"basis": bob_basis, "measured": measured}

    if len(qubits_bob) <= index:
        qubits_bob.extend([None] * (index - len(qubits_bob) + 1))
    qubits_bob[index] = {"basis": bob_basis, "measured": measured, "qc": bob_qc}

    return {"msg": "Bob measured", "index": index, "lost": False, "bob_result": bob_result}


@app.get("/compare-bases")
def compare_bases():
    """Alice and Bob publicly compare bases, keep only matching ones."""
    if not qubits_sent or not qubits_bob:
        return {"error": "No qubits to compare"}

    matching_indices = []
    alice_key = []
    bob_key = []

    for i in range(min(len(qubits_sent), len(qubits_bob))):
        if not qubits_bob[i]:
            continue
        if normalize_basis(qubits_sent[i]["basis"]) == normalize_basis(
            qubits_bob[i]["basis"]
        ):
            matching_indices.append(i)
            alice_key.append(_bit_value(qubits_sent[i]["bit"]))
            bob_key.append(_bit_value(qubits_bob[i]["measured"]))

    n = len(alice_key)
    error_count = sifted_bit_errors(alice_key, bob_key) if n else 0
    qber_percent = bb84_qber_percent(error_count, n)

    return {
        "matching_indices": matching_indices,
        "alice_key": alice_key,
        "bob_key": bob_key,
        "error_count": error_count,
        "qber_percent": qber_percent,
    }


@app.get("/final-key")
def final_key():
    """Compute final shared key and error rate."""
    comp = compare_bases()
    if "error" in comp:
        return comp

    alice_key = comp["alice_key"]
    bob_key = comp["bob_key"]

    if not alice_key:
        return {"error": "No matching bases → no key"}

    errors = sifted_bit_errors(alice_key, bob_key)
    error_rate = bb84_qber_percent(errors, len(alice_key))

    # Only bits where Alice and Bob agree form the usable shared secret (after sifting).
    agreeing_bits = [
        alice_key[i]
        for i in range(len(alice_key))
        if _bit_value(alice_key[i]) == _bit_value(bob_key[i])
    ]

    if error_rate < 20:
        shared_key = "".join(map(str, agreeing_bits))
        sha256 = (
            hashlib.sha256(shared_key.encode("utf-8")).hexdigest()
            if shared_key
            else None
        )
        return {
            "shared_key": shared_key,
            "shared_key_sha256": sha256,
            "error_rate": error_rate,
            "sifted_count": len(alice_key),
            "agreeing_count": len(agreeing_bits),
        }
    else:
        return {
            "msg": "High error rate detected → possible eavesdropper",
            "error_rate": error_rate,
            "sifted_count": len(alice_key),
            "agreeing_count": len(agreeing_bits),
        }


@app.post("/reset")
def reset(cfg: ResetConfig | None = None):
    """Reset all stored data (for new simulation)."""
    global qubits_sent, qubits_eve, qubits_eves, qubits_bob, eve_count
    qubits_sent = []
    qubits_eve = []
    qubits_eves = []
    qubits_bob = []
    eve_count = int(cfg.eve_count) if cfg and cfg.eve_count is not None else 0
    return {"msg": "State reset"}
