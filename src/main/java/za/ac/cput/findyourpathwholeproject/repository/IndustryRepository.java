package za.ac.cput.findyourpathwholeproject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.ac.cput.findyourpathwholeproject.domain.Industry;

import java.util.List;

public interface IndustryRepository extends JpaRepository<Industry,String> {
    @Override
    List<Industry> findAll();

    List<Industry> findByIndustryID(String industry);
}
