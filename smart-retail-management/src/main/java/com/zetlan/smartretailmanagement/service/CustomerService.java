package com.zetlan.smartretailmanagement.service;

import com.zetlan.smartretailmanagement.dto.CustomerDTO;
import com.zetlan.smartretailmanagement.exception.ResourceNotFoundException;
import com.zetlan.smartretailmanagement.model.Customer;
import com.zetlan.smartretailmanagement.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    // 1. CREATE
    public CustomerDTO createCustomer(CustomerDTO dto) {
        Customer customer = new Customer();
        customer.setFullName(dto.getName() != null ? dto.getName().trim() : "Unnamed Customer");
        customer.setEmail(dto.getEmail() != null ? dto.getEmail().trim() : null);
        customer.setPhone(dto.getPhone() != null ? dto.getPhone().trim() : null);
        customer.setAddress(dto.getAddress());
        customer.setLoyaltyPoints(dto.getLoyaltyPoints() != null ? dto.getLoyaltyPoints() : 0);

        Customer savedCustomer = customerRepository.save(customer);
        return mapToDTO(savedCustomer);
    }

    // 2. READ ALL
    @Transactional(readOnly = true)
    public List<CustomerDTO> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // 3. READ BY ID
    @Transactional(readOnly = true)
    public CustomerDTO getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + id));
        return mapToDTO(customer);
    }

    // 4. UPDATE
    public CustomerDTO updateCustomer(Long id, CustomerDTO dto) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + id));

        if (dto.getName() != null) customer.setFullName(dto.getName().trim());
        if (dto.getEmail() != null) customer.setEmail(dto.getEmail().trim());
        if (dto.getPhone() != null) customer.setPhone(dto.getPhone().trim());
        if (dto.getAddress() != null) customer.setAddress(dto.getAddress());

        // We deliberately preserve existing loyalty points unless explicitly updated via business logic
        Customer updatedCustomer = customerRepository.save(customer);
        return mapToDTO(updatedCustomer);
    }

    // 5. DELETE
    public void deleteCustomer(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Customer not found with ID: " + id);
        }
        customerRepository.deleteById(id);
    }

    // 6. BUSINESS LOGIC: Add Loyalty Points (Defensive null checks)
    public CustomerDTO addLoyaltyPoints(Long id, Integer pointsToAdd) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + id));

        int currentPoints = customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0;
        int addition = pointsToAdd != null ? pointsToAdd : 0;

        customer.setLoyaltyPoints(currentPoints + addition);
        return mapToDTO(customerRepository.save(customer));
    }

    // HELPER: Map Entity to DTO safely
    private CustomerDTO mapToDTO(Customer customer) {
        CustomerDTO dto = new CustomerDTO();
        dto.setId(customer.getId());
        dto.setName(customer.getFullName());
        dto.setEmail(customer.getEmail());
        dto.setPhone(customer.getPhone());
        dto.setAddress(customer.getAddress());
        dto.setLoyaltyPoints(customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0);
        return dto;
    }
}