package org.dined.dined.controller;

import lombok.RequiredArgsConstructor;
import org.dined.dined.model.PlantAiIdentificationResponse;
import org.dined.dined.service.PlantAiService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/plants/identify")
@RequiredArgsConstructor
public class PlantAiController {

    private final PlantAiService plantAiService;

    @PostMapping
    public PlantAiIdentificationResponse identifyPlant(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "name", required = false) String name) {
        return plantAiService.identifyPlant(file.getResource(), name);
    }
}
