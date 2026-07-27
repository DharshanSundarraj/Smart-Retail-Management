package com.zetlan.smartretailmanagement.controller;

import com.zetlan.smartretailmanagement.exception.ResourceNotFoundException;
import com.zetlan.smartretailmanagement.model.Customer;
import com.zetlan.smartretailmanagement.repository.CustomerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerRepository customerRepository;

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @PostMapping
    public ResponseEntity<Customer> createCustomer(@RequestBody Customer customer) {
        return new ResponseEntity<>(customerRepository.save(customer), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return new ResponseEntity<>(customerRepository.findAll(), HttpStatus.OK);
    }

    // Quick endpoint to update loyalty points after a purchase
    @PutMapping("/{id}/points")
    public ResponseEntity<Customer> updateLoyaltyPoints(@PathVariable Long id, @RequestParam Integer pointsToAdd) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        customer.setLoyaltyPoints(customer.getLoyaltyPoints() + pointsToAdd);
        return new ResponseEntity<>(customerRepository.save(customer), HttpStatus.OK);
    }
}