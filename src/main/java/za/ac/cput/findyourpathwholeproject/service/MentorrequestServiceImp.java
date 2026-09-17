package za.ac.cput.findyourpathwholeproject.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import za.ac.cput.findyourpathwholeproject.domain.Mentorrequest;
import za.ac.cput.findyourpathwholeproject.repository.MentorRequestRepository;
import za.ac.cput.findyourpathwholeproject.util.RequestStatusTransitionHelper;

import java.util.List;

@Service
public class MentorrequestServiceImp implements MentorrequestService {

    private final MentorRequestRepository mentorRequestRepository;

    @Autowired
    public MentorrequestServiceImp(MentorRequestRepository mentorRequestRepository) {
        this.mentorRequestRepository = mentorRequestRepository;
    }

    @Override
    public Mentorrequest create(Mentorrequest mentorRequest) {
        return mentorRequestRepository.save(mentorRequest);
    }

    @Override
    public Mentorrequest read(String requestId) {
        return mentorRequestRepository.findById(requestId).orElse(null);
    }

    @Override
    public Mentorrequest update(Mentorrequest mentorRequest) {
        return mentorRequestRepository.save(mentorRequest);
    }

    @Override
    public boolean delete(String requestId) {
        if (mentorRequestRepository.existsById(requestId)) {
            mentorRequestRepository.deleteById(requestId);
            return true;
        }
        return false;
    }

    @Override
    public List<Mentorrequest> findAll() {
        return mentorRequestRepository.findAll();
    }

    @Override
    public List<Mentorrequest> findMentorRequestById(String requestId) {
        return mentorRequestRepository.findMentorRequestById(requestId);
    }

    @Override
    public Mentorrequest updateStatus(String requestId, Mentorrequest.Status newStatus) {
        Mentorrequest existing = read(requestId);
        if (existing == null) {
            return null;
        }
        if (!RequestStatusTransitionHelper.canTransition(existing.getStatus(), newStatus)) {
            return null; // invalid transition, e.g. REJECTED -> ACCEPTED
        }
        Mentorrequest updated = new Mentorrequest.Builder()
                .copy(existing)
                .setStatus(newStatus)
                .build();
        return mentorRequestRepository.save(updated);
    }
}