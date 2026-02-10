package org.dined.dined.controller;

import org.dined.dined.model.PlantType;
import org.dined.dined.service.PlantTypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/plant-types")
public class PlantTypeController {

    @Autowired
    private PlantTypeService plantTypeService;

    @GetMapping
    public List<PlantType> getAll() {
        return plantTypeService.getAllTypes();
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
