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
    public org.springframework.http.ResponseEntity<?> identifyPlant(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "name", required = false) String name) {
        try {
            return org.springframework.http.ResponseEntity.ok(plantAiService.identifyPlant(file.getResource(), name, null));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PostMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> identifyExistingPlant(@PathVariable Long id) {
        try {
            org.dined.dined.model.Plant plant = plantService.getPlantById(id);
            if (plant.getImagePath() == null) {
                throw new RuntimeException("Plant has no image for identification");
            }
            
            java.nio.file.Path imagePath = java.nio.file.Paths.get("uploads", "original_" + plant.getImagePath());
            if (!java.nio.file.Files.exists(imagePath)) {
                throw new RuntimeException("Original image file not found");
            }

            // Only pass existing type for enrichment if instructions are missing
            org.dined.dined.model.PlantType type = plant.getPlantType();
            boolean needsEnrichment = type != null && (
                type.getCareInstructions() == null || type.getCareInstructions().isBlank() ||
                type.getPropagationInstructions() == null || type.getPropagationInstructions().isBlank()
            );
            
            return org.springframework.http.ResponseEntity.ok(plantAiService.identifyPlant(
                new org.springframework.core.io.FileSystemResource(imagePath), 
                plant.getName(), 
                needsEnrichment ? type : null
            ));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}
