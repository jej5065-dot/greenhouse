package org.dined.dined.service;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.dined.dined.model.PlantType;
import org.dined.dined.repository.PlantTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.data.domain.Sort;

@Service
@lombok.extern.slf4j.Slf4j
public class PlantTypeService {

    @Autowired
    private PlantTypeRepository plantTypeRepository;

    @Autowired
    private PlantService plantService;

    public List<PlantType> getAllTypes() {
        return plantTypeRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
    }

    public PlantType saveType(PlantType type) {
        return plantTypeRepository.save(type);
    }

    public PlantType updateType(Long id, PlantType typeDetails) {
        PlantType type = plantTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PlantType not found"));

        type.setName(typeDetails.getName());
        type.setScientificName(typeDetails.getScientificName());
        type.setOtherNames(typeDetails.getOtherNames());
        type.setPetToxicity(typeDetails.getPetToxicity());
        type.setCareInstructions(typeDetails.getCareInstructions());
        type.setPropagationInstructions(typeDetails.getPropagationInstructions());
        type.setDefaultWateringFrequencyDays(typeDetails.getDefaultWateringFrequencyDays());

        return plantTypeRepository.save(type);
    }

    public void deleteType(Long id) {
        plantTypeRepository.deleteById(id);
    }

    public String saveTypeImage(Long id, MultipartFile file) throws IOException {
        PlantType type = plantTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PlantType not found"));

        String filename = plantService.saveImage(file);
        type.setExampleImagePath(filename);
        plantTypeRepository.save(type);

        return filename;
    }

    public void importCsv(MultipartFile file) throws Exception {
        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(fileReader,
                     CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {

            Iterable<CSVRecord> csvRecords = csvParser.getRecords();

            for (CSVRecord record : csvRecords) {
                String typeName = record.get("Plant Type");
                String scientificName = record.get("Scientific Name");
                
                if (scientificName == null || scientificName.isBlank()) {
                    log.warn("Skipping record with missing Scientific Name: {}", typeName);
                    continue;
                }

                // Prioritize Scientific Name for lookup
                PlantType plantType = plantTypeRepository.findByScientificNameIgnoreCase(scientificName)
                        .orElseGet(() -> plantTypeRepository.findByNameIgnoreCase(typeName)
                                .orElse(new PlantType()));

                plantType.setName(typeName != null && !typeName.isBlank() ? typeName : scientificName);
                plantType.setScientificName(scientificName);
                plantType.setOtherNames(record.isMapped("Other Names") ? record.get("Other Names") : "");
                plantType.setPetToxicity(record.get("Pet Toxicity"));
                plantType.setCareInstructions(record.get("Care Instructions"));
                plantType.setPropagationInstructions(record.get("Propagation Instructions"));
                
                String freqStr = record.get("Watering Frequency (Days)");
                if (freqStr != null && !freqStr.isEmpty()) {
                    try {
                        plantType.setDefaultWateringFrequencyDays(Integer.parseInt(freqStr));
                    } catch (NumberFormatException e) {
                        log.warn("Invalid watering frequency for {}: {}", scientificName, freqStr);
                    }
                }

                plantTypeRepository.save(plantType);
            }
        }
    }
}
