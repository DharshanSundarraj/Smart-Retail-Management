package com.zetlan.smartretailmanagement.service;

import com.zetlan.smartretailmanagement.dto.RoleDTO;
import com.zetlan.smartretailmanagement.exception.ResourceNotFoundException;
import com.zetlan.smartretailmanagement.model.Role;
import com.zetlan.smartretailmanagement.repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoleService {

    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public RoleDTO createRole(RoleDTO dto) {
        Role role = new Role();
        role.setName(dto.getName() != null ? dto.getName().trim().toUpperCase() : "STAFF");
        Role savedRole = roleRepository.save(role);
        return mapToDTO(savedRole);
    }

    @Transactional(readOnly = true)
    public List<RoleDTO> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoleDTO getRoleById(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with ID: " + id));
        return mapToDTO(role);
    }

    private RoleDTO mapToDTO(Role role) {
        return new RoleDTO(role.getId(), role.getName());
    }
}