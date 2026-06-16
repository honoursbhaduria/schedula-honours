# Appointment Booking Flow

```mermaid
graph TD
    Start((START)) --> SelectDoctor[Patient Select Doctor]
    SelectDoctor --> SelectDate[Patient Select Date]
    SelectDate --> FetchSlots[Fetch Available Slots]
    FetchSlots --> IsAvailable{Slot Available?}
    
    IsAvailable -- NO --> ShowUnavailable1[Show Slot Unavailable Message]
    ShowUnavailable1 --> End((END))
    
    IsAvailable -- YES --> CheckDuplicate[Check Duplicate Booking]
    CheckDuplicate --> AlreadyBooked{Already Booked?}
    
    AlreadyBooked -- YES --> ShowUnavailable2[Show Slot Unavailable Message]
    ShowUnavailable2 --> End
    
    AlreadyBooked -- NO --> CreateAppt[Create Appointment]
    CreateAppt --> ApptCreated[Appointment Created]
    ApptCreated --> MarkUnavailable[Slot Marked Unavailable]
    MarkUnavailable --> End

---

# AI Agent Workflow (Schedula AI)

The AI Agent provides an intelligent, chat-based interface for patients to manage their medical journey.

```mermaid
graph TD
    Report[Patient Uploads Report] --> Analyze[AI Analyzes Report & Condition]
    Analyze --> Recommend[AI Recommends Specialists]
    Recommend --> Chat[AI Initiates Chat with Patient]
    
    Chat --> UserAsk[User Asks to Search/Book]
    UserAsk --> ToolSearch{AI Selects Tool}
    
    ToolSearch -- search_doctors --> DocResult[Search Doctors by Specialization]
    ToolSearch -- get_available_slots --> SlotResult[Fetch Real-time Slots]
    ToolSearch -- book_appointment --> BookResult[Execute Booking Logic]
    
    DocResult --> Chat
    SlotResult --> Chat
    BookResult --> FinalConfirm[Confirm & Summary to Patient]
    
    FinalConfirm --> End((END))
```

## AI Agent Capabilities
1.  **Contextual Awareness**: Remembers medical conditions and recommended doctors from report analysis.
2.  **Autonomous Tool Use**: Uses LangChain to call backend services for searching and booking without manual intervention.
3.  **Real-time Availability**: Always verifies slots before booking to ensure accuracy.
4.  **Interactive Summary**: Provides a clear summary of the booked appointment at the end of the conversation.
```

## Business Rules
1. **Book Appointment**:
   - Only users with `PATIENT` role can book.
   - Appointment must be in the future.
   - Doctor must exist.
   - Slot must be within doctor's availability (recurring or custom).
   - Slot must not be already booked.
2. **View Appointments**:
   - Patients can view their own appointments with doctor details.
   - Doctors can view appointments booked with them with patient details.
3. **Cancel Appointment**:
   - Only the patient who booked can cancel.
   - Cannot cancel past appointments.
   - Cannot cancel already cancelled appointments.
