package org.dined.dined.repository;

import org.dined.dined.model.Plant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlantRepository extends JpaRepository<Plant, Long> {
    
    Optional<Plant> findByGuid(String guid);

    @Query("SELECT p FROM Plant p WHERE " +
           "CAST(p.id AS string) LIKE %:searchTerm% OR " +
           "p.guid LIKE %:searchTerm% OR " +
           "LOWER(p.name) LIKE LOWER(concat('%', :searchTerm, '%')) OR " +
           "LOWER(p.status) LIKE LOWER(concat('%', :searchTerm, '%')) OR " +
           "LOWER(p.type) LIKE LOWER(concat('%', :searchTerm, '%')) OR " +
           "LOWER(p.location) LIKE LOWER(concat('%', :searchTerm, '%'))")
    List<Plant> search(@Param("searchTerm") String searchTerm);

    List<Plant> findByStatus(String status);
    
    @Query("SELECT DISTINCT p.location FROM Plant p WHERE p.location IS NOT NULL")
    List<String> findDistinctLocations();
}
