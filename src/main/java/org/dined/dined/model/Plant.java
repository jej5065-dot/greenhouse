package org.dined.dined.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Plant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // This will serve as the "Plant Number"

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
    private Plant parent;

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
