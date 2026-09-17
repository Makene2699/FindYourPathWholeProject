package za.ac.cput.findyourpathwholeproject.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
public class Booking {
    @Id
    private String bookingId;
    private String studentId;
    private String mentorId;
    private LocalDate sessionDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String status;
    private String notes;

    public Booking() {}

    public Booking(Builder builder) {
        this.bookingId = builder.bookingId;
        this.studentId = builder.studentId;
        this.mentorId = builder.mentorId;
        this.sessionDate = builder.sessionDate;
        this.startTime = builder.startTime;
        this.endTime = builder.endTime;
        this.status = builder.status;
        this.notes = builder.notes;
    }

    public String getBookingId() {
        return bookingId;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getMentorId() {
        return mentorId;
    }

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public String getStatus() {
        return status;
    }

    public String getNotes() {
        return notes;
    }

    @Override
    public String toString() {
        return "Booking{" +
                "bookingId='" + bookingId + '\'' +
                ", studentId='" + studentId + '\'' +
                ", mentorId='" + mentorId + '\'' +
                ", sessionDate=" + sessionDate +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", status='" + status + '\'' +
                ", notes='" + notes + '\'' +
                '}';
    }

    public static class Builder {
        private String bookingId;
        private String studentId;
        private String mentorId;
        private LocalDate sessionDate;
        private LocalTime startTime;
        private LocalTime endTime;
        private String status;
        private String notes;

        public Builder setBookingId(String bookingId) {
            this.bookingId = bookingId;
            return this;
        }

        public Builder setStudentId(String studentId) {
            this.studentId = studentId;
            return this;
        }

        public Builder setMentorId(String mentorId) {
            this.mentorId = mentorId;
            return this;
        }

        public Builder setSessionDate(LocalDate sessionDate) {
            this.sessionDate = sessionDate;
            return this;
        }

        public Builder setStartTime(LocalTime startTime) {
            this.startTime = startTime;
            return this;
        }

        public Builder setEndTime(LocalTime endTime) {
            this.endTime = endTime;
            return this;
        }

        public Builder setStatus(String status) {
            this.status = status;
            return this;
        }

        public Builder setNotes(String notes) {
            this.notes = notes;
            return this;
        }

        public Builder copy(Booking copy) {
            this.bookingId = copy.bookingId;
            this.studentId = copy.studentId;
            this.mentorId = copy.mentorId;
            this.sessionDate = copy.sessionDate;
            this.startTime = copy.startTime;
            this.endTime = copy.endTime;
            this.status = copy.status;
            this.notes = copy.notes;
            return this;
        }

        public Booking build() {
            return new Booking(this);
        }
    }
}