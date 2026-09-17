package za.ac.cput.findyourpathwholeproject.util;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Shared by BookingService to prevent double-booking a mentor
 * (or a student) for overlapping time slots on the same day.
 */
public class DateTimeOverlapChecker {

    /**
     * Returns true if [start1,end1) on date1 overlaps [start2,end2) on date2.
     * Different dates never overlap. Touching boundaries (one ends exactly
     * when the other starts) do NOT count as an overlap.
     */
    public static boolean isOverlapping(LocalDate date1, LocalTime start1, LocalTime end1,
                                        LocalDate date2, LocalTime start2, LocalTime end2) {
        if (date1 == null || date2 == null || start1 == null || end1 == null
                || start2 == null || end2 == null) {
            throw new IllegalArgumentException("Date/time arguments must not be null");
        }
        if (!date1.isEqual(date2)) {
            return false;
        }
        return start1.isBefore(end2) && start2.isBefore(end1);
    }
}