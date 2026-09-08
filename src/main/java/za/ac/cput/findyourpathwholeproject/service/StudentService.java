package za.ac.cput.findyourpathwholeproject.service;

import za.ac.cput.findyourpathwholeproject.domain.Student;

import java.util.List;

public interface StudentService extends IService<Student,String>{
    List<Student>findAll();
    List<Student>findByStudentId(String student);
}
