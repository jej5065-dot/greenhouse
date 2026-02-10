package org.dined.dined.repository;

import org.dined.dined.model.PlantType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PlantTypeRepository extends JpaRepository<PlantType, Long> {
    Optional<PlantType> findByName(String name);
}
