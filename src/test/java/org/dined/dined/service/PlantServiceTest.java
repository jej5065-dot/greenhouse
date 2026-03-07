package org.dined.dined.service;

import org.dined.dined.model.Plant;
import org.dined.dined.model.PlantSummary;
import org.dined.dined.repository.PlantRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class PlantServiceTest {

    @Mock
    private PlantRepository plantRepository;

    @InjectMocks
    private PlantService plantService;

    @Test
    public void testGetPlantSummary_HappyPath() {
        Plant p1 = Plant.builder().plantStatus("Needs Attention").location("Living Room").price(10.0).build();
        Plant p2 = Plant.builder().currentStage("Propagating").location("Kitchen").price(20.0).build();
        Plant p3 = Plant.builder().currentStage("Ready to Sell").location("Living Room").price(30.0).build();
        Plant p4 = Plant.builder().currentStage("Active").location("Bedroom").price(null).build(); // No price
        Plant p5 = Plant.builder().currentStage("Sold").location("Kitchen").price(50.0).build(); // Sold

        when(plantRepository.findAll()).thenReturn(Arrays.asList(p1, p2, p3, p4, p5));

        PlantSummary summary = plantService.getPlantSummary();

        assertEquals(5, summary.getTotalPlants());
        assertEquals(1, summary.getNeedsAttention());
        assertEquals(1, summary.getPropagating());
        assertEquals(1, summary.getReadyToSell());
        assertEquals(3, summary.getDistinctLocations()); // Living Room, Kitchen, Bedroom
        assertEquals(60.0, summary.getTotalEstimatedValue(), 0.001); // 10 + 20 + 30. (50 is Sold, p4 is null)
    }

    @Test
    public void testGetPlantSummary_Empty() {
        when(plantRepository.findAll()).thenReturn(Collections.emptyList());

        PlantSummary summary = plantService.getPlantSummary();

        assertEquals(0, summary.getTotalPlants());
        assertEquals(0, summary.getNeedsAttention());
        assertEquals(0, summary.getPropagating());
        assertEquals(0, summary.getReadyToSell());
        assertEquals(0, summary.getDistinctLocations());
        assertEquals(0.0, summary.getTotalEstimatedValue(), 0.001);
    }

    @Test
    public void testGetPlantSummary_NullsAndEmpties() {
        Plant p1 = Plant.builder().currentStage("Active").location("   ").price(10.0).build(); // Empty location
        Plant p2 = Plant.builder().currentStage("Active").location(null).price(20.0).build(); // Null location
        Plant p3 = Plant.builder().currentStage("Active").location("Room").price(null).build(); // Null price

        when(plantRepository.findAll()).thenReturn(Arrays.asList(p1, p2, p3));

        PlantSummary summary = plantService.getPlantSummary();

        assertEquals(3, summary.getTotalPlants());
        assertEquals(0, summary.getNeedsAttention());
        assertEquals(0, summary.getPropagating());
        assertEquals(0, summary.getReadyToSell());
        assertEquals(1, summary.getDistinctLocations()); // Only "Room"
        assertEquals(30.0, summary.getTotalEstimatedValue(), 0.001); // 10 + 20
    }

    @Test
    public void testSnoozeWatering_NullNextWaterDate() {
        Long plantId = 1L;
        Plant plant = Plant.builder().id(plantId).nextWaterDate(null).plantStatus("Healthy").build();

        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));
        when(plantRepository.save(any(Plant.class))).thenAnswer(i -> i.getArguments()[0]);

        Plant result = plantService.snoozeWatering(plantId);

        assertEquals(LocalDate.now().plusDays(1), result.getNextWaterDate());
        assertEquals("Healthy", result.getPlantStatus());
    }

    @Test
    public void testSnoozeWatering_PastNextWaterDate() {
        Long plantId = 1L;
        LocalDate pastDate = LocalDate.now().minusDays(3);
        Plant plant = Plant.builder().id(plantId).nextWaterDate(pastDate).plantStatus("Healthy").build();

        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));
        when(plantRepository.save(any(Plant.class))).thenAnswer(i -> i.getArguments()[0]);

        Plant result = plantService.snoozeWatering(plantId);

        assertEquals(LocalDate.now().plusDays(1), result.getNextWaterDate());
        assertEquals("Healthy", result.getPlantStatus());
    }

    @Test
    public void testSnoozeWatering_FutureNextWaterDate() {
        Long plantId = 1L;
        LocalDate futureDate = LocalDate.now().plusDays(5);
        Plant plant = Plant.builder().id(plantId).nextWaterDate(futureDate).plantStatus("Healthy").build();

        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));
        when(plantRepository.save(any(Plant.class))).thenAnswer(i -> i.getArguments()[0]);

        Plant result = plantService.snoozeWatering(plantId);

        assertEquals(futureDate.plusDays(1), result.getNextWaterDate());
        assertEquals("Healthy", result.getPlantStatus());
    }

    @Test
    public void testSnoozeWatering_WaterOverdueStatus() {
        Long plantId = 1L;
        LocalDate pastDate = LocalDate.now().minusDays(2);
        Plant plant = Plant.builder().id(plantId).nextWaterDate(pastDate).plantStatus("Water Overdue").build();

        when(plantRepository.findById(plantId)).thenReturn(Optional.of(plant));
        when(plantRepository.save(any(Plant.class))).thenAnswer(i -> i.getArguments()[0]);

        Plant result = plantService.snoozeWatering(plantId);

        assertEquals(LocalDate.now().plusDays(1), result.getNextWaterDate());
        assertEquals("Healthy", result.getPlantStatus());
    }
}
