package za.ac.cput.findyourpathwholeproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.ac.cput.findyourpathwholeproject.domain.Mentorrequest;

import java.util.List;

@Repository
public interface MentorRequestRepository extends JpaRepository<Mentorrequest, String> {

    @Override
    List<Mentorrequest> findAll();

    List<Mentorrequest> findByRequestId(String requestId);

    List<Mentorrequest> findByStudentId(String studentId);

    List<Mentorrequest> findByMentorId(String mentorId);

    List<Mentorrequest> findByStatus(Mentorrequest.Status status);
}