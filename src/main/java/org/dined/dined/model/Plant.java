package org.dined.dined.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Plant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Builder.Default
    @Column(unique = true, nullable = false)
    private String guid = UUID.randomUUID().toString();

    private String name;
    private String type;
    
    @Column(length = 1000)
    private String careInstructions;
    
    @Column(length = 1000)
    private String propagationInstructions;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    @JsonIgnoreProperties("children")
    private Plant parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    @Builder.Default
    @JsonIgnoreProperties("parent")
    private List<Plant> children = new ArrayList<>();

    @OneToMany(mappedBy = "plant", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @OrderBy("date DESC")
    @JsonIgnoreProperties("plant")
    private List<PlantUpdate> updates = new ArrayList<>();

    private LocalDate cuttingDate;
    private LocalDateTime lastWateredDate;
    private String location;
    
    private String status; // propagating, needs attention, ready to sell, etc.
    
    private boolean goodForTerrariums;
    private Integer wateringFrequencyDays;
    private LocalDate nextWaterDate;
    
    private Double price;
    private LocalDate soldDate;
    private Double originalPurchasePrice;
    
    private String totalPropagationTime; // Could be calculated, storing as string for now
    
    private String imagePath;

    @PrePersist
    @PreUpdate
    public void calculateNextWaterDate() {
        if (lastWateredDate != null && wateringFrequencyDays != null) {
            this.nextWaterDate = lastWateredDate.toLocalDate().plusDays(wateringFrequencyDays);
        }
    }
}
