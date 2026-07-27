package com.zetlan.smartretailmanagement.service;

import com.zetlan.smartretailmanagement.model.Role;
import com.zetlan.smartretailmanagement.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoleService {

    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public Role createRole(Role role) {
        // Automatically convert role names to uppercase for strict database consistency
        role.setName(role.getName().toUpperCase());
        return roleRepository.save(role);
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }
}