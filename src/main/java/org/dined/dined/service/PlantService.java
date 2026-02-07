package org.dined.dined.service;

import org.dined.dined.model.Plant;
import org.dined.dined.repository.PlantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class PlantService {

    @Autowired
    private PlantRepository plantRepository;

    private final Path root = Paths.get("uploads");

    public List<Plant> getAllPlants() {
        return plantRepository.findAll();
    }

    public Plant getPlantById(Long id) {
        return plantRepository.findById(id).orElseThrow(() -> new RuntimeException("Plant not found"));
    }

    public Plant savePlant(Plant plant) {
        return plantRepository.save(plant);
    }

    public void deletePlant(Long id) {
        plantRepository.deleteById(id);
    }

    public Plant waterPlant(Long id) {
        Plant plant = getPlantById(id);
        plant.setLastWateredDate(LocalDateTime.now());
        return plantRepository.save(plant);
    }

    public Plant propagatePlant(Long id) {
        Plant parent = getPlantById(id);
        Plant cutting = Plant.builder()
                .name(parent.getName() + " (Cutting)")
                .type(parent.getType())
                .careInstructions(parent.getCareInstructions())
                .propagationInstructions(parent.getPropagationInstructions())
                .parent(parent)
                .cuttingDate(LocalDate.now())
                .status("Propagating")
                .location(parent.getLocation())
                .wateringFrequencyDays(parent.getWateringFrequencyDays())
                .guid(UUID.randomUUID().toString())
                .build();
        return plantRepository.save(cutting);
    }

    public String saveImage(MultipartFile file) throws IOException {
        if (!Files.exists(root)) {
            Files.createDirectories(root);
        }

        try {
            // Calculate SHA-256 Hash
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int count;
            try (InputStream is = file.getInputStream()) {
                while ((count = is.read(buffer)) > 0) {
                    digest.update(buffer, 0, count);
                }
            }
            
            byte[] hash = digest.digest();
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }

            String extension = "";
            String originalFilename = file.getOriginalFilename();
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            String hashedFilename = hexString.toString() + extension.toLowerCase();
            Path targetPath = this.root.resolve(hashedFilename);

            // Only save if it doesn't already exist (deduplication)
            if (!Files.exists(targetPath)) {
                Files.copy(file.getInputStream(), targetPath);
            }

            return hashedFilename;
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Could not calculate file hash", e);
        }
    }

    public List<Plant> searchPlants(String term) {
        return plantRepository.search(term);
    }

    public List<String> getLocations() {
        return plantRepository.findDistinctLocations();
    }
}