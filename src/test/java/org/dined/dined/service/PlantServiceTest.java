package org.dined.dined.service;

import org.dined.dined.model.Plant;
import org.dined.dined.model.PlantSummary;
import org.dined.dined.repository.PlantRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class PlantServiceTest {

    @Mock
    private PlantRepository plantRepository;

    @InjectMocks
    private PlantService plantService;

    @Test
    public void testGetPlantById_Found() {
        Plant expectedPlant = Plant.builder().id(1L).name("Test Plant").build();
        when(plantRepository.findById(1L)).thenReturn(Optional.of(expectedPlant));

        Plant actualPlant = plantService.getPlantById(1L);

        assertEquals(expectedPlant, actualPlant);
        assertEquals(1L, actualPlant.getId());
        assertEquals("Test Plant", actualPlant.getName());
    }

    @Test
    public void testGetPlantById_NotFound() {
        when(plantRepository.findById(2L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            plantService.getPlantById(2L);
        });

        assertEquals("Plant not found", exception.getMessage());
    }

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
}
