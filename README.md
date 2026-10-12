# MediQueue — Hospital Queue Management System (Frontend)

Production-grade, clinical-fidelity frontend application built for **MediQueue Hospital Management System** (`projects/13982149500488385239`).

---

## 🏥 Overview

MediQueue provides a dual-suite digital queuing infrastructure for acute care hospitals and outpatient clinics:
1. **Clinical Staff Suite**: For receptionists, triage nurses, and physicians to manage inflow and call patients.
2. **Patient Experience Suite**: For patients and visitors to self-register, join queues, and track live status.

---

## 🚀 Live Local Development Server

The application is hosted locally and served at:
- **Central Portal Hub**: [http://localhost:3000/index.html](http://localhost:3000/index.html)
- **Staff Dashboard**: [http://localhost:3000/staff_dashboard.html](http://localhost:3000/staff_dashboard.html)
- **Queue Operations Board**: [http://localhost:3000/queue_management.html](http://localhost:3000/queue_management.html)
- **Walk-in Patient Intake**: [http://localhost:3000/register_patient.html](http://localhost:3000/register_patient.html)
- **Patient Dashboard**: [http://localhost:3000/patient_dashboard.html](http://localhost:3000/patient_dashboard.html)
- **Self-Service Kiosk (Join Queue)**: [http://localhost:3000/join_queue.html](http://localhost:3000/join_queue.html)
- **Live Queue Tracking & Announcer**: [http://localhost:3000/patient_queue_tracking.html](http://localhost:3000/patient_queue_tracking.html)

---

## 📂 Screen Architecture

| # | Screen | File | Target Persona | Features |
|---|---|---|---|---|
| **Hub** | **Hospital Portal** | [`index.html`](file:///c:/Users/Ayush%20Shingote/OneDrive/Desktop/Queue%20Management%20System/index.html) | All Users & Evaluators | Live operational telemetry, dual gateway cards, cross-screen interactive flow simulator |
| **1** | **Staff Dashboard** | [`staff_dashboard.html`](file:///c:/Users/Ayush%20Shingote/OneDrive/Desktop/Queue%20Management%20System/staff_dashboard.html) | Nurses & Staff | Station 01 active monitor, session timer, KPI stats, quick "Call Next" & "Re-Announce" triggers |
| **2** | **Queue Operations** | [`queue_management.html`](file:///c:/Users/Ayush%20Shingote/OneDrive/Desktop/Queue%20Management%20System/queue_management.html) | Triage Officers | Full triage matrix, Auto-Call toggle switch, live search, status tabs (Waiting, Called, Serving) |
| **3** | **Walk-in Intake** | [`register_patient.html`](file:///c:/Users/Ayush%20Shingote/OneDrive/Desktop/Queue%20Management%20System/register_patient.html) | Receptionists | Walk-in intake form, auto FIFO allocation, 58mm thermal ticket slip printing simulation |
| **4** | **Patient Dashboard** | [`patient_dashboard.html`](file:///c:/Users/Ayush%20Shingote/OneDrive/Desktop/Queue%20Management%20System/patient_dashboard.html) | Patients | Active token overview (`H-104`), assigned clinic counter, estimated wait time |
| **5** | **Self-Service Kiosk** | [`join_queue.html`](file:///c:/Users/Ayush%20Shingote/OneDrive/Desktop/Queue%20Management%20System/join_queue.html) | Patients / Kiosks | Department selector cards, wait time indicators, one-click ticket generation modal |
| **6** | **Live Tracking & Audio** | [`patient_queue_tracking.html`](file:///c:/Users/Ayush%20Shingote/OneDrive/Desktop/Queue%20Management%20System/patient_queue_tracking.html) | Waiting Room Displays | High-visibility "NOW SERVING" board, live turn notification banner, Web Audio hospital chime |

---

## ⚡ Interactive Engine (`medi-queue.js`)

All 6 screens are linked by `medi-queue.js`:
- **Cross-Tab Synchronization**: Uses `localStorage` and `storage` events. When staff calls a patient in one browser tab, the patient tracker tab immediately updates in real-time.
- **Web Audio API Hospital Chime**: Generates a two-tone airport/hospital bell chime (`E5` 659Hz $\rightarrow$ `C5` 523Hz) with exponential acoustic decay.
- **Speech Synthesis (TTS)**: Automatically announces called tokens aloud (e.g., *"Attention please: Patient with token H-102, please proceed to Counter 01"*).
- **Universal Quick Switcher**: Docked floating navigation bar on every screen allowing instant switching between interfaces and one-click data reset.
