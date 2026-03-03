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

    public PlantAiIdentificationResponse identifyPlant(Resource imageResource) {
        try {
            byte[] imageBytes = imageResource.getContentAsByteArray();
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            String prompt = """
                Identify the plant in this image. 
                Provide the following information in a clean JSON format:
                {
                  "name": "Suggested nickname for this specific plant instance",
                  "commonName": "Common species name",
                  "scientificName": "Scientific species name",
                  "wateringFrequencyDays": 7,
                  "petToxicity": "Brief description of toxicity to cats and dogs",
                  "careInstructions": "Short HTML formatted care summary",
                  "propagationInstructions": "Short HTML formatted propagation guide"
                }
                Only return the JSON object, no other text or markdown markers.
                """;

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
                        // Clean markdown if present
                        text = text.replaceAll("```json", "").replaceAll("```", "").trim();
                        return objectMapper.readValue(text, PlantAiIdentificationResponse.class);
                    }
                }
            }

            throw new RuntimeException("Failed to identify plant from AI response");
        } catch (Exception e) {
            throw new RuntimeException("Error during plant identification: " + e.getMessage(), e);
        }
    }
}
