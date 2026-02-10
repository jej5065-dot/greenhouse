package org.dined.dined.service;

import org.dined.dined.model.Plant;
import org.dined.dined.model.PlantImage;
import org.dined.dined.model.PlantSummary;
import org.dined.dined.model.PlantUpdate;
import org.dined.dined.repository.PlantImageRepository;
import org.dined.dined.repository.PlantRepository;
import org.dined.dined.repository.PlantUpdateRepository;
import org.imgscalr.Scalr;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
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

    @Autowired
    private PlantUpdateRepository updateRepository;

    @Autowired
    private PlantImageRepository imageRepository;

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

    public PlantUpdate addUpdate(Long plantId, PlantUpdate update) {
        Plant plant = getPlantById(plantId);
        update.setPlant(plant);
        if (update.getDate() == null) {
            update.setDate(LocalDate.now());
        }
        return updateRepository.save(update);
    }

    public PlantImage addImageToUpdate(Long updateId, MultipartFile file, String label) throws IOException {
        PlantUpdate update = updateRepository.findById(updateId).orElseThrow(() -> new RuntimeException("Update not found"));
        String filename = saveImage(file);
        
        PlantImage image = PlantImage.builder()
                .imagePath(filename)
                .label(label)
                .update(update)
                .build();
        
        // Also update the plant's main cover photo to the latest upload
        Plant plant = update.getPlant();
        plant.setImagePath(filename);
        plantRepository.save(plant);

        return imageRepository.save(image);
    }

    public PlantImage updateImageRotation(Long imageId, Integer rotation) {
        PlantImage image = imageRepository.findById(imageId).orElseThrow(() -> new RuntimeException("Image not found"));
        image.setRotation(rotation);
        return imageRepository.save(image);
    }

    public PlantImage updateImageLabel(Long imageId, String label) {
        PlantImage image = imageRepository.findById(imageId).orElseThrow(() -> new RuntimeException("Image not found"));
        image.setLabel(label);
        return imageRepository.save(image);
    }

    public Plant setPlantCoverImage(Long plantId, Long imageId) {
        Plant plant = getPlantById(plantId);
        PlantImage image = imageRepository.findById(imageId).orElseThrow(() -> new RuntimeException("Image not found"));
        
        plant.setImagePath(image.getImagePath());
        plant.setRotation(image.getRotation());
        
        return plantRepository.save(plant);
    }

    public String saveImage(MultipartFile file) throws IOException {
        if (!Files.exists(root)) {
            Files.createDirectories(root);
        }

        try {
            byte[] fileBytes = file.getBytes();
            
            // Calculate SHA-256 Hash of original file for deduplication
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(fileBytes);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }

            String extension = "jpg";
            String originalFilename = file.getOriginalFilename();
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
            }
            
            String hashedFilename = hexString.toString() + "." + extension;
            Path originalPath = this.root.resolve("original_" + hashedFilename);
            Path thumbPath = this.root.resolve("thumb_" + hashedFilename);

            if (!Files.exists(originalPath)) {
                // Save original
                Files.write(originalPath, fileBytes);

                // Generate and save thumbnail
                BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(fileBytes));
                if (originalImage != null) {
                    BufferedImage resizedImage = Scalr.resize(originalImage, Scalr.Method.QUALITY, Scalr.Mode.FIT_TO_WIDTH, 1024);
                    ImageIO.write(resizedImage, extension, thumbPath.toFile());
                } else {
                    // Fallback
                    Files.write(thumbPath, fileBytes);
                }
            }

            return hashedFilename;
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Could not calculate file hash", e);
        }
    }

    public PlantSummary getPlantSummary() {
        List<Plant> allPlants = plantRepository.findAll();

        long totalPlants = allPlants.size();
        long needsAttention = allPlants.stream().filter(p -> "Needs Attention".equals(p.getStatus())).count();
        long propagating = allPlants.stream().filter(p -> "Propagating".equals(p.getStatus())).count();
        long readyToSell = allPlants.stream().filter(p -> "Ready to Sell".equals(p.getStatus())).count();
        long distinctLocations = allPlants.stream().map(Plant::getLocation).filter(loc -> loc != null && !loc.trim().isEmpty()).distinct().count();
        
        double totalEstimatedValue = allPlants.stream()
                .filter(p -> !"Sold".equals(p.getStatus()) && p.getPrice() != null)
                .mapToDouble(Plant::getPrice)
                .sum();

        return new PlantSummary(totalPlants, needsAttention, propagating, readyToSell, distinctLocations, totalEstimatedValue);
    }

    public List<Plant> searchPlants(String term) {
        return plantRepository.search(term);
    }

    public List<String> getLocations() {
        return plantRepository.findDistinctLocations();
    }
}