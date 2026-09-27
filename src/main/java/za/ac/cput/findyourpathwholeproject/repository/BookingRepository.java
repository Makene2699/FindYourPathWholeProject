package za.ac.cput.findyourpathwholeproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.ac.cput.findyourpathwholeproject.domain.Booking;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {

    @Override
    List<Booking> findAll();

    List<Booking> findByBookingId(String bookingId);

    // Needed by BookingService to check for overlapping sessions before creating a new booking
    List<Booking> findByMentorIdAndSessionDate(String mentorId, LocalDate sessionDate);

    List<Booking> findByStudentIdAndSessionDate(String studentId, LocalDate sessionDate);
}