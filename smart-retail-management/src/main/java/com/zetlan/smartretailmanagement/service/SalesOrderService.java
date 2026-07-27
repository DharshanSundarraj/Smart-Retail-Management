package com.zetlan.smartretailmanagement.service;

import com.zetlan.smartretailmanagement.dto.OrderItemDTO;
import com.zetlan.smartretailmanagement.dto.SalesOrderDTO;
import com.zetlan.smartretailmanagement.exception.ResourceNotFoundException;
import com.zetlan.smartretailmanagement.model.Employee;
import com.zetlan.smartretailmanagement.model.OrderItem;
import com.zetlan.smartretailmanagement.model.Product;
import com.zetlan.smartretailmanagement.model.SalesOrder;
import com.zetlan.smartretailmanagement.repository.EmployeeRepository;
import com.zetlan.smartretailmanagement.repository.ProductRepository;
import com.zetlan.smartretailmanagement.repository.SalesOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final ProductRepository productRepository;
    private final EmployeeRepository employeeRepository;

    public SalesOrderService(SalesOrderRepository salesOrderRepository,
                             ProductRepository productRepository,
                             EmployeeRepository employeeRepository) {
        this.salesOrderRepository = salesOrderRepository;
        this.productRepository = productRepository;
        this.employeeRepository = employeeRepository;
    }

    // @Transactional ensures that if any part of the checkout fails, the whole thing rolls back
    @Transactional
    public SalesOrderDTO createOrder(SalesOrderDTO dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        SalesOrder order = new SalesOrder();
        // Generate a dynamic, unique order number
        order.setOrderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setStatus("COMPLETED");
        order.setEmployee(employee);

        BigDecimal runningTotal = BigDecimal.ZERO;
        List<OrderItem> entityItems = new ArrayList<>();

        for (OrderItemDTO itemDto : dto.getItems()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

            OrderItem item = new OrderItem();
            item.setSalesOrder(order);
            item.setProduct(product);
            item.setQuantity(itemDto.getQuantity());

            // Capture the current live price, regardless of what the frontend sent
            item.setUnitPrice(product.getPrice());

            BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity()));
            item.setSubtotal(subtotal);

            if (product.getStockQuantity() < itemDto.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName());
            }
            // Deduct the stock and save back to the database
            product.setStockQuantity(product.getStockQuantity() - itemDto.getQuantity());
            productRepository.save(product);
            // -------------------------------------

            entityItems.add(item);
            runningTotal = runningTotal.add(subtotal);

            // Note: Inventory deduction logic would go here
        }

        order.setOrderItems(entityItems);
        order.setTotalAmount(runningTotal);

        SalesOrder savedOrder = salesOrderRepository.save(order);
        return mapToDTO(savedOrder);
    }

    private SalesOrderDTO mapToDTO(SalesOrder order) {
        SalesOrderDTO dto = new SalesOrderDTO();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setStatus(order.getStatus());
        dto.setEmployeeId(order.getEmployee().getId());
        dto.setEmployeeName(order.getEmployee().getFullName());

        List<OrderItemDTO> itemDTOs = order.getOrderItems().stream().map(item -> {
            OrderItemDTO iDto = new OrderItemDTO();
            iDto.setProductId(item.getProduct().getId());
            iDto.setProductName(item.getProduct().getName());
            iDto.setQuantity(item.getQuantity());
            iDto.setUnitPrice(item.getUnitPrice());
            iDto.setSubtotal(item.getSubtotal());
            return iDto;
        }).collect(Collectors.toList());

        dto.setItems(itemDTOs);
        return dto;
    }
}