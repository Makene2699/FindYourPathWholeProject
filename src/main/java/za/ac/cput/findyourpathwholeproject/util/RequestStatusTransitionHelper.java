package za.ac.cput.findyourpathwholeproject.util;

import za.ac.cput.findyourpathwholeproject.domain.Mentorrequest.Status;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * DRAFT transition rules — confirm with the team alongside the Status enum
 * itself. Current assumption:
 *   PENDING    -> ACCEPTED, REJECTED, CANCELLED
 *   ACCEPTED   -> CANCELLED
 *   REJECTED   -> (terminal, no further transitions)
 *   CANCELLED  -> (terminal, no further transitions)
 */
public class RequestStatusTransitionHelper {

    private static final Map<Status, Set<Status>> ALLOWED = new EnumMap<>(Status.class);

    static {
        ALLOWED.put(Status.PENDING, EnumSet.of(Status.ACCEPTED, Status.REJECTED, Status.CANCELLED));
        ALLOWED.put(Status.ACCEPTED, EnumSet.of(Status.CANCELLED));
        ALLOWED.put(Status.REJECTED, EnumSet.noneOf(Status.class));
        ALLOWED.put(Status.CANCELLED, EnumSet.noneOf(Status.class));
    }

    public static boolean canTransition(Status from, Status to) {
        if (from == null || to == null) {
            return false;
        }
        return ALLOWED.getOrDefault(from, EnumSet.noneOf(Status.class)).contains(to);
    }
}