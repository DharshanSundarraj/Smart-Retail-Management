package com.zetlan.smartretailmanagement.controller;

import com.zetlan.smartretailmanagement.dto.EmployeeDTO;
import com.zetlan.smartretailmanagement.service.EmployeeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    // Using a Map allows us to catch the raw password from the JSON body without exposing it in the DTO
    @PostMapping
    public ResponseEntity<EmployeeDTO> addEmployee(@RequestBody Map<String, Object> payload) {
        EmployeeDTO dto = new EmployeeDTO();
        dto.setUsername((String) payload.get("username"));
        dto.setFullName((String) payload.get("fullName"));
        dto.setEmail((String) payload.get("email"));

        // Ensure roleId is safely parsed as Long
        Number roleIdNum = (Number) payload.get("roleId");
        dto.setRoleId(roleIdNum.longValue());

        String password = (String) payload.get("password");

        EmployeeDTO createdEmployee = employeeService.createEmployee(dto, password);
        return new ResponseEntity<>(createdEmployee, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<EmployeeDTO>> getAllEmployees() {
        return new ResponseEntity<>(employeeService.getAllEmployees(), HttpStatus.OK);
    }
}