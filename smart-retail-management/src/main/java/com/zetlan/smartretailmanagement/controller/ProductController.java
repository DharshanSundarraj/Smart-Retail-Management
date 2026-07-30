package com.zetlan.smartretailmanagement.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zetlan.smartretailmanagement.dto.ProductDTO;
import com.zetlan.smartretailmanagement.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // 1. CREATE: Accepts JSON data and an optional image file
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ProductDTO> addProduct(
            @RequestPart("product") String productJson,
            @RequestPart(value = "image", required = false) MultipartFile image) throws JsonProcessingException {

        ObjectMapper mapper = new ObjectMapper();
        ProductDTO productDTO = mapper.readValue(productJson, ProductDTO.class);

        ProductDTO createdProduct = productService.createProduct(productDTO, image);
        return new ResponseEntity<>(createdProduct, HttpStatus.CREATED);
    }

    // 2. READ: Get all products
    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAllProducts() {
        return new ResponseEntity<>(productService.getAllProducts(), HttpStatus.OK);
    }

    // 3. READ: Get a specific product by Database ID
    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
        return new ResponseEntity<>(productService.getProductById(id), HttpStatus.OK);
    }

    // 4. READ: Get a specific product by SKU
    @GetMapping("/sku/{sku}")
    public ResponseEntity<ProductDTO> getProductBySku(@PathVariable String sku) {
        return new ResponseEntity<>(productService.getProductBySku(sku), HttpStatus.OK);
    }

    // 5. UPDATE: Modifies existing product and handles new image uploads
    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<ProductDTO> updateProduct(
            @PathVariable Long id,
            @RequestPart("product") String productJson,
            @RequestPart(value = "image", required = false) MultipartFile image) throws JsonProcessingException {

        ObjectMapper mapper = new ObjectMapper();
        ProductDTO productDTO = mapper.readValue(productJson, ProductDTO.class);

        ProductDTO updatedProduct = productService.updateProduct(id, productDTO, image);
        return new ResponseEntity<>(updatedProduct, HttpStatus.OK);
    }

    // 6. DELETE: Remove a product from the database
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}