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
                .plantStatus("Healthy")
                .build();

        when(plantRepository.findAll()).thenReturn(List.of(plant));

        // Act
        plantScheduler.checkPlantStatus();

        // Assert
        assertThat(plant.getPlantStatus()).isEqualTo("Water Overdue");
        verify(plantRepository).save(plant);
    }

    @Test
    void checkPlantStatus_ShouldNotUpdateStatus_WhenPlantDoesNotNeedWatering() {
        // Arrange
        Plant plant = Plant.builder()
                .id(2L)
                .name("Happy Plant")
                .nextWaterDate(LocalDate.now().plusDays(1))
                .plantStatus("Healthy")
                .build();

        when(plantRepository.findAll()).thenReturn(List.of(plant));

        // Act
        plantScheduler.checkPlantStatus();

        // Assert
        assertThat(plant.getPlantStatus()).isEqualTo("Healthy");
        verify(plantRepository, never()).save(any(Plant.class));
    }

    @Test
    void checkPlantStatus_ShouldNotUpdateStatus_WhenNextWaterDateIsToday() {
        // Arrange
        Plant plant = Plant.builder()
                .id(3L)
                .name("Today Plant")
                .nextWaterDate(LocalDate.now())
                .plantStatus("Healthy")
                .build();

        when(plantRepository.findAll()).thenReturn(List.of(plant));

        // Act
        plantScheduler.checkPlantStatus();

        // Assert
        assertThat(plant.getPlantStatus()).isEqualTo("Healthy");
        verify(plantRepository, never()).save(any(Plant.class));
    }

    @Test
    void checkPlantStatus_ShouldNotUpdateStatus_WhenPlantAlreadyNeedsAttention() {
        // Arrange
        Plant plant = Plant.builder()
                .id(4L)
                .name("Already Thirsty Plant")
                .nextWaterDate(LocalDate.now().minusDays(1))
                .plantStatus("Needs Attention")
                .build();

        when(plantRepository.findAll()).thenReturn(List.of(plant));

        // Act
        plantScheduler.checkPlantStatus();

        // Assert
        assertThat(plant.getPlantStatus()).isEqualTo("Needs Attention");
        verify(plantRepository, never()).save(any(Plant.class));
    }

    @Test
    void checkPlantStatus_ShouldNotUpdateStatus_WhenNextWaterDateIsNull() {
        // Arrange
        Plant plant = Plant.builder()
                .id(5L)
                .name("Null Date Plant")
                .nextWaterDate(null)
                .plantStatus("Healthy")
                .build();

        when(plantRepository.findAll()).thenReturn(List.of(plant));

        // Act
        plantScheduler.checkPlantStatus();

        // Assert
        assertThat(plant.getPlantStatus()).isEqualTo("Healthy");
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

    @Test
    void checkPlantStatus_ShouldProcessMultiplePlants_AndOnlyUpdateThoseThatNeedIt() {
        // Arrange
        Plant thirstyPlant = Plant.builder()
                .id(1L)
                .name("Thirsty Plant")
                .nextWaterDate(LocalDate.now().minusDays(2))
                .plantStatus("Healthy")
                .build();

        Plant happyPlant = Plant.builder()
                .id(2L)
                .name("Happy Plant")
                .nextWaterDate(LocalDate.now().plusDays(3))
                .plantStatus("Healthy")
                .build();

        Plant needsAttentionPlant = Plant.builder()
                .id(3L)
                .name("Needs Attention Plant")
                .nextWaterDate(LocalDate.now().minusDays(1))
                .plantStatus("Needs Attention")
                .build();

        Plant noWaterDatePlant = Plant.builder()
                .id(4L)
                .name("No Date Plant")
                .nextWaterDate(null)
                .plantStatus("Healthy")
                .build();

        when(plantRepository.findAll()).thenReturn(List.of(
                thirstyPlant, happyPlant, needsAttentionPlant, noWaterDatePlant
        ));

        // Act
        plantScheduler.checkPlantStatus();

        // Assert
        assertThat(thirstyPlant.getPlantStatus()).isEqualTo("Water Overdue");
        assertThat(happyPlant.getPlantStatus()).isEqualTo("Healthy");
        assertThat(needsAttentionPlant.getPlantStatus()).isEqualTo("Needs Attention");
        assertThat(noWaterDatePlant.getPlantStatus()).isEqualTo("Healthy");

        verify(plantRepository, times(1)).save(thirstyPlant);
        verify(plantRepository, never()).save(happyPlant);
        verify(plantRepository, never()).save(needsAttentionPlant);
        verify(plantRepository, never()).save(noWaterDatePlant);
    }

    @Test
    void checkPlantStatus_ShouldNotUpdateStatus_WhenPlantStatusIsNull() {
        // Arrange
        Plant nullStatusPlant = Plant.builder()
                .id(6L)
                .name("Null Status Plant")
                .nextWaterDate(LocalDate.now().minusDays(1))
                .plantStatus(null)
                .build();

        when(plantRepository.findAll()).thenReturn(List.of(nullStatusPlant));

        // Act
        plantScheduler.checkPlantStatus();

        // Assert
        assertThat(nullStatusPlant.getPlantStatus()).isNull();
        verify(plantRepository, never()).save(any(Plant.class));
    }
}
