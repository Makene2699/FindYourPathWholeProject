package za.ac.cput.findyourpathwholeproject.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import za.ac.cput.findyourpathwholeproject.domain.Industry;
import za.ac.cput.findyourpathwholeproject.repository.IndustryRepository;

import java.util.List;

@Service
public class IndustryServiceImp implements IndustryService{
    private final IndustryRepository industryService;

    @Autowired
    public IndustryServiceImp(IndustryRepository IndustryRep){
        this.industryService = IndustryRep;
    }
    @Override
    public Industry create(Industry industry) {
        return industryService.save(industry);
    }

    @Override
    public Industry read(String s) {
        return industryService.findById(s).orElse(null);
    }

    @Override
    public Industry update(Industry industry) {
        return industryService.save(industry);
    }

    @Override
    public boolean delete(String s) {
        if(industryService.existsById(s)){
            industryService.deleteById(s);
            return true;
        }
        return false;
    }
    @Override
    public List<Industry> findAll() {
        return industryService.findAll();
    }

    @Override
    public List<Industry> findByIndustryID(String industry) {
        return industryService.findByIndustryID(industry);
    }

}
