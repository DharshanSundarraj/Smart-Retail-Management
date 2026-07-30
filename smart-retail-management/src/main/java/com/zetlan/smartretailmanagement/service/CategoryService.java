package com.zetlan.smartretailmanagement.service;

import com.zetlan.smartretailmanagement.dto.CategoryDTO;
import com.zetlan.smartretailmanagement.model.Category;
import com.zetlan.smartretailmanagement.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAll().stream().map(category -> {
            CategoryDTO dto = new CategoryDTO();
            dto.setId(category.getId());
            dto.setName(category.getName());
            dto.setDescription(category.getDescription());
            return dto;
        }).collect(Collectors.toList());
    }
}