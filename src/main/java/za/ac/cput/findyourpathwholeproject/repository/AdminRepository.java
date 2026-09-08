package za.ac.cput.findyourpathwholeproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.ac.cput.findyourpathwholeproject.domain.Admin;

import java.util.List;

@Repository
public interface AdminRepository extends JpaRepository<Admin,String> {

    @Override
    List<Admin> findAll();

    List<Admin> findByAdminId(String adminId);
}
