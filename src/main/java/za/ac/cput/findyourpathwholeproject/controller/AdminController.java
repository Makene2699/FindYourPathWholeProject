package za.ac.cput.findyourpathwholeproject.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.findyourpathwholeproject.domain.Admin;
import za.ac.cput.findyourpathwholeproject.service.AdminService;
import za.ac.cput.findyourpathwholeproject.service.AdminServiceImp;

import java.util.List;

@RestController
@RequestMapping("Admin")
public class AdminController {
    private final AdminService adminController;

    @Autowired
    public AdminController(AdminServiceImp adminService){
        this.adminController = adminService;
    }
    @PostMapping("/create")
    public Admin createAdmin(@RequestBody Admin admin){
        return adminController.create(admin);
    }
    @GetMapping("/read/{adminId}")
    public Admin readAdmin(@PathVariable String adminId){
        return adminController.read(adminId);
    }
    @PostMapping("/update")
    public Admin updateAdmin(@RequestBody Admin admin){
        return adminController.update(admin);
    }
    @DeleteMapping("/delete{adminId}")
    public boolean deleteAdmin(@PathVariable String adminId){
        return adminController.delete(adminId);
    }
    @GetMapping("findAll")
    public List<Admin> findAdmin(){
        return adminController.findAll();
    }
    @GetMapping("findAdminById{adminId}")
    public List<Admin> getAdminById(@PathVariable String adminId){
        return adminController.findByAdminId(adminId);
    }

}
