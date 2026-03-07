package org.dined.dined.service;

import org.dined.dined.model.PlantType;
import org.dined.dined.repository.PlantTypeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PlantTypeServiceTest {

    @Mock
    private PlantTypeRepository plantTypeRepository;

    @InjectMocks
    private PlantTypeService plantTypeService;

    @Test
    public void testGetAllTypes_ReturnsAllTypesSorted() {
        PlantType type1 = PlantType.builder().id(1L).name("Aloe Vera").build();
        PlantType type2 = PlantType.builder().id(2L).name("Snake Plant").build();
        List<PlantType> expectedTypes = Arrays.asList(type1, type2);

        when(plantTypeRepository.findAll(any(Sort.class))).thenReturn(expectedTypes);

        List<PlantType> actualTypes = plantTypeService.getAllTypes();

        assertEquals(2, actualTypes.size());
        assertEquals("Aloe Vera", actualTypes.get(0).getName());
        assertEquals("Snake Plant", actualTypes.get(1).getName());

        verify(plantTypeRepository, times(1)).findAll(
                argThat((Sort sort) -> {
                    Sort.Order order = sort.getOrderFor("name");
                    return order != null && order.getDirection() == Sort.Direction.ASC;
                })
        );
    }

    @Test
    public void testGetAllTypes_Empty() {
        when(plantTypeRepository.findAll(any(Sort.class))).thenReturn(Collections.emptyList());

        List<PlantType> actualTypes = plantTypeService.getAllTypes();

        assertEquals(0, actualTypes.size());

        verify(plantTypeRepository, times(1)).findAll(any(Sort.class));
    }
}
