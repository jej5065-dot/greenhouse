package org.dined.dined.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

class PlantServiceTest {

    private final PlantService plantService = new PlantService();
    private final Path root = Paths.get("uploads");

    @AfterEach
    void tearDown() throws IOException {
        // Clean up uploads directory after test
        if (Files.exists(root)) {
            try (Stream<Path> walk = Files.walk(root)) {
                walk.sorted(java.util.Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
            }
        }
    }

    @Test
    void testSaveImage_UnrestrictedUpload() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "evil.sh",
                "text/plain",
                "echo 'pwned'".getBytes()
        );

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            plantService.saveImage(file);
        });

        assertEquals("Invalid file extension: sh", exception.getMessage());
    }

    @Test
    void testSaveImage_ValidUpload() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "nice_plant.jpg",
                "image/jpeg",
                new byte[]{1, 2, 3, 4} // Dummy image content
        );

        String savedFilename = plantService.saveImage(file);

        assertNotNull(savedFilename);
        assertTrue(savedFilename.endsWith(".jpg"));

        // Verify files exist
        assertTrue(Files.exists(root.resolve("original_" + savedFilename)));
        assertTrue(Files.exists(root.resolve("thumb_" + savedFilename)));
    }
}
