package com.zetlan.smartretailmanagement.repository;

import com.zetlan.smartretailmanagement.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    // Dynamic query method: Spring automatically translates this into a SQL 'WHERE sku = ?'
    Optional<Product> findBySku(String sku);
}