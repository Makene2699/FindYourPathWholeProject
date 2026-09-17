package za.ac.cput.findyourpathwholeproject.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;

import java.time.LocalDate;

@Entity
public class Mentorrequest {

    public enum Status {
        PENDING,
        ACCEPTED,
        REJECTED,
        CANCELLED
    }

    @Id
    private String requestId;
    private String studentId;
    private String mentorId;
    private LocalDate requestDate;
    private String message;

    @Enumerated(EnumType.STRING)
    private Status status;

    public Mentorrequest() {}

    public Mentorrequest(Builder builder) {
        this.requestId = builder.requestId;
        this.studentId = builder.studentId;
        this.mentorId = builder.mentorId;
        this.requestDate = builder.requestDate;
        this.message = builder.message;
        this.status = builder.status;
    }

    public String getRequestId() {
        return requestId;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getMentorId() {
        return mentorId;
    }

    public LocalDate getRequestDate() {
        return requestDate;
    }

    public String getMessage() {
        return message;
    }

    public Status getStatus() {
        return status;
    }

    @Override
    public String toString() {
        return "MentorRequest{" +
                "requestId='" + requestId + '\'' +
                ", studentId='" + studentId + '\'' +
                ", mentorId='" + mentorId + '\'' +
                ", requestDate=" + requestDate +
                ", message='" + message + '\'' +
                ", status=" + status +
                '}';
    }

    public static class Builder {
        private String requestId;
        private String studentId;
        private String mentorId;
        private LocalDate requestDate;
        private String message;
        private Status status;

        public Builder setRequestId(String requestId) {
            this.requestId = requestId;
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

        public Builder setRequestDate(LocalDate requestDate) {
            this.requestDate = requestDate;
            return this;
        }

        public Builder setMessage(String message) {
            this.message = message;
            return this;
        }

        public Builder setStatus(Status status) {
            this.status = status;
            return this;
        }

        public Builder copy(Mentorrequest copy) {
            this.requestId = copy.requestId;
            this.studentId = copy.studentId;
            this.mentorId = copy.mentorId;
            this.requestDate = copy.requestDate;
            this.message = copy.message;
            this.status = copy.status;
            return this;
        }

        public Mentorrequest build() {
            return new Mentorrequest(this);
        }
    }
}