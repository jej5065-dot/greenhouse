package org.dined.dined.repository;

import org.dined.dined.model.PlantUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlantUpdateRepository extends JpaRepository<PlantUpdate, Long> {
    List<PlantUpdate> findByPlantIdOrderByDateDesc(Long plantId);
}
