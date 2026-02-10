package org.dined.dined.service;

import jakarta.annotation.PostConstruct;
import org.dined.dined.model.Plant;
import org.dined.dined.model.PlantImage;
import org.dined.dined.model.PlantType;
import org.dined.dined.model.PlantUpdate;
import org.dined.dined.repository.PlantImageRepository;
import org.dined.dined.repository.PlantRepository;
import org.dined.dined.repository.PlantTypeRepository;
import org.dined.dined.repository.PlantUpdateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class DataMigrationService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PlantRepository plantRepository;

    @Autowired
    private PlantTypeRepository plantTypeRepository;

    @Autowired
    private PlantUpdateRepository updateRepository;

    @Autowired
    private PlantImageRepository imageRepository;

    @PostConstruct
    @Transactional
    public void migrateData() {
        System.out.println(">> Checking for legacy data migrations...");

        // 1. Check if the legacy 'type' column exists in the database
        List<Map<String, Object>> columns = jdbcTemplate.queryForList("PRAGMA table_info(plant)");
        boolean hasLegacyType = columns.stream().anyMatch(c -> "type".equalsIgnoreCase((String) c.get("name")));

        if (!hasLegacyType) {
            System.out.println(">> No legacy 'type' column found. Migration skipped.");
            return;
        }

        List<Plant> allPlants = plantRepository.findAll();
        for (Plant plant : allPlants) {
            boolean updated = false;

            // 2. Migrate Type to PlantType relation
            if (plant.getPlantType() == null) {
                try {
                    String legacyType = jdbcTemplate.queryForObject(
                            "SELECT type FROM plant WHERE id = ?", String.class, plant.getId());
                    
                    if (legacyType != null && !legacyType.trim().isEmpty()) {
                        String finalLegacyType = legacyType;
                        PlantType type = plantTypeRepository.findByName(legacyType)
                                .orElseGet(() -> plantTypeRepository.save(PlantType.builder().name(finalLegacyType).build()));
                        plant.setPlantType(type);
                        updated = true;
                        System.out.println(">> Migrated type '" + legacyType + "' for plant #" + plant.getId());
                    }
                } catch (Exception e) {
                    // Column might be empty or missing for this row
                }
            }

            // 3. Migrate imagePath to Timeline (if not already there)
            if (plant.getImagePath() != null && !plant.getImagePath().isEmpty()) {
                if (plant.getUpdates().isEmpty()) {
                    PlantUpdate initialUpdate = PlantUpdate.builder()
                            .date(LocalDate.now())
                            .notes("Initial photo from migration")
                            .plant(plant)
                            .build();
                    initialUpdate = updateRepository.save(initialUpdate);

                    PlantImage initialImage = PlantImage.builder()
                            .imagePath(plant.getImagePath())
                            .label("Original Photo")
                            .rotation(plant.getRotation() != null ? plant.getRotation() : 0)
                            .update(initialUpdate)
                            .build();
                    imageRepository.save(initialImage);
                    
                    updated = true;
                    System.out.println(">> Migrated legacy photo to timeline for plant #" + plant.getId());
                }
            }

            if (updated) {
                plantRepository.save(plant);
            }
        }
        
        System.out.println(">> Data migration complete.");
    }
}
