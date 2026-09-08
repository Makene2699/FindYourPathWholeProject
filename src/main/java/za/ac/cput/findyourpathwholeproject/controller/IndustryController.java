package za.ac.cput.findyourpathwholeproject.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.findyourpathwholeproject.domain.Industry;
import za.ac.cput.findyourpathwholeproject.service.IndustryService;

import java.util.List;

@RestController
@RequestMapping("Industry")
public class IndustryController {
    private final IndustryService industryController;

    @Autowired
    public IndustryController(IndustryService industryService){
        this.industryController = industryService;
    }
    @PostMapping("create")
    public Industry createIndustry(@RequestBody Industry industry){
        return industryController.create(industry);
    }
    @GetMapping("/read{industryID}")
    public Industry readIndustry(@PathVariable String industryID){
        return industryController.read(industryID);
    }
    @PostMapping("/update")
    public Industry updateIndustry(@RequestBody Industry industry){
        return industryController.update(industry);
    }
    @DeleteMapping("delete{industryID}")
    public boolean deleteIndustry(@PathVariable String industryID){
        return industryController.delete(industryID);
    }
    @GetMapping("/findAll")
    public List<Industry> getAllIndustries(){
        return industryController.findAll();
    }
    @GetMapping("/findIndustryById{industryID}")
    public List<Industry> findIndustries(@PathVariable String industryID){
        return industryController.findByIndustryID(industryID);
    }
}
