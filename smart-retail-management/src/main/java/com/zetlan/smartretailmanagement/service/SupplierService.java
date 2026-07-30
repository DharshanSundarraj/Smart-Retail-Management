package com.zetlan.smartretailmanagement.service;

import com.zetlan.smartretailmanagement.dto.SupplierDTO;
import com.zetlan.smartretailmanagement.exception.ResourceNotFoundException;
import com.zetlan.smartretailmanagement.model.Supplier;
import com.zetlan.smartretailmanagement.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    // 1. CREATE
    public SupplierDTO createSupplier(SupplierDTO dto) {
        Supplier entity = new Supplier();
        entity.setCompanyName(dto.getCompanyName() != null ? dto.getCompanyName().trim() : "Unnamed Supplier");
        entity.setContactPerson(dto.getContactPerson() != null ? dto.getContactPerson().trim() : null);
        entity.setEmail(dto.getEmail() != null ? dto.getEmail().trim() : null);
        entity.setPhone(dto.getPhone() != null ? dto.getPhone().trim() : null);
        entity.setAddress(dto.getAddress());

        return mapToDTO(supplierRepository.save(entity));
    }

    // 2. READ ALL
    @Transactional(readOnly = true)
    public List<SupplierDTO> getAllSuppliers() {
        return supplierRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // 3. READ BY ID
    @Transactional(readOnly = true)
    public SupplierDTO getSupplierById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with ID: " + id));
        return mapToDTO(supplier);
    }

    // 4. UPDATE
    public SupplierDTO updateSupplier(Long id, SupplierDTO dto) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with ID: " + id));

        if (dto.getCompanyName() != null) supplier.setCompanyName(dto.getCompanyName().trim());
        if (dto.getContactPerson() != null) supplier.setContactPerson(dto.getContactPerson().trim());
        if (dto.getEmail() != null) supplier.setEmail(dto.getEmail().trim());
        if (dto.getPhone() != null) supplier.setPhone(dto.getPhone().trim());
        if (dto.getAddress() != null) supplier.setAddress(dto.getAddress());

        return mapToDTO(supplierRepository.save(supplier));
    }

    // 5. DELETE
    public void deleteSupplier(Long id) {
        if (!supplierRepository.existsById(id)) {
            throw new ResourceNotFoundException("Supplier not found with ID: " + id);
        }
        supplierRepository.deleteById(id);
    }

    // HELPER: Map Entity to DTO safely
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