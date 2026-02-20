package org.dined.dined.scheduler;

import org.dined.dined.model.Plant;
import org.dined.dined.repository.PlantRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class PlantSchedulerTest {

    @Mock
    private PlantRepository plantRepository;

    @InjectMocks
    private PlantScheduler plantScheduler;

    @Test
    void checkPlantStatus_ShouldUpdateStatus_WhenPlantNeedsWatering() {
        // Arrange
        Plant plant = Plant.builder()
                .id(1L)
                .name("Thirsty Plant")
                .nextWaterDate(LocalDate.now().minusDays(1))
                .status("Healthy")
                .build();

        when(plantRepository.findAll()).thenReturn(List.of(plant));

        // Act
        plantScheduler.checkPlantStatus();

        // Assert
        assertThat(plant.getStatus()).isEqualTo("Needs Attention");
        verify(plantRepository).save(plant);
    }

    @Test
    void checkPlantStatus_ShouldNotUpdateStatus_WhenPlantDoesNotNeedWatering() {
        // Arrange
        Plant plant = Plant.builder()
                .id(2L)
                .name("Happy Plant")
                .nextWaterDate(LocalDate.now().plusDays(1))
                .status("Healthy")
                .build();

        when(plantRepository.findAll()).thenReturn(List.of(plant));

        // Act
        plantScheduler.checkPlantStatus();

        // Assert
        assertThat(plant.getStatus()).isEqualTo("Healthy");
        verify(plantRepository, never()).save(any(Plant.class));
    }

    @Test
    void checkPlantStatus_ShouldNotUpdateStatus_WhenNextWaterDateIsToday() {
        // Arrange
        Plant plant = Plant.builder()
                .id(3L)
                .name("Today Plant")
                .nextWaterDate(LocalDate.now())
                .status("Healthy")
                .build();

        when(plantRepository.findAll()).thenReturn(List.of(plant));

        // Act
        plantScheduler.checkPlantStatus();

        // Assert
        assertThat(plant.getStatus()).isEqualTo("Healthy");
        verify(plantRepository, never()).save(any(Plant.class));
    }

    @Test
    void checkPlantStatus_ShouldNotUpdateStatus_WhenPlantAlreadyNeedsAttention() {
        // Arrange
        Plant plant = Plant.builder()
                .id(4L)
                .name("Already Thirsty Plant")
                .nextWaterDate(LocalDate.now().minusDays(1))
                .status("Needs Attention")
                .build();

        when(plantRepository.findAll()).thenReturn(List.of(plant));

        // Act
        plantScheduler.checkPlantStatus();

        // Assert
        assertThat(plant.getStatus()).isEqualTo("Needs Attention");
        verify(plantRepository, never()).save(any(Plant.class));
    }

    @Test
    void checkPlantStatus_ShouldNotUpdateStatus_WhenNextWaterDateIsNull() {
        // Arrange
        Plant plant = Plant.builder()
                .id(5L)
                .name("Null Date Plant")
                .nextWaterDate(null)
                .status("Healthy")
                .build();

        when(plantRepository.findAll()).thenReturn(List.of(plant));

        // Act
        plantScheduler.checkPlantStatus();

        // Assert
        assertThat(plant.getStatus()).isEqualTo("Healthy");
        verify(plantRepository, never()).save(any(Plant.class));
    }

    @Test
    void checkPlantStatus_ShouldHandleEmptyList() {
        // Arrange
        when(plantRepository.findAll()).thenReturn(Collections.emptyList());

        // Act
        plantScheduler.checkPlantStatus();

        // Assert
        verify(plantRepository, never()).save(any(Plant.class));
    }
}
