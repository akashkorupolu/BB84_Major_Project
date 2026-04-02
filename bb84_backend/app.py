import matplotlib
matplotlib.use("Agg")
from fastapi import FastAPI,Query
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from qiskit import QuantumCircuit, transpile,QuantumRegister, ClassicalRegister
from qiskit_aer import Aer
import random
import hashlib
import matplotlib.pyplot as plt
from qiskit.visualization import plot_bloch_vector, circuit_drawer, plot_state_city
from qiskit.quantum_info import Statevector
import io
import base64
from fastapi.responses import JSONResponse
from qiskit.quantum_info import Pauli
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

def pick_eve_basis(attack_model: str, bias_basis: str, bias_prob: float) -> str:
    """
    attack_model:
      - "intercept-resend" (random basis)
      - "biased" (choose bias_basis with bias_prob)
    """
    if attack_model == "biased":
        # Deterministic biased strategy: always pick the preferred basis.
        # This matches the UI expectation: if user selects rectilinear (+),
        # Eve always measures in + (same for diagonal x).
        return bias_basis if bias_basis in ["+", "x"] else "+"
    return random.choice(["+", "x"])


# ---------------------------
# Helper: Prepare qubit state with Qiskit
# ---------------------------
def fig_to_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)
    return encoded

def prepare_qubit(bit: int, basis: str):
    qc = QuantumCircuit(1, 1)

    # Encode classical bit
    if bit == 1:
        qc.x(0)

    # Apply diagonal basis (Hadamard)
    if basis == "x":
        qc.h(0)

    return qc

def measure_qubit(qc: QuantumCircuit, basis: str) -> int:
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



def build_alice_circuit():
    n = len(qubits_sent)
    qr = QuantumRegister(n, "q")
    qc = QuantumCircuit(qr)

    for i, q in enumerate(qubits_sent):
        if q["bit"] == 1:
            qc.x(qr[i])
        if q["basis"] == "x":
            qc.h(qr[i])

    return qc

def build_eve_circuit():
    n = len(qubits_sent)
    qr = QuantumRegister(n, "q")
    cr = ClassicalRegister(n, "c")
    qc = QuantumCircuit(qr, cr)

    for i in range(n):
        if i < len(qubits_eve) and qubits_eve[i]:  # Eve acted
            eve_basis = qubits_eve[i]["basis"]
            if eve_basis == "x":
                qc.h(qr[i])
            qc.measure(qr[i], cr[i])
            qc.reset(qr[i])
            if qubits_eve[i]["measured"] == 1:
                qc.x(qr[i])
            if eve_basis == "x":
                qc.h(qr[i])

    return qc

def build_bob_circuit():
    n = len(qubits_sent)
    qr = QuantumRegister(n, "q")
    cr = ClassicalRegister(n, "c")
    qc = QuantumCircuit(qr, cr)

    for i in range(n):
        if i < len(qubits_bob) and qubits_bob[i]:
            bob_basis = qubits_bob[i]["basis"]
            if bob_basis == "x":
                qc.h(qr[i])
            qc.measure(qr[i], cr[i])

    return qc
# ---------------------------
# API Endpoints
# ---------------------------

@app.get("/")
def welcome():
    return {"message":"Welcome to api"}

@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/alice/send")
def alice_send(q: Qubit):
    """Alice prepares a qubit and stores it."""
    qc = prepare_qubit(q.bit, q.basis)
    qubits_sent.append({"bit": q.bit, "basis": q.basis, "qc": qc})
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
        eve_basis = pick_eve_basis(attack_model, bias_basis, bias_prob)
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

    measured = measure_qubit(qc, b.basis)

    # Keep Bob's QC in memory only
    bob_qc = prepare_qubit(measured, b.basis)
    bob_result = {"basis": b.basis, "measured": measured}

    if len(qubits_bob) <= index:
        qubits_bob.extend([None] * (index - len(qubits_bob) + 1))
    qubits_bob[index] = {"basis": b.basis, "measured": measured, "qc": bob_qc}  # ✅ keep qc in memory

    # Return only JSON-safe data
    return {"msg": "Bob measured", "index": index, "lost": False, "bob_result": bob_result}
# @app.get("/eve/intercept/{index}")
# def eve_intercept(index: int):
#     """Eve intercepts qubit and measures it with random basis."""
#     if index >= len(qubits_sent):
#         return {"error": "Invalid qubit index"}

#     q = qubits_sent[index]
#     eve_basis = random.choice(["+", "x"])

#     qc = q["qc"].copy()
#     measured = measure_qubit(qc, eve_basis)

