package org.dined.dined.model;

import lombok.Data;

@Data
public class PlantAiIdentificationResponse {
    private String name;
    private String scientificName;
    private String commonName;
    private int wateringFrequencyDays;
    private String petToxicity;
    private String careInstructions;
    private String propagationInstructions;
}
