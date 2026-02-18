package org.dined.dined.repository;

import org.dined.dined.model.PlantImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlantImageRepository extends JpaRepository<PlantImage, Long> {
    long countByImagePath(String imagePath);
}
