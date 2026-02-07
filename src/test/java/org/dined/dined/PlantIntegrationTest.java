package org.dined.dined;

import org.dined.dined.model.Plant;
import org.dined.dined.repository.PlantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class PlantIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private PlantRepository plantRepository;

    @BeforeEach
    public void setup() {
        plantRepository.deleteAll();
    }

    @Test
    public void testCreateAndGetPlant() {
        Plant plant = Plant.builder()
                .name("Test Monstera")
                .type("Monstera")
                .wateringFrequencyDays(7)
                .build();

        ResponseEntity<Plant> response = restTemplate.postForEntity("/api/plants", plant, Plant.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getName()).isEqualTo("Test Monstera");
        
        Long id = response.getBody().getId();
        ResponseEntity<Plant> getResponse = restTemplate.getForEntity("/api/plants/" + id, Plant.class);
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getBody().getName()).isEqualTo("Test Monstera");
    }

    @Test
    public void testWaterPlant() {
        Plant plant = Plant.builder()
                .name("Thirsty Fern")
                .wateringFrequencyDays(3)
                .build();
        plant = plantRepository.save(plant);

        ResponseEntity<Plant> response = restTemplate.postForEntity("/api/plants/" + plant.getId() + "/water", null, Plant.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getLastWateredDate()).isNotNull();
        assertThat(response.getBody().getNextWaterDate()).isEqualTo(response.getBody().getLastWateredDate().toLocalDate().plusDays(3));
    }

    @Test
    public void testPropagatePlant() {
        Plant parent = Plant.builder()
                .name("Mother Plant")
                .type("Pothos")
                .wateringFrequencyDays(7)
                .location("Living Room")
                .build();
        parent = plantRepository.save(parent);

        ResponseEntity<Plant> response = restTemplate.postForEntity("/api/plants/" + parent.getId() + "/propagate", null, Plant.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getName()).isEqualTo("Mother Plant (Cutting)");
        assertThat(response.getBody().getParent().getId()).isEqualTo(parent.getId());
        assertThat(response.getBody().getStatus()).isEqualTo("Propagating");
    }

    @Test
    public void testGetSummary() {
        plantRepository.save(Plant.builder().name("P1").status("Active").price(10.0).build());
        plantRepository.save(Plant.builder().name("P2").status("Needs Attention").price(20.0).build());
        plantRepository.save(Plant.builder().name("P3").status("Propagating").build());

        ResponseEntity<Object> response = restTemplate.getForEntity("/api/plants/summary", Object.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        
        // Check content as a Map
        java.util.Map<String, Object> summary = (java.util.Map<String, Object>) response.getBody();
        assertThat(summary.get("totalPlants")).isEqualTo(3);
        assertThat(summary.get("needsAttention")).isEqualTo(1);
        assertThat(summary.get("propagating")).isEqualTo(1);
        assertThat(summary.get("totalEstimatedValue")).isEqualTo(30.0);
    }
}
