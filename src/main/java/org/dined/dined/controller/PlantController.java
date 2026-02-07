package org.dined.dined.controller;

import org.dined.dined.model.Plant;
import org.dined.dined.model.PlantSummary;
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
        existing.setType(plant.getType());
        existing.setLocation(plant.getLocation());
        existing.setStatus(plant.getStatus());
        existing.setGoodForTerrariums(plant.isGoodForTerrariums());
        existing.setWateringFrequencyDays(plant.getWateringFrequencyDays());
        
        // Update care info
        existing.setCareInstructions(plant.getCareInstructions());
        existing.setPropagationInstructions(plant.getPropagationInstructions());
        existing.setTotalPropagationTime(plant.getTotalPropagationTime());
        
        // Update financials
        existing.setOriginalPurchasePrice(plant.getOriginalPurchasePrice());
        existing.setPrice(plant.getPrice());
        existing.setSoldDate(plant.getSoldDate());

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

    @PostMapping("/{id}/propagate")
    public Plant propagatePlant(@PathVariable Long id) {
        return plantService.propagatePlant(id);
    }

    @PostMapping("/{id}/upload")
    public ResponseEntity<Plant> uploadImageForPlant(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        Plant updatedPlant = plantService.updatePlantImage(id, file);
        return ResponseEntity.ok(updatedPlant);
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
