package za.ac.cput.findyourpathwholeproject.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.findyourpathwholeproject.domain.Student;
import za.ac.cput.findyourpathwholeproject.service.StudentServiceImp;

import java.util.List;

@RestController
@RequestMapping("Student")
public class StudentController {
    private final StudentServiceImp studentController;

    @Autowired
    public StudentController(StudentServiceImp studentServiceImp){
        this.studentController = studentServiceImp;
    }
    @PostMapping("/create")
    public Student createStudent(@RequestBody Student student){
        return studentController.create(student);
    }
    @GetMapping("/read{studentId}")
    public Student readStudent(@PathVariable String studentId){
        return studentController.read(studentId);
    }
    @PostMapping("/update")
    public Student updateStudent(@RequestBody Student student){
        return studentController.update(student);
    }
    @DeleteMapping("/delete{studentId}")
    public boolean deleteStudent(@PathVariable String studentId){
        return studentController.delete(studentId);
    }
    @GetMapping("findAll")
    public List<Student> findAllStudents(){
        return studentController.findAll();
    }
    @GetMapping("findAllStudentsById{studentId}")
    public List<Student> getAllStudentsById(@PathVariable String studentId){
        return studentController.findByStudentId(studentId);
    }
}
