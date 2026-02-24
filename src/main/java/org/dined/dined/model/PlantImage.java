package org.dined.dined.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlantImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String imagePath;
    
    private String label; // e.g. "Top view", "Side view"
    
    @Builder.Default
    private Integer rotation = 0; // 0, 90, 180, 270 degrees

    @ManyToOne
    @JoinColumn(name = "update_id")
    @JsonIgnore
    private PlantUpdate update;
}
