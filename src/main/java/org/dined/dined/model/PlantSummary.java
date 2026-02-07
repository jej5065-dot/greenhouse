package org.dined.dined.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlantSummary {
    private long totalPlants;
    private long needsAttention;
    private long propagating;
    private long readyToSell;
    private long distinctLocations;
    private double totalEstimatedValue;
}
