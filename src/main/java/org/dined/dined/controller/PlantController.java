package org.dined.dined.controller;

import org.dined.dined.model.Plant;
import org.dined.dined.model.PlantImage;
import org.dined.dined.model.PlantSummary;
import org.dined.dined.model.PlantUpdate;
import org.dined.dined.service.PlantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/plants")
@CrossOrigin(origins = "*") // For local development with React
public class PlantController {

    @Autowired
    private PlantService plantService;

    @GetMapping
    public List<Plant> getAllPlants(@RequestParam(required = false) String search) {
        if (search != null && !search.isEmpty()) {
            return plantService.searchPlants(search);
        }
        return plantService.getAllPlants();
    }

    @GetMapping("/{id}")
    public Plant getPlant(@PathVariable Long id) {
        return plantService.getPlantById(id);
    }

    @PostMapping
    public Plant createPlant(@RequestBody Plant plant) {
        return plantService.savePlant(plant);
    }

    @PutMapping("/{id}")
    public Plant updatePlant(@PathVariable Long id, @RequestBody Plant plant) {
        Plant existing = plantService.getPlantById(id);
        
        // Update basic fields
        existing.setName(plant.getName());
        existing.setPlantType(plant.getPlantType());
        existing.setLocation(plant.getLocation());
        existing.setCurrentStage(plant.getCurrentStage());
        existing.setPlantStatus(plant.getPlantStatus());
        existing.setGoodForTerrariums(plant.isGoodForTerrariums());
        existing.setWateringFrequencyDays(plant.getWateringFrequencyDays());
        existing.setNextWaterDate(plant.getNextWaterDate());
        existing.setLastWateredDate(plant.getLastWateredDate());
        
        // Update care info (now mostly via type, but kept total prop time)
        existing.setTotalPropagationTime(plant.getTotalPropagationTime());
        
        // Update financials
        existing.setOriginalPurchasePrice(plant.getOriginalPurchasePrice());
        existing.setPrice(plant.getPrice());
        existing.setSoldDate(plant.getSoldDate());
        
        // Update other metadata
        existing.setRotation(plant.getRotation());

        return plantService.savePlant(existing);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePlant(@PathVariable Long id) {
        plantService.deletePlant(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/water")
    public Plant waterPlant(@PathVariable Long id) {
        return plantService.waterPlant(id);
    }

    @PostMapping("/{id}/snooze")
    public Plant snoozeWatering(@PathVariable Long id) {
        return plantService.snoozeWatering(id);
    }

    @PostMapping("/{id}/propagate")
    public Plant propagatePlant(@PathVariable Long id) {
        return plantService.propagatePlant(id);
    }

    @PostMapping("/{id}/updates")
    public PlantUpdate addUpdate(@PathVariable Long id, @RequestBody PlantUpdate update) {
        return plantService.addUpdate(id, update);
    }

    @PutMapping("/updates/{updateId}")
    public PlantUpdate updateUpdate(@PathVariable Long updateId, @RequestBody PlantUpdate update) {
        return plantService.updateUpdate(updateId, update);
    }

    @PostMapping("/updates/{updateId}/images")
    public PlantImage addImageToUpdate(
            @PathVariable Long updateId, 
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String label) throws IOException {
        return plantService.addImageToUpdate(updateId, file, label);
    }

    @DeleteMapping("/updates/{updateId}")
    public ResponseEntity<?> deleteUpdate(@PathVariable Long updateId) {
        plantService.deleteUpdate(updateId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<?> deleteImage(@PathVariable Long imageId) {
        plantService.deleteImage(imageId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/images/{imageId}/rotation")
    public PlantImage updateRotation(@PathVariable Long imageId, @RequestBody Integer rotation) {
        return plantService.updateImageRotation(imageId, rotation);
    }

    @PutMapping("/images/{imageId}/label")
    public PlantImage updateLabel(@PathVariable Long imageId, @RequestBody String label) {
        return plantService.updateImageLabel(imageId, label);
    }

    @PostMapping("/{id}/cover/{imageId}")
    public Plant setCoverImage(@PathVariable Long id, @PathVariable Long imageId) {
        return plantService.setPlantCoverImage(id, imageId);
    }

    @PutMapping("/{id}/rotation")
    public Plant updatePlantRotation(@PathVariable Long id, @RequestBody Integer rotation) {
        Plant plant = plantService.getPlantById(id);
        plant.setRotation(rotation);
        return plantService.savePlant(plant);
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        String filename = plantService.saveImage(file);
        return ResponseEntity.ok(filename);
    }

    @GetMapping("/locations")
    public List<String> getLocations() {
        return plantService.getLocations();
    }

    @GetMapping("/summary")
    public PlantSummary getPlantSummary() {
        return plantService.getPlantSummary();
    }
}
