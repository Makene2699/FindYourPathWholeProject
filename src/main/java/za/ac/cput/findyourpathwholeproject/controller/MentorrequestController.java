package za.ac.cput.findyourpathwholeproject.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import za.ac.cput.findyourpathwholeproject.domain.Mentorrequest;
import za.ac.cput.findyourpathwholeproject.service.MentorrequestService;

import java.util.List;

@RestController
@RequestMapping("/MentorRequest")
public class MentorrequestController {

    private final MentorrequestService mentorRequestService;

    @Autowired
    public MentorrequestController(MentorrequestService mentorRequestService) {
        this.mentorRequestService = mentorRequestService;
    }

    @PostMapping("/create")
    public Mentorrequest createMentorRequest(@RequestBody Mentorrequest mentorRequest) {
        return mentorRequestService.create(mentorRequest);
    }

    @GetMapping("/read/{requestId}")
    public Mentorrequest readMentorRequest(@PathVariable String requestId) {
        return mentorRequestService.read(requestId);
    }

    @PostMapping("/update")
    public Mentorrequest updateMentorRequest(@RequestBody Mentorrequest mentorRequest) {
        return mentorRequestService.update(mentorRequest);
    }

    @DeleteMapping("/delete/{requestId}")
    public boolean deleteMentorRequest(@PathVariable String requestId) {
        return mentorRequestService.delete(requestId);
    }

    @GetMapping("/findAll")
    public List<Mentorrequest> findAllMentorRequests() {
        return mentorRequestService.findAll();
    }

    @GetMapping("/findMentorRequestById/{requestId}")
    public List<Mentorrequest> getMentorRequestById(@PathVariable String requestId) {
        return mentorRequestService.findMentorRequestById(requestId);
    }

    @PutMapping("/updateStatus/{requestId}")
    public Mentorrequest updateStatus(@PathVariable String requestId,
                                      @RequestParam Mentorrequest.Status status) {
        return mentorRequestService.updateStatus(requestId, status);
    }
}