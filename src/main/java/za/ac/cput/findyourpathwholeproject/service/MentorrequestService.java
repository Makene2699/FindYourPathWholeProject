package za.ac.cput.findyourpathwholeproject.service;

import za.ac.cput.findyourpathwholeproject.domain.Mentorrequest;

import java.util.List;

public interface MentorrequestService extends IService<Mentorrequest, String> {
    List<Mentorrequest> findAll();
    List<Mentorrequest> findMentorRequestById(String requestId);

    /**
     * Transitions a request's status, enforcing the allowed-transition rules
     * in RequestStatusTransitionHelper. Returns null if the transition is invalid.
     */
    Mentorrequest updateStatus(String requestId, Mentorrequest.Status newStatus);
}