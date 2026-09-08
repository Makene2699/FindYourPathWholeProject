package za.ac.cput.findyourpathwholeproject.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import za.ac.cput.findyourpathwholeproject.domain.Admin;
import za.ac.cput.findyourpathwholeproject.repository.AdminRepository;

import java.util.List;
@Service
public class AdminServiceImp implements AdminService {
    private final AdminRepository adminService;

    @Autowired
    public AdminServiceImp(AdminRepository adminRep){
        this.adminService = adminRep;
    }

    @Override
    public Admin create(Admin admin) {
        return this.adminService.save(admin);
    }

    @Override
    public Admin read(String admin) {
        return this.adminService.findById(admin).orElse(null);
    }

    @Override
    public Admin update(Admin admin) {
        return this.adminService.save(admin);
    }

    @Override
    public boolean delete(String admin) {
        if (adminService.existsById(admin)){
            adminService.deleteById(admin);
            return true;
        }
        return false;
    }
    @Override
    public List<Admin> findAll() {
        return adminService.findAll();
    }

    @Override
    public List<Admin> findByAdminId(String admin) {
        return adminService.findByAdminId(admin);
    }
}
