package com.zetlan.smartretailmanagement.service;

import com.zetlan.smartretailmanagement.dto.ProductDTO;
import com.zetlan.smartretailmanagement.exception.ResourceNotFoundException;
import com.zetlan.smartretailmanagement.model.Category;
import com.zetlan.smartretailmanagement.model.Product;
import com.zetlan.smartretailmanagement.repository.CategoryRepository;
import com.zetlan.smartretailmanagement.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    // HELPER: Save the image file locally and return the access URL
    private String saveImage(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        try {
            Path uploadPath = Paths.get("uploads");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);

            return "/uploads/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store image file.", e);
        }
    }

    // 1. CREATE
    public ProductDTO createProduct(ProductDTO dto, MultipartFile image) {
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + dto.getCategoryId()));

        Product product = new Product();
        product.setSku(dto.getSku());
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setStockQuantity(dto.getStockQuantity());
        product.setCategory(category);

        // Handle Image
        product.setImageUrl(dto.getImageUrl());
        String localImagePath = saveImage(image);
        if (localImagePath != null) {
            product.setImageUrl(localImagePath);
        }

        Product savedProduct = productRepository.save(product);
        return mapToDTO(savedProduct);
    }

    // 2. READ ALL
    @Transactional(readOnly = true)
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // 3. READ BY SKU
    @Transactional(readOnly = true)
    public ProductDTO getProductBySku(String sku) {
        Product product = productRepository.findBySku(sku)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with SKU: " + sku));
        return mapToDTO(product);
    }

    // 4. READ BY ID
    @Transactional(readOnly = true)
    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
        return mapToDTO(product);
    }

    // 5. UPDATE
    public ProductDTO updateProduct(Long id, ProductDTO dto, MultipartFile image) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));

        product.setSku(dto.getSku());
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setStockQuantity(dto.getStockQuantity());

        if (dto.getCategoryId() != null &&
                (product.getCategory() == null || !product.getCategory().getId().equals(dto.getCategoryId()))) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + dto.getCategoryId()));
            product.setCategory(category);
        }

        // Handle Image
        if (dto.getImageUrl() != null && !dto.getImageUrl().isEmpty()) {
            product.setImageUrl(dto.getImageUrl());
        }
        String localImagePath = saveImage(image);
        if (localImagePath != null) {
            product.setImageUrl(localImagePath);
        }

        Product updatedProduct = productRepository.save(product);
        return mapToDTO(updatedProduct);
    }

    // 6. DELETE
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found with ID: " + id);
        }
        productRepository.deleteById(id);
    }

    // HELPER: Map Entity to DTO
    private ProductDTO mapToDTO(Product product) {
        ProductDTO dto = new ProductDTO();
        dto.setId(product.getId());
        dto.setSku(product.getSku());
        dto.setName(product.getName());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setStockQuantity(product.getStockQuantity());
        dto.setImageUrl(product.getImageUrl());

        if (product.getCategory() != null) {
            dto.setCategoryId(product.getCategory().getId());
            dto.setCategoryName(product.getCategory().getName());
        }
        return dto;
    }
}