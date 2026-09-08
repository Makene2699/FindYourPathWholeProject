package za.ac.cput.findyourpathwholeproject.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import za.ac.cput.findyourpathwholeproject.domain.Student;
import za.ac.cput.findyourpathwholeproject.repository.StudentRepository;

import java.util.List;
@Service
public class StudentServiceImp implements StudentService{
    private final StudentRepository studentService;

    @Autowired
    public StudentServiceImp (StudentRepository studentRep){
        this.studentService = studentRep;
    }

    @Override
    public Student create(Student student) {
        return studentService.save(student);
    }

    @Override
    public Student read(String s) {
        return studentService.findById(s).orElse(null);
    }

    @Override
    public Student update(Student student) {
        return studentService.save(student);
    }

    @Override
    public boolean delete(String s) {
        if(studentService.existsById(s)){
            studentService.deleteById(s);
            return true;
        }
        return false;
    }
    @Override
    public List<Student> findAll() {
        return studentService.findAll();
    }

    @Override
    public List<Student> findByStudentId(String student) {
        return studentService.findByStudentId(student);
    }
}
