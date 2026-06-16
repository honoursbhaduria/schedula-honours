# Advanced Scheduling System (Stream & Wave)

## Stream Scheduling Flow (Exact Time)
```mermaid
graph TD
    A[Doctor Sets STREAM Type] --> B[Doctor Sets Slot Duration & Buffer]
    B --> C[Availability Windows Defined]
    C --> D[System Generates Discrete Slots]
    D --> E[Patient Fetches Availability]
    E --> F[Patient Picks Exact Time e.g., 10:15]
    F --> G[System Validates & Books]
```

## Wave Scheduling Flow (Token-Based)
```mermaid
graph TD
    A[Doctor Sets WAVE Type] --> B[Doctor Sets Max Capacity per Window]
    B --> C[Availability Windows Defined]
    C --> D[System Displays Time Windows e.g., 10-11 AM]
    D --> E[Patient Fetches Availability]
    E --> F[Patient Books inside Window]
    F --> G{Capacity Full?}
    G -- NO --> H[System Assigns Token Number]
    G -- YES --> I[Show 'Wave is Full' Message]
```

## Business Rules Summary
| Feature | Stream Scheduling | Wave Scheduling |
| :--- | :--- | :--- |
| **Logic** | Fixed-length slots with buffers | Shared time windows |
| **Assignment** | Exact Start/End Time | Token Number in Window |
| **Capacity** | 1 Patient per slot | Max N Patients per window |
| **Best For** | Specialists, Dermatologists | General Physicians, OPD |
