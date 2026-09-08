package za.ac.cput.findyourpathwholeproject.service;

import za.ac.cput.findyourpathwholeproject.domain.Industry;

import java.util.List;

public interface IndustryService extends IService<Industry,String>{
    List<Industry> findAll();
    List<Industry> findByIndustryID(String industry);
}
