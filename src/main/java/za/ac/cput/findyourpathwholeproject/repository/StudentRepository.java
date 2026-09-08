package za.ac.cput.findyourpathwholeproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.findyourpathwholeproject.domain.Student;

import java.util.List;

public interface StudentRepository extends JpaRepository<Student,String> {
    @Override
    List<Student> findAll();

    List<Student> findByStudentId(String student);
}
