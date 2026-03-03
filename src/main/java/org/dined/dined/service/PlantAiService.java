package org.dined.dined.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.dined.dined.model.PlantAiIdentificationResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class PlantAiService {

    @Value("${spring.ai.google.ai.api-key}")
    private String apiKey;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public PlantAiService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.baseUrl("https://generativelanguage.googleapis.com/v1beta").build();
        this.objectMapper = objectMapper;
    }

    public PlantAiIdentificationResponse identifyPlant(Resource imageResource, String userProvidedName) {
        try {
            byte[] imageBytes = imageResource.getContentAsByteArray();
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            String roleContext = "You are a Master Horticulturist and Botanical Specialist with decades of experience in identifying plants and providing world-class care advice.";
            
            String specificTask = (userProvidedName == null || userProvidedName.isBlank()) 
                ? "Identify the plant in this image." 
                : "The user believes the plant in this image is a '" + userProvidedName + "'. Validate this identification and provide the care details for this specific species.";

            String prompt = String.format("""
                %s
                
                Task: %s
                
                Provide the following information in a clean, valid JSON format:
                {
                  "name": "A catchy nickname for this specific plant instance (e.g., 'Monty the Monstera')",
                  "commonName": "The standard common name of the species",
                  "scientificName": "The full Latin scientific name including genus and species",
                  "wateringFrequencyDays": 7, (An integer representing the average days between waterings for this species in a standard indoor environment)
                  "petToxicity": "A detailed but concise note on toxicity to cats and dogs (e.g., 'Toxic: contains calcium oxalate crystals')",
                  "careInstructions": "High-quality HTML formatted care summary. Include sections for <strong>Light</strong>, <strong>Watering</strong>, and <strong>Humidity</strong> using <ul> and <li> tags.",
                  "propagationInstructions": "A professional HTML formatted guide on how to propagate this specific plant (e.g., water nodes, division, seeds)."
                }
                
                Constraints:
                - Return ONLY the JSON object.
                - No markdown code blocks (no ```json).
                - Ensure the HTML in careInstructions and propagationInstructions is valid and uses standard tags.
                - If the image is not a plant, return an object with commonName 'Unknown' and a polite message in careInstructions.
                """, roleContext, specificTask);

            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(
                        Map.of("text", prompt),
                        Map.of("inline_data", Map.of(
                            "mime_type", "image/jpeg",
                            "data", base64Image
                        ))
                    ))
                )
            );

            Map<String, Object> response = webClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/models/gemini-1.5-flash:generateContent")
                            .queryParam("key", apiKey)
                            .build())
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> candidate = candidates.get(0);
                    Map<String, Object> content = (Map<String, Object>) candidate.get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    if (!parts.isEmpty()) {
                        String text = (String) parts.get(0).get("text");
                        // Aggressive cleanup of potential markdown or extra text
                        String jsonOnly = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
                        return objectMapper.readValue(jsonOnly, PlantAiIdentificationResponse.class);
                    }
                }
            }

            throw new RuntimeException("Failed to parse a valid response from the AI.");
        } catch (Exception e) {
            throw new RuntimeException("AI Identification Error: " + e.getMessage(), e);
        }
    }
}
