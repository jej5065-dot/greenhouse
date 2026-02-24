package org.dined.dined.controller;

import org.dined.dined.model.PlantType;
import org.dined.dined.service.PlantTypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/plant-types")
@CrossOrigin(origins = "*")
public class PlantTypeController {

    @Autowired
    private PlantTypeService plantTypeService;

    @GetMapping
    public List<PlantType> getAll() {
        return plantTypeService.getAllTypes();
    }

    @PostMapping
    public PlantType createPlantType(@RequestBody PlantType plantType) {
        return plantTypeService.saveType(plantType);
    }

    @PutMapping("/{id}")
    public PlantType updatePlantType(@PathVariable Long id, @RequestBody PlantType plantType) {
        return plantTypeService.updateType(id, plantType);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePlantType(@PathVariable Long id) {
        plantTypeService.deleteType(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<String> uploadTypeImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            String imagePath = plantTypeService.saveTypeImage(id, file);
            return ResponseEntity.ok(imagePath);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Failed to upload image: " + e.getMessage());
        }
    }

    @PostMapping("/import")
    public ResponseEntity<String> uploadCsv(@RequestParam("file") MultipartFile file) {
        try {
            plantTypeService.importCsv(file);
            return ResponseEntity.ok("Import successful");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}
