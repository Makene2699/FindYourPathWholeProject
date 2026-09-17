package za.ac.cput.findyourpathwholeproject.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.findyourpathwholeproject.domain.Booking;
import za.ac.cput.findyourpathwholeproject.service.BookingService;

import java.util.List;

@RestController
@RequestMapping("/Booking")
public class BookingController {

    private final BookingService bookingService;

    @Autowired
    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping("/create")
    public Booking createBooking(@RequestBody Booking booking) {
        return bookingService.create(booking);
    }

    @GetMapping("/read/{bookingId}")
    public Booking readBooking(@PathVariable String bookingId) {
        return bookingService.read(bookingId);
    }

    @PostMapping("/update")
    public Booking updateBooking(@RequestBody Booking booking) {
        return bookingService.update(booking);
    }

    @DeleteMapping("/delete/{bookingId}")
    public boolean deleteBooking(@PathVariable String bookingId) {
        return bookingService.delete(bookingId);
    }

    @GetMapping("/findAll")
    public List<Booking> findAllBookings() {
        return bookingService.findAll();
    }

    @GetMapping("/findBookingById/{bookingId}")
    public List<Booking> getBookingById(@PathVariable String bookingId) {
        return bookingService.findBookingById(bookingId);
    }
}