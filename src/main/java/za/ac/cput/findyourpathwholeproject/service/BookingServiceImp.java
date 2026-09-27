package za.ac.cput.findyourpathwholeproject.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import za.ac.cput.findyourpathwholeproject.domain.Booking;
import za.ac.cput.findyourpathwholeproject.repository.BookingRepository;
import za.ac.cput.findyourpathwholeproject.util.DateTimeOverlapChecker;

import java.util.List;

@Service
public class BookingServiceImp implements BookingService {

    private final BookingRepository bookingRepository;

    @Autowired
    public BookingServiceImp(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @Override
    public Booking create(Booking booking) {
        if (hasSchedulingConflict(booking)) {
            return null; // reject: mentor or student already booked in that window
        }
        return bookingRepository.save(booking);
    }

    @Override
    public Booking read(String bookingId) {
        return bookingRepository.findById(bookingId).orElse(null);
    }

    @Override
    public Booking update(Booking booking) {
        // Re-check conflicts against other bookings, excluding this booking itself
        if (hasSchedulingConflict(booking)) {
            return null;
        }
        return bookingRepository.save(booking);
    }

    @Override
    public boolean delete(String bookingId) {
        if (bookingRepository.existsById(bookingId)) {
            bookingRepository.deleteById(bookingId);
            return true;
        }
        return false;
    }

    @Override
    public List<Booking> findAll() {
        return bookingRepository.findAll();
    }

    @Override
    public List<Booking> findBookingById(String bookingId) {
        return bookingRepository.findByBookingId(bookingId);
    }

    private boolean hasSchedulingConflict(Booking candidate) {
        List<Booking> mentorBookingsSameDay = bookingRepository
                .findByMentorIdAndSessionDate(candidate.getMentorId(), candidate.getSessionDate());

        for (Booking existing : mentorBookingsSameDay) {
            if (existing.getBookingId().equals(candidate.getBookingId())) {
                continue; // skip self when updating
            }
            boolean overlaps = DateTimeOverlapChecker.isOverlapping(
                    existing.getSessionDate(), existing.getStartTime(), existing.getEndTime(),
                    candidate.getSessionDate(), candidate.getStartTime(), candidate.getEndTime());
            if (overlaps) {
                return true;
            }
        }
        return false;
    }
}