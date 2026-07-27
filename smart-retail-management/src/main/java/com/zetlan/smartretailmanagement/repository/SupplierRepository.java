package com.zetlan.smartretailmanagement.repository;

import com.zetlan.smartretailmanagement.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    // Spring Data JPA automatically implements this custom query based on the method name
    Optional<Supplier> findByEmail(String email);
}