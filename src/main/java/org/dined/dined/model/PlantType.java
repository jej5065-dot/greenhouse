package org.dined.dined.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(indexes = {
    @Index(name = "idx_plant_type_scientific_name", columnList = "scientificName")
})
public class PlantType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // Common name, e.g. "Swiss Cheese Plant"

    @Column(unique = true, nullable = false)
    private String scientificName; // e.g. "Monstera Deliciosa"

    private String otherNames; // Common aliases
    private String petToxicity; // String field as requested

    @Column(columnDefinition = "TEXT")
    private String careInstructions;

    @Column(columnDefinition = "TEXT")
    private String propagationInstructions;

    private String exampleImagePath;

    private Integer defaultWateringFrequencyDays;
}
