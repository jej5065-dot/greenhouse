package org.dined.dined.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
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
@EqualsAndHashCode
@ToString
public class Plant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Builder.Default
    @Column(unique = true, nullable = false)
    private String guid = UUID.randomUUID().toString();

    private String name;

    @ManyToOne
    @JoinColumn(name = "plant_type_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private PlantType plantType;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Plant parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Plant> children = new ArrayList<>();

    @OneToMany(mappedBy = "plant", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @OrderBy("date DESC")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<PlantUpdate> updates = new ArrayList<>();

    private LocalDate cuttingDate;
    private LocalDateTime lastWateredDate;
    private String location;
    
    @Builder.Default
    private String currentStage = "Active"; // e.g. Active, Propagating, Ready to Sell, Sold
    
    @Builder.Default
    private String plantStatus = "Healthy"; // e.g. Healthy, Water Overdue, Needs Attention
    
    private boolean goodForTerrariums;
    private Integer wateringFrequencyDays;
    private LocalDate nextWaterDate;
    
    private Double price;
    private LocalDate soldDate;
    private Double originalPurchasePrice;
    
    private String totalPropagationTime;
    
    private String imagePath;
    
    @Builder.Default
    private Integer rotation = 0;

    // Helper for the frontend Lineage tab since the full 'parent' is ignored
    @JsonProperty("parent")
    public java.util.Map<String, Object> getParentSummary() {
        if (parent == null) return null;
        java.util.Map<String, Object> summary = new java.util.HashMap<>();
        summary.put("id", parent.getId());
        summary.put("name", parent.getName());
        summary.put("guid", parent.getGuid());
        return summary;
    }

    @PrePersist
    @PreUpdate
    public void calculateNextWaterDate() {
        if (lastWateredDate != null && wateringFrequencyDays != null) {
            this.nextWaterDate = lastWateredDate.toLocalDate().plusDays(wateringFrequencyDays);
        }
    }
}
