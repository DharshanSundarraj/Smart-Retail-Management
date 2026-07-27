package com.zetlan.smartretailmanagement.service;

import com.zetlan.smartretailmanagement.dto.SupplierDTO;
import com.zetlan.smartretailmanagement.model.Supplier;
import com.zetlan.smartretailmanagement.repository.SupplierRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;

    // Constructor Injection (Best Practice)
    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    public SupplierDTO createSupplier(SupplierDTO dto) {
        // 1. Map DTO to Entity (Incoming Data)
        Supplier entity = new Supplier();
        entity.setCompanyName(dto.getCompanyName());
        entity.setContactPerson(dto.getContactPerson());
        entity.setEmail(dto.getEmail());
        entity.setPhone(dto.getPhone());
        entity.setAddress(dto.getAddress());

        // 2. Save to Database
        Supplier savedEntity = supplierRepository.save(entity);

        // 3. Map Entity back to DTO (Outgoing Data with generated ID)
        return mapToDTO(savedEntity);
    }

    public List<SupplierDTO> getAllSuppliers() {
        List<Supplier> suppliers = supplierRepository.findAll();

        // Map the entire list of Entities to a list of DTOs
        return suppliers.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // Helper method to keep mapping logic clean and reusable
    private SupplierDTO mapToDTO(Supplier entity) {
        SupplierDTO dto = new SupplierDTO();
        dto.setId(entity.getId());
        dto.setCompanyName(entity.getCompanyName());
        dto.setContactPerson(entity.getContactPerson());
        dto.setEmail(entity.getEmail());
        dto.setPhone(entity.getPhone());
        dto.setAddress(entity.getAddress());
        return dto;
    }
}