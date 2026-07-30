package com.zetlan.smartretailmanagement.service;

import com.zetlan.smartretailmanagement.dto.EmployeeDTO;
import com.zetlan.smartretailmanagement.exception.ResourceNotFoundException;
import com.zetlan.smartretailmanagement.model.Employee;
import com.zetlan.smartretailmanagement.model.Role;
import com.zetlan.smartretailmanagement.repository.EmployeeRepository;
import com.zetlan.smartretailmanagement.repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;

    public EmployeeService(EmployeeRepository employeeRepository, RoleRepository roleRepository) {
        this.employeeRepository = employeeRepository;
        this.roleRepository = roleRepository;
    }

    public EmployeeDTO createEmployee(EmployeeDTO dto) {
        Role role = roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with ID: " + dto.getRoleId()));

        Employee employee = new Employee();
        employee.setUsername(dto.getUsername() != null ? dto.getUsername().trim() : "user");
        employee.setFullName(dto.getFullName() != null ? dto.getFullName().trim() : "Unnamed Staff");
        employee.setEmail(dto.getEmail() != null ? dto.getEmail().trim() : "no-email@zetlan.com");
        employee.setPassword(dto.getPassword() != null ? dto.getPassword() : "DefaultPass123");
        employee.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        employee.setRole(role);

        return mapToDTO(employeeRepository.save(employee));
    }

    @Transactional(readOnly = true)
    public List<EmployeeDTO> getAllEmployees() {
        return employeeRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeeDTO getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + id));
        return mapToDTO(employee);
    }

    public EmployeeDTO updateEmployee(Long id, EmployeeDTO dto) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + id));

        if (dto.getUsername() != null) employee.setUsername(dto.getUsername().trim());
        if (dto.getFullName() != null) employee.setFullName(dto.getFullName().trim());
        if (dto.getEmail() != null) employee.setEmail(dto.getEmail().trim());
        if (dto.getIsActive() != null) employee.setIsActive(dto.getIsActive());

        if (dto.getPassword() != null && !dto.getPassword().trim().isEmpty()) {
            employee.setPassword(dto.getPassword().trim());
        }

        if (dto.getRoleId() != null && (employee.getRole() == null || !employee.getRole().getId().equals(dto.getRoleId()))) {
            Role role = roleRepository.findById(dto.getRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found with ID: " + dto.getRoleId()));
            employee.setRole(role);
        }

        return mapToDTO(employeeRepository.save(employee));
    }

    public void deleteEmployee(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employee not found with ID: " + id);
        }
        employeeRepository.deleteById(id);
    }

    private EmployeeDTO mapToDTO(Employee employee) {
        EmployeeDTO dto = new EmployeeDTO();
        dto.setId(employee.getId());
        dto.setUsername(employee.getUsername());
        dto.setFullName(employee.getFullName());
        dto.setEmail(employee.getEmail());
        dto.setIsActive(employee.getIsActive() != null ? employee.getIsActive() : true);
        dto.setRoleId(employee.getRole() != null ? employee.getRole().getId() : null);
        dto.setRoleName(employee.getRole() != null ? employee.getRole().getName() : "Unassigned");
        // We purposely do NOT map the password back to the DTO to secure it from the frontend!
        return dto;
    }
}