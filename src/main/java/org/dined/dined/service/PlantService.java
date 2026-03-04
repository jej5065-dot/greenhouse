package org.dined.dined.service;

import org.dined.dined.model.Plant;
import org.dined.dined.model.PlantImage;
import org.dined.dined.model.PlantSummary;
import org.dined.dined.model.PlantType;
import org.dined.dined.model.PlantUpdate;
import org.dined.dined.repository.PlantImageRepository;
import org.dined.dined.repository.PlantRepository;
import org.dined.dined.repository.PlantTypeRepository;
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
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class PlantService {

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif", "webp");

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private PlantUpdateRepository updateRepository;

    @Autowired
    private PlantImageRepository imageRepository;

    @Autowired
    private PlantTypeRepository plantTypeRepository;

    private final Path root = Paths.get("uploads");

    public List<Plant> getAllPlants() {
        return plantRepository.findAll();
    }

    public Plant getPlantById(Long id) {
        return plantRepository.findById(id).orElseThrow(() -> new RuntimeException("Plant not found"));
    }

    @Autowired
    private PlantAiService plantAiService;

    @org.springframework.transaction.annotation.Transactional
    public Plant updatePlant(Long id, Plant plantData) {
        Plant existing = getPlantById(id);
        
        // Update basic fields
        existing.setName(plantData.getName());
        existing.setLocation(plantData.getLocation());
        existing.setCurrentStage(plantData.getCurrentStage());
        existing.setPlantStatus(plantData.getPlantStatus());
        existing.setGoodForTerrariums(plantData.isGoodForTerrariums());
        existing.setWateringFrequencyDays(plantData.getWateringFrequencyDays());
        existing.setNextWaterDate(plantData.getNextWaterDate());
        existing.setLastWateredDate(plantData.getLastWateredDate());
        existing.setTotalPropagationTime(plantData.getTotalPropagationTime());
        existing.setOriginalPurchasePrice(plantData.getOriginalPurchasePrice());
        existing.setPrice(plantData.getPrice());
        existing.setSoldDate(plantData.getSoldDate());
        existing.setRotation(plantData.getRotation());

        // Handle PlantType logic
        if (plantData.getPlantType() != null) {
            PlantType sentType = plantData.getPlantType();
            PlantType resolvedType = null;

            if (sentType.getId() != null) {
                // Update existing type by ID
                resolvedType = plantTypeRepository.findById(sentType.getId()).map(existingType -> {
                    if (sentType.getName() != null) existingType.setName(sentType.getName());
                    existingType.setScientificName(sentType.getScientificName());
                    existingType.setPetToxicity(sentType.getPetToxicity());
                    
                    // Only update instructions if they are missing
                    if (existingType.getCareInstructions() == null || existingType.getCareInstructions().isBlank()) {
                        existingType.setCareInstructions(sentType.getCareInstructions());
                    }
                    if (existingType.getPropagationInstructions() == null || existingType.getPropagationInstructions().isBlank()) {
                        existingType.setPropagationInstructions(sentType.getPropagationInstructions());
                    }

                    if (sentType.getDefaultWateringFrequencyDays() != null && sentType.getDefaultWateringFrequencyDays() != 0) {
                        existingType.setDefaultWateringFrequencyDays(sentType.getDefaultWateringFrequencyDays());
                    }
                    return plantTypeRepository.saveAndFlush(existingType);
                }).orElse(null);
            }

            if (resolvedType == null) {
                // Prioritize Scientific Name for lookup
                if (sentType.getScientificName() != null && !sentType.getScientificName().isBlank()) {
                    resolvedType = plantTypeRepository.findByScientificNameIgnoreCase(sentType.getScientificName()).map(existingType -> {
                        if (sentType.getName() != null) existingType.setName(sentType.getName());
                        existingType.setScientificName(sentType.getScientificName());
                        existingType.setPetToxicity(sentType.getPetToxicity());
                        
                        // Only update instructions if they are missing
                        if (existingType.getCareInstructions() == null || existingType.getCareInstructions().isBlank()) {
                            existingType.setCareInstructions(sentType.getCareInstructions());
                        }
                        if (existingType.getPropagationInstructions() == null || existingType.getPropagationInstructions().isBlank()) {
                            existingType.setPropagationInstructions(sentType.getPropagationInstructions());
                        }

                        if (sentType.getDefaultWateringFrequencyDays() != null && sentType.getDefaultWateringFrequencyDays() != 0) {
                            existingType.setDefaultWateringFrequencyDays(sentType.getDefaultWateringFrequencyDays());
                        }
                        return plantTypeRepository.saveAndFlush(existingType);
                    }).orElse(null);
                }
                
                // Fallback to Name if scientific name lookup failed
                if (resolvedType == null && sentType.getName() != null && !sentType.getName().isBlank()) {
                    resolvedType = plantTypeRepository.findByNameIgnoreCase(sentType.getName()).map(existingType -> {
                        existingType.setScientificName(sentType.getScientificName());
                        existingType.setPetToxicity(sentType.getPetToxicity());
                        
                        // Only update instructions if they are missing
                        if (existingType.getCareInstructions() == null || existingType.getCareInstructions().isBlank()) {
                            existingType.setCareInstructions(sentType.getCareInstructions());
                        }
                        if (existingType.getPropagationInstructions() == null || existingType.getPropagationInstructions().isBlank()) {
                            existingType.setPropagationInstructions(sentType.getPropagationInstructions());
                        }

                        if (sentType.getDefaultWateringFrequencyDays() != null && sentType.getDefaultWateringFrequencyDays() != 0) {
                            existingType.setDefaultWateringFrequencyDays(sentType.getDefaultWateringFrequencyDays());
                        }
                        return plantTypeRepository.saveAndFlush(existingType);
                    }).orElse(null);
                }

                // Create new if still not found
                if (resolvedType == null) {
                    // Try to use AI to find details by name if scientific name is missing
                    if (sentType.getScientificName() == null || sentType.getScientificName().isBlank()) {
                        org.dined.dined.model.PlantAiIdentificationResponse aiData = plantAiService.identifyPlantByName(sentType.getName());
                        resolvedType = plantTypeRepository.saveAndFlush(PlantType.builder()
                            .name(aiData.getCommonName())
                            .scientificName(aiData.getScientificName())
                            .petToxicity(aiData.getPetToxicity())
                            .careInstructions(aiData.getCareInstructions())
                            .propagationInstructions(aiData.getPropagationInstructions())
                            .defaultWateringFrequencyDays(aiData.getWateringFrequencyDays())
                            .build());
                    } else {
                        resolvedType = plantTypeRepository.saveAndFlush(PlantType.builder()
                            .name(sentType.getName() != null ? sentType.getName() : sentType.getScientificName())
                            .scientificName(sentType.getScientificName())
                            .petToxicity(sentType.getPetToxicity())
                            .careInstructions(sentType.getCareInstructions())
                            .propagationInstructions(sentType.getPropagationInstructions())
                            .defaultWateringFrequencyDays(sentType.getDefaultWateringFrequencyDays() != null && sentType.getDefaultWateringFrequencyDays() != 0 ? 
                                    sentType.getDefaultWateringFrequencyDays() : 7)
                            .build());
                    }
                }
            }
            existing.setPlantType(resolvedType);
        } else {
            existing.setPlantType(null);
        }

        return plantRepository.saveAndFlush(existing);
    }

    @org.springframework.transaction.annotation.Transactional
    public Plant savePlant(Plant plant) {
        // This is mainly for new plants now
        if (plant.getId() != null) {
            return updatePlant(plant.getId(), plant);
        }
        
        if (plant.getPlantType() != null && plant.getPlantType().getId() == null) {
            PlantType sentType = plant.getPlantType();
            PlantType resolvedType = null;

            // Prioritize Scientific Name
            if (sentType.getScientificName() != null && !sentType.getScientificName().isBlank()) {
                resolvedType = plantTypeRepository.findByScientificNameIgnoreCase(sentType.getScientificName()).orElse(null);
            }

            // Fallback to Name
            if (resolvedType == null && sentType.getName() != null && !sentType.getName().isBlank()) {
                resolvedType = plantTypeRepository.findByNameIgnoreCase(sentType.getName()).orElse(null);
            }

            // Create new if not found
            if (resolvedType == null) {
                // Try to use AI to find details by name if scientific name is missing
                if (sentType.getScientificName() == null || sentType.getScientificName().isBlank()) {
                    org.dined.dined.model.PlantAiIdentificationResponse aiData = plantAiService.identifyPlantByName(sentType.getName());
                    resolvedType = plantTypeRepository.saveAndFlush(PlantType.builder()
                        .name(aiData.getCommonName())
                        .scientificName(aiData.getScientificName())
                        .petToxicity(aiData.getPetToxicity())
                        .careInstructions(aiData.getCareInstructions())
                        .propagationInstructions(aiData.getPropagationInstructions())
                        .defaultWateringFrequencyDays(aiData.getWateringFrequencyDays())
                        .build());
                } else {
                    resolvedType = plantTypeRepository.saveAndFlush(PlantType.builder()
                        .name(sentType.getName() != null ? sentType.getName() : sentType.getScientificName())
                        .scientificName(sentType.getScientificName())
                        .petToxicity(sentType.getPetToxicity())
                        .careInstructions(sentType.getCareInstructions())
                        .propagationInstructions(sentType.getPropagationInstructions())
                        .defaultWateringFrequencyDays(sentType.getDefaultWateringFrequencyDays() != null && sentType.getDefaultWateringFrequencyDays() != 0 ? 
                                sentType.getDefaultWateringFrequencyDays() : 7)
                        .build());
                }
            }
            
            plant.setPlantType(resolvedType);
        }
        return plantRepository.saveAndFlush(plant);
    }

    public void deletePlant(Long id) {
        plantRepository.deleteById(id);
    }

    public void deleteUpdate(Long id) {
        PlantUpdate update = updateRepository.findById(id).orElseThrow(() -> new RuntimeException("Update not found"));
        // Remove images associated with this update
        for (PlantImage image : update.getImages()) {
            deleteImage(image.getId());
        }
        updateRepository.deleteById(id);
    }

    public void deleteImage(Long id) {
        PlantImage image = imageRepository.findById(id).orElseThrow(() -> new RuntimeException("Image not found"));
        String path = image.getImagePath();
        
        // Check if other records use this same physical file before deleting from disk
        long count = imageRepository.countByImagePath(path);
        
        imageRepository.delete(image);

        // If this was the plant's cover photo, we might want to clear it or pick another one
        Plant plant = image.getUpdate().getPlant();
        if (path.equals(plant.getImagePath())) {
            // Find another image for this plant if available
            updateRepository.findByPlantIdOrderByDateDesc(plant.getId()).stream()
                .flatMap(u -> u.getImages().stream())
                .filter(img -> !img.getId().equals(id))
                .findFirst()
                .ifPresentOrElse(
                    nextImg -> {
                        plant.setImagePath(nextImg.getImagePath());
                        plant.setRotation(nextImg.getRotation());
                        plantRepository.save(plant);
                    },
                    () -> {
                        plant.setImagePath(null);
                        plant.setRotation(0);
                        plantRepository.save(plant);
                    }
                );
        }

        // Only delete file if no other records are using it
        if (count <= 1) {
            try {
                Files.deleteIfExists(this.root.resolve("original_" + path));
                Files.deleteIfExists(this.root.resolve("thumb_" + path));
            } catch (IOException e) {
                // Log but don't fail the transaction
                System.err.println("Could not delete image file: " + path);
            }
        }
    }

    public Plant waterPlant(Long id) {
        Plant plant = getPlantById(id);
        LocalDateTime now = LocalDateTime.now();
        plant.setLastWateredDate(now);
        
        // Explicitly calculate next water date
        if (plant.getWateringFrequencyDays() != null) {
            plant.setNextWaterDate(now.toLocalDate().plusDays(plant.getWateringFrequencyDays()));
        }

        // Reset status if it was just water overdue
        if ("Water Overdue".equals(plant.getPlantStatus())) {
            plant.setPlantStatus("Healthy");
        }
        return plantRepository.save(plant);
    }

    public Plant snoozeWatering(Long id) {
        Plant plant = getPlantById(id);
        LocalDate baseDate = plant.getNextWaterDate();
        if (baseDate == null || baseDate.isBefore(LocalDate.now())) {
            baseDate = LocalDate.now();
        }
        
        // Push forward by 1 day
        plant.setNextWaterDate(baseDate.plusDays(1));
        
        // If it was overdue, it's not anymore because we pushed the date
        if ("Water Overdue".equals(plant.getPlantStatus())) {
            plant.setPlantStatus("Healthy");
        }
        return plantRepository.save(plant);
    }

    public Plant propagatePlant(Long id) {
        Plant parent = getPlantById(id);
        Plant cutting = Plant.builder()
                .name(parent.getName() + " (Cutting)")
                .plantType(parent.getPlantType())
                .parent(parent)
                .cuttingDate(LocalDate.now())
                .currentStage("Propagating")
                .plantStatus("Healthy")
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

    public PlantUpdate updateUpdate(Long updateId, PlantUpdate updateData) {
        PlantUpdate existing = updateRepository.findById(updateId).orElseThrow(() -> new RuntimeException("Update not found"));
        existing.setDate(updateData.getDate());
        existing.setNotes(updateData.getNotes());
        return updateRepository.save(existing);
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

            if (!ALLOWED_EXTENSIONS.contains(extension)) {
                throw new IllegalArgumentException("Invalid file extension: " + extension);
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

        LocalDate today = LocalDate.now();
        long totalPlants = allPlants.size();
        long needsAttention = allPlants.stream().filter(p -> !"Healthy".equals(p.getPlantStatus())).count();
        long propagating = allPlants.stream().filter(p -> "Propagating".equals(p.getCurrentStage())).count();
        long readyToSell = allPlants.stream().filter(p -> "Ready to Sell".equals(p.getCurrentStage())).count();
        long needsWatering = allPlants.stream().filter(p -> p.getNextWaterDate() != null && !p.getNextWaterDate().isAfter(today)).count();
        long distinctLocations = allPlants.stream().map(Plant::getLocation).filter(loc -> loc != null && !loc.trim().isEmpty()).distinct().count();
        
        double totalEstimatedValue = allPlants.stream()
                .filter(p -> !"Sold".equals(p.getCurrentStage()) && p.getPrice() != null)
                .mapToDouble(Plant::getPrice)
                .sum();

        return new PlantSummary(totalPlants, needsAttention, propagating, readyToSell, needsWatering, distinctLocations, totalEstimatedValue);
    }

    public List<Plant> searchPlants(String term) {
        if (term == null || term.trim().isEmpty()) {
            return plantRepository.findAll();
        }

        if ("Need Watering".equalsIgnoreCase(term.trim())) {
            LocalDate today = LocalDate.now();
            return plantRepository.findAll().stream()
                    .filter(p -> p.getNextWaterDate() != null && !p.getNextWaterDate().isAfter(today))
                    .toList();
        }

        try {
            Long id = Long.parseLong(term.trim());
            // If it's a number, try to find exact ID match first
            return plantRepository.findById(id)
                    .map(List::of)
                    .orElseGet(() -> plantRepository.search(term, id));
        } catch (NumberFormatException e) {
            // Not a number, perform fuzzy search
            return plantRepository.search(term, -1L);
        }
    }

    public List<String> getLocations() {
        return plantRepository.findDistinctLocations();
    }
}