package za.ac.cput.findyourpathwholeproject.service;

import za.ac.cput.findyourpathwholeproject.domain.Booking;

import java.util.List;

public interface BookingService extends IService<Booking, String> {
    List<Booking> findAll();
    List<Booking> findBookingById(String bookingId);
}
