package za.ac.cput.findyourpathwholeproject.factory;

import za.ac.cput.findyourpathwholeproject.domain.Mentorrequest;

import java.time.LocalDate;

public class MentorrequestFactory {

    public static Mentorrequest createMentorRequest(String requestId, String studentId, String mentorId,
                                                    LocalDate requestDate, String message,
                                                    Mentorrequest.Status status) {

        if (isNullOrEmpty(requestId) || isNullOrEmpty(studentId) || isNullOrEmpty(mentorId)) {
            return null;
        }
        if (requestDate == null) {
            return null;
        }
        if (status == null) {
            return null;
        }

        return new Mentorrequest.Builder()
                .setRequestId(requestId)
                .setStudentId(studentId)
                .setMentorId(mentorId)
                .setRequestDate(requestDate)
                .setMessage(message)
                .setStatus(status)
                .build();
    }

    private static boolean isNullOrEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }
}