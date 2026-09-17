package za.ac.cput.findyourpathwholeproject.factory;

import za.ac.cput.findyourpathwholeproject.domain.Booking;

import java.time.LocalDate;
import java.time.LocalTime;

public class BookingFactory {

    public static Booking createBooking(String bookingId, String studentId, String mentorId,
                                        LocalDate sessionDate, LocalTime startTime, LocalTime endTime,
                                        String status, String notes) {

        if (isNullOrEmpty(bookingId) || isNullOrEmpty(studentId) || isNullOrEmpty(mentorId)) {
            return null;
        }
        if (sessionDate == null || startTime == null || endTime == null) {
            return null;
        }
        if (!startTime.isBefore(endTime)) {
            return null; // start must be strictly before end
        }
        if (isNullOrEmpty(status)) {
            return null;
        }

        return new Booking.Builder()
                .setBookingId(bookingId)
                .setStudentId(studentId)
                .setMentorId(mentorId)
                .setSessionDate(sessionDate)
                .setStartTime(startTime)
                .setEndTime(endTime)
                .setStatus(status)
                .setNotes(notes)
                .build();
    }

    private static boolean isNullOrEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }
}