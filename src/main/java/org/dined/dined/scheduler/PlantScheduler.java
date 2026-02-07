package org.dined.dined.scheduler;

import org.dined.dined.model.Plant;
import org.dined.dined.repository.PlantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class PlantScheduler {

    @Autowired
    private PlantRepository plantRepository;

    // Run every hour
    @Scheduled(fixedRate = 3600000) // 3600000 ms = 1 hour
    public void checkPlantStatus() {
        System.out.println("Running scheduled plant status check...");
        List<Plant> allPlants = plantRepository.findAll();
        LocalDate today = LocalDate.now();

        for (Plant plant : allPlants) {
            if (plant.getNextWaterDate() != null && plant.getNextWaterDate().isBefore(today)) {
                if (!"Needs Attention".equals(plant.getStatus())) {
                    plant.setStatus("Needs Attention");
                    plantRepository.save(plant);
                    System.out.println("Updated plant " + plant.getName() + " (#" + plant.getId() + ") to 'Needs Attention'.");
                }
            }
        }
        System.out.println("Plant status check complete.");
    }
}