#     eve_result = {"basis": eve_basis, "measured": measured}
#     if len(qubits_eve) <= index:
#         qubits_eve.extend([None] * (index - len(qubits_eve) + 1))
#     qubits_eve[index] = eve_result

#     return {"msg": "Eve intercepted", "index": index, "eve_result": eve_result}


# @app.post("/bob/measure/{index}")
# def bob_measure(index: int, b: BobMeasure):
#     """Bob measures qubit at position `index` with his basis."""
#     if index >= len(qubits_sent):
#         return {"error": "Invalid qubit index"}

#     q = qubits_sent[index]

#     # If Eve already measured, collapse happened
#     if len(qubits_eve) > index and qubits_eve[index]:
#         eve_info = qubits_eve[index]
#         qc = prepare_qubit(eve_info["measured"], eve_info["basis"])
#     else:
#         qc = q["qc"].copy()

#     measured = measure_qubit(qc, b.basis)

#     bob_result = {"basis": b.basis, "measured": measured}
#     if len(qubits_bob) <= index:
#         qubits_bob.extend([None] * (index - len(qubits_bob) + 1))
#     qubits_bob[index] = bob_result

#     return {"msg": "Bob measured", "index": index, "bob_result": bob_result}


@app.get("/compare-bases")
def compare_bases():
    """Alice and Bob publicly compare bases, keep only matching ones."""
    if not qubits_sent or not qubits_bob:
        return {"error": "No qubits to compare"}
    
    # print("Alice");
    # for i in range(len(qubits_sent)):
    #     print({"bit":qubits_sent[i]["bit"], "basis":qubits_sent[i]["basis"]})
    # print("Eve");
    # for i in range(len(qubits_eve)):
    #     print({"bit":qubits_eve[i]["measured"], "basis":qubits_eve[i]["basis"]})
    # print("Bob");
    # for i in range(len(qubits_bob)):
    #     print({"bit":qubits_bob[i]["measured"], "basis":qubits_bob[i]["basis"]})

    matching_indices = []
    alice_key = []
    bob_key = []

    for i in range(min(len(qubits_sent), len(qubits_bob))):
        if not qubits_bob[i]:
            continue
        if qubits_sent[i]["basis"] == qubits_bob[i]["basis"]:
            matching_indices.append(i)
            alice_key.append(qubits_sent[i]["bit"])
            bob_key.append(qubits_bob[i]["measured"])

    # print({
    #     "matching_indices": matching_indices,
    #     "alice_key": alice_key,
    #     "bob_key": bob_key
    # })

    return {
        "matching_indices": matching_indices,
        "alice_key": alice_key,
        "bob_key": bob_key
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

    errors = sum(1 for i in range(len(alice_key)) if alice_key[i] != bob_key[i])
    error_rate = (errors / len(alice_key)) * 100

    if error_rate < 20:
        shared_key = "".join(map(str, alice_key))
        sha256 = hashlib.sha256(shared_key.encode("utf-8")).hexdigest()
        return {
            "shared_key": shared_key,
            "shared_key_sha256": sha256,
            "error_rate": error_rate
        }
    else:
        return {
            "msg": "High error rate detected → possible eavesdropper",
            "error_rate": error_rate
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


@app.get("/visualize/overall-circuit")
def visualize_overall(eve: str = Query("false")):
    """
    Build and return the entire BB84 protocol as one big circuit diagram.
    eve: "true"/"false"/"1"/"0"/etc as query param.
    """
    # Normalize string → bool
    eve_normalized = str(eve).lower() in ["true", "1", "yes", "on"]

    n = len(qubits_sent)
    if n == 0:
        return {"error": "No qubits yet, run simulation first."}

    qr = QuantumRegister(n, "q")
    cr = ClassicalRegister(n, "c")
    qc = QuantumCircuit(qr, cr)

    alice_bits = [q["bit"] for q in qubits_sent]
    alice_bases = [q["basis"] for q in qubits_sent]
    bob_bases = [b["basis"] if b else "+" for b in qubits_bob]

    for i in range(n):
        # Alice encodes
        if alice_bits[i] == 1:
            qc.x(qr[i])
        if alice_bases[i] == "x":
            qc.h(qr[i])

        # Optional Eve
        if eve_normalized and i < len(qubits_eve) and qubits_eve[i]:
            eve_basis = qubits_eve[i]["basis"]
            if eve_basis == "x":
                qc.h(qr[i])
            qc.measure(qr[i], cr[i])
            qc.reset(qr[i])
            if qubits_eve[i]["measured"] == 1:
                qc.x(qr[i])
            if eve_basis == "x":
                qc.h(qr[i])

        # Bob
        if i < len(bob_bases) and bob_bases[i] == "x":
            qc.h(qr[i])
        qc.measure(qr[i], cr[i])

    fig = qc.draw("mpl")
    encoded = fig_to_base64(fig)
    return {"img_base64": encoded}

@app.get("/visualize/overall/alice")
def visualize_overall_alice():
    if not qubits_sent:
        return {"error": "No qubits prepared yet."}
    qc = build_alice_circuit()
    fig = qc.draw("mpl")
    return {"img_base64": fig_to_base64(fig)}

@app.get("/visualize/overall/eve")
def visualize_overall_eve():
    if not qubits_eve:
        return {"error": "Eve has not intercepted any qubits."}
    qc = build_eve_circuit()
    fig = qc.draw("mpl")
    return {"img_base64": fig_to_base64(fig)}

@app.get("/visualize/overall/bob")
def visualize_overall_bob():
    if not qubits_bob:
        return {"error": "Bob has not measured any qubits yet."}
    qc = build_bob_circuit()
    fig = qc.draw("mpl")
    return {"img_base64": fig_to_base64(fig)}


@app.get("/visualize/{index}")
def visualize_qubit(index: int):
    """Return both circuit diagram and Bloch sphere in one request."""
    if index >= len(qubits_sent):
        return {"error": "Invalid qubit index"}

    qc = qubits_sent[index]["qc"]
    state = Statevector.from_instruction(qc)

    # --- Circuit ---
    fig_circuit = circuit_drawer(qc, output="mpl")
    circuit_base64 = fig_to_base64(fig_circuit)

    # --- Bloch ---
    from qiskit.quantum_info import Pauli
    bloch_vector = [
        state.expectation_value(Pauli("X")).real,
        state.expectation_value(Pauli("Y")).real,
        state.expectation_value(Pauli("Z")).real,
    ]
    fig_bloch = plot_bloch_vector(bloch_vector)
    bloch_base64 = fig_to_base64(fig_bloch)

    return {"circuit": circuit_base64, "bloch": bloch_base64}


@app.get("/visualize/circuit/{index}")
def visualize_circuit(index: int):
    """Return a base64-encoded circuit diagram for qubit at index."""
    if index >= len(qubits_sent):
        return {"error": "Invalid qubit index"}

    qc = qubits_sent[index]["qc"]
    fig = circuit_drawer(qc, output="mpl")
    encoded = fig_to_base64(fig)
    return {"img_base64": encoded}


@app.get("/visualize/{who}/{index}")
def visualize_qubit(who: str, index: int):
    """
    Visualize qubit state for Alice, Eve, or Bob.
    who = 'alice' | 'eve' | 'bob'
    """
    qsource = None
    if who == "alice" and index < len(qubits_sent):
        qsource = qubits_sent[index]["qc"]
    elif who == "eve" and index < len(qubits_eve) and qubits_eve[index]:
        qsource = qubits_eve[index]["qc"]
    elif who == "bob" and index < len(qubits_bob) and qubits_bob[index]:
        qsource = qubits_bob[index]["qc"]
    else:
        return {"error": "No data for this participant/index"}

    # Circuit diagram
    fig_circuit = circuit_drawer(qsource, output="mpl")
    circuit_base64 = fig_to_base64(fig_circuit)

    # Bloch vector
    state = Statevector.from_instruction(qsource)
    from qiskit.quantum_info import Pauli
    bloch_vector = [
        state.expectation_value(Pauli("X")).real,
        state.expectation_value(Pauli("Y")).real,
        state.expectation_value(Pauli("Z")).real,
    ]
    fig_bloch = plot_bloch_vector(bloch_vector)
    bloch_base64 = fig_to_base64(fig_bloch)

    return {"circuit": circuit_base64, "bloch": bloch_base64}

@app.get("/visualize/bloch/{index}")
def visualize_bloch(index: int):
    """Return a Bloch sphere for qubit state at index."""
    if index >= len(qubits_sent):
        return {"error": "Invalid qubit index"}

    qc = qubits_sent[index]["qc"]
    state = Statevector.from_instruction(qc)

    # ✅ Compute Bloch vector with Pauli operators
    bloch_vector = [
        state.expectation_value(Pauli("X")).real,
        state.expectation_value(Pauli("Y")).real,
        state.expectation_value(Pauli("Z")).real,
    ]

    fig = plot_bloch_vector(bloch_vector)
    encoded = fig_to_base64(fig)
    return {"img_base64": encoded}
