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
@lombok.extern.slf4j.Slf4j
public class PlantAiService {

    @Value("${spring.ai.google.ai.api-key}")
    private String apiKey;

    @Value("${spring.ai.google.ai.chat.options.model:gemini-3-flash-preview}")
    private String model;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public PlantAiService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.baseUrl("https://generativelanguage.googleapis.com/v1beta").build();
        this.objectMapper = objectMapper;
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        if (apiKey == null || apiKey.isBlank()) {
            // Fallback to explicit env check for GOOGLE_API_KEY as confirmed by user
            apiKey = System.getenv("GOOGLE_API_KEY");
            if (apiKey == null || apiKey.isBlank()) {
                apiKey = System.getenv("GEMINI-API-KEY");
            }
            if (apiKey == null || apiKey.isBlank()) {
                apiKey = System.getenv("GEMINI_API_KEY");
            }
        }

        if (apiKey == null || apiKey.isBlank()) {
            log.error("CRITICAL: Gemini API Key is NOT configured! Please set GOOGLE_API_KEY environment variable.");
        } else {
            log.info("Gemini AI Service initialized successfully (API Key is present). Using model: {}", model);
        }
    }

    public PlantAiIdentificationResponse identifyPlant(org.springframework.core.io.Resource imageResource, String userProvidedName, org.dined.dined.model.PlantType existingType) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException("Gemini API Key is not configured. Please contact the administrator.");
        }
        try {
            byte[] imageBytes = imageResource.getContentAsByteArray();
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            String roleContext = "You are a Master Horticulturist and Botanical Specialist with decades of experience in identifying plants and providing world-class care advice.";

            String specificTask = (userProvidedName == null || userProvidedName.isBlank())
                    ? "Identify the plant in this image."
                    : "The user believes the plant in this image is a '" + userProvidedName + "'. Validate this identification and provide the care details for this specific species.";

            String enrichmentPrompt = "";
            if (existingType != null) {
                enrichmentPrompt = String.format("""
                    
                    Existing database information for this type:
                    - Scientific Name: %s
                    - Current Care Instructions: %s
                    - Current Propagation Instructions: %s
                    
                    Task Update: Please validate if the existing information is accurate. If the care or propagation instructions are missing, inadequate, or incorrect, provide professional replacements in the JSON response. If they are already high-quality and accurate, you may reuse or slightly refine them.
                    """, existingType.getScientificName(), existingType.getCareInstructions(), existingType.getPropagationInstructions());
            }

            String prompt = String.format("""
                %s
                
                Task: %s
                %s
                
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
                """, roleContext, specificTask, enrichmentPrompt);

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

            log.info("Calling Gemini API with model: {}", model);
            Map<String, Object> response = webClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/models/" + model + ":generateContent")
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
                        log.debug("AI Raw Response: {}", text);
                        // Aggressive cleanup of potential markdown or extra text
                        int firstBrace = text.indexOf("{");
                        int lastBrace = text.lastIndexOf("}");
                        if (firstBrace >= 0 && lastBrace >= 0) {
                            String jsonOnly = text.substring(firstBrace, lastBrace + 1);
                            return objectMapper.readValue(jsonOnly, PlantAiIdentificationResponse.class);
                        }
                    }
                }
            }

            log.error("Invalid response from Gemini API: {}", response);
            throw new RuntimeException("Failed to parse a valid response from the AI.");
        } catch (Exception e) {
            log.error("AI Identification Error: ", e);
            throw new RuntimeException("AI Identification Error: " + e.getMessage(), e);
        }
    }

    public PlantAiIdentificationResponse identifyPlantByName(String plantTypeName) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new RuntimeException("Gemini API Key is not configured.");
        }
        try {
            String prompt = String.format("""
                You are a Master Horticulturist. Provide botanical details for the plant type: '%s'.
                
                Provide the following information in a clean, valid JSON format:
                {
                  "name": "A catchy nickname for this specific plant instance",
                  "commonName": "The standard common name",
                  "scientificName": "The full Latin scientific name",
                  "wateringFrequencyDays": 7,
                  "petToxicity": "Concise note on toxicity",
                  "careInstructions": "HTML formatted care summary with <strong>Light</strong>, <strong>Watering</strong>, and <strong>Humidity</strong>.",
                  "propagationInstructions": "HTML formatted guide on how to propagate."
                }
                
                Constraints:
                - Return ONLY the JSON object.
                - No markdown code blocks (no ```json).
                - If you absolutely cannot identify this as a real plant species, return an object with commonName 'Unknown'.
                """, plantTypeName);

            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(Map.of("text", prompt)))
                )
            );

            log.info("Calling Gemini API for name identification: {}", plantTypeName);
            Map<String, Object> response = webClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/models/" + model + ":generateContent")
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
                        int firstBrace = text.indexOf("{");
                        int lastBrace = text.lastIndexOf("}");
                        if (firstBrace >= 0 && lastBrace >= 0) {
                            String jsonOnly = text.substring(firstBrace, lastBrace + 1);
                            PlantAiIdentificationResponse res = objectMapper.readValue(jsonOnly, PlantAiIdentificationResponse.class);
                            if ("Unknown".equalsIgnoreCase(res.getCommonName())) {
                                throw new RuntimeException("Unable to find plant type: " + plantTypeName);
                            }
                            return res;
                        }
                    }
                }
            }
            throw new RuntimeException("Unable to find plant type: " + plantTypeName);
        } catch (Exception e) {
            log.error("AI Name Identification Error: ", e);
            throw new RuntimeException(e.getMessage());
        }
    }
}
