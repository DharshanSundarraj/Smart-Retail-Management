package com.zetlan.smartretailmanagement.service;

import com.zetlan.smartretailmanagement.dto.EmployeeDTO;
import com.zetlan.smartretailmanagement.exception.ResourceNotFoundException;
import com.zetlan.smartretailmanagement.model.Employee;
import com.zetlan.smartretailmanagement.model.Role;
import com.zetlan.smartretailmanagement.repository.EmployeeRepository;
import com.zetlan.smartretailmanagement.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;

    public EmployeeService(EmployeeRepository employeeRepository, RoleRepository roleRepository) {
        this.employeeRepository = employeeRepository;
        this.roleRepository = roleRepository;
    }

    public EmployeeDTO createEmployee(EmployeeDTO dto, String rawPassword) {
        Role role = roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        Employee employee = new Employee();
        employee.setUsername(dto.getUsername());
        employee.setFullName(dto.getFullName());
        employee.setEmail(dto.getEmail());
        // In Phase 4, this will be hashed with BCrypt. For now, we store plain text to test the DB.
        employee.setPassword(rawPassword);
        employee.setRole(role);

        Employee savedEmployee = employeeRepository.save(employee);
        return mapToDTO(savedEmployee);
    }

    public List<EmployeeDTO> getAllEmployees() {
        return employeeRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    private EmployeeDTO mapToDTO(Employee employee) {
        EmployeeDTO dto = new EmployeeDTO();
        dto.setId(employee.getId());
        dto.setUsername(employee.getUsername());
        dto.setFullName(employee.getFullName());
        dto.setEmail(employee.getEmail());
        dto.setIsActive(employee.getIsActive());
        dto.setRoleId(employee.getRole().getId());
        dto.setRoleName(employee.getRole().getName());
        return dto;
    }
}