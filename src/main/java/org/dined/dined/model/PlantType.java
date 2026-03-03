package org.dined.dined.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlantType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name; // e.g. "Monstera Deliciosa"

    private String scientificName;
    private String otherNames; // Common aliases
    private String petToxicity; // String field as requested

    @Column(columnDefinition = "TEXT")
    private String careInstructions;

    @Column(columnDefinition = "TEXT")
    private String propagationInstructions;

    private String exampleImagePath;

    private Integer defaultWateringFrequencyDays;
}
