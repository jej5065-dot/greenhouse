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
    private final org.dined.dined.service.PlantService plantService;

    @PostMapping
    public PlantAiIdentificationResponse identifyPlant(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "name", required = false) String name) {
        return plantAiService.identifyPlant(file.getResource(), name);
    }

    @PostMapping("/{id}")
    public PlantAiIdentificationResponse identifyExistingPlant(@PathVariable Long id) {
        org.dined.dined.model.Plant plant = plantService.getPlantById(id);
        if (plant.getImagePath() == null) {
            throw new RuntimeException("Plant has no image for identification");
        }
        
        java.nio.file.Path imagePath = java.nio.file.Paths.get("uploads", "original_" + plant.getImagePath());
        if (!java.nio.file.Files.exists(imagePath)) {
            throw new RuntimeException("Original image file not found");
        }
        
        return plantAiService.identifyPlant(new org.springframework.core.io.FileSystemResource(imagePath), plant.getName());
    }
}
