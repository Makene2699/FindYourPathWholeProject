package za.ac.cput.findyourpathwholeproject.service;

import za.ac.cput.findyourpathwholeproject.domain.Admin;

import java.util.List;

public interface AdminService extends IService<Admin,String> {
    List<Admin>findAll();
    List<Admin>findByAdminId(String admin);
}
