CREATE UNIQUE INDEX "appointment_active_slot_unique"
ON "Appointment" ("slotId")
WHERE status = 'BOOKED';