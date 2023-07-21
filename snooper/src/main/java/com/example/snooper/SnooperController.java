package com.example.snooper;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
public class SnooperController {

    private final SnooperService snooperService;

    public SnooperController(SnooperService snooperService) {
        this.snooperService = snooperService;
    }

    @GetMapping("/")
    public String welcome() {
        return "Snooper Welcomes you";
    }

    @PostMapping("/scan")
    public String scan(@RequestParam("file") MultipartFile file) throws IOException {
        return (!file.isEmpty() && snooperService.isSafe(file.getInputStream())) ?
                "ALL GOOD" : "!!! VIRUS FOUND !!!";
    }
}
