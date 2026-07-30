package com.zetlan.smartretailmanagement.service;

import com.zetlan.smartretailmanagement.dto.OrderItemDTO;
import com.zetlan.smartretailmanagement.dto.SalesOrderDTO;
import com.zetlan.smartretailmanagement.exception.ResourceNotFoundException;
import com.zetlan.smartretailmanagement.model.Customer;
import com.zetlan.smartretailmanagement.model.Employee;
import com.zetlan.smartretailmanagement.model.OrderItem;
import com.zetlan.smartretailmanagement.model.Product;
import com.zetlan.smartretailmanagement.model.SalesOrder;
import com.zetlan.smartretailmanagement.repository.CustomerRepository;
import com.zetlan.smartretailmanagement.repository.EmployeeRepository;
import com.zetlan.smartretailmanagement.repository.ProductRepository;
import com.zetlan.smartretailmanagement.repository.SalesOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final ProductRepository productRepository;
    private final EmployeeRepository employeeRepository;
    private final CustomerRepository customerRepository;

    public SalesOrderService(SalesOrderRepository salesOrderRepository,
                             ProductRepository productRepository,
                             EmployeeRepository employeeRepository,
                             CustomerRepository customerRepository) {
        this.salesOrderRepository = salesOrderRepository;
        this.productRepository = productRepository;
        this.employeeRepository = employeeRepository;
        this.customerRepository = customerRepository;
    }

    // 1. READ ALL ORDERS (Wrapped in readOnly transaction to prevent LazyInitializationException)
    @Transactional(readOnly = true)
    public List<SalesOrderDTO> getAllOrders() {
        return salesOrderRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // 2. CREATE NEW POS ORDER
    public SalesOrderDTO createOrder(SalesOrderDTO dto) {
        Employee employee = null;
        if (dto.getEmployeeId() != null) {
            employee = employeeRepository.findById(dto.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + dto.getEmployeeId()));
        }

        SalesOrder order = new SalesOrder();
        order.setOrderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setStatus("COMPLETED");
        order.setEmployee(employee);

        BigDecimal runningTotal = BigDecimal.ZERO;
        List<OrderItem> entityItems = new ArrayList<>();

        if (dto.getItems() != null) {
            for (OrderItemDTO itemDto : dto.getItems()) {
                Product product = productRepository.findById(itemDto.getProductId())
                        .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemDto.getProductId()));

                if (product.getStockQuantity() < itemDto.getQuantity()) {
                    throw new RuntimeException("Insufficient stock for product: " + product.getName());
                }

                OrderItem item = new OrderItem();
                item.setSalesOrder(order);
                item.setProduct(product);
                item.setProductName(product.getName());
                item.setQuantity(itemDto.getQuantity());
                item.setUnitPrice(product.getPrice());

                BigDecimal subtotal = product.getPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity()));
                item.setSubtotal(subtotal);

                // Deduct inventory stock
                product.setStockQuantity(product.getStockQuantity() - itemDto.getQuantity());
                productRepository.save(product);

                entityItems.add(item);
                runningTotal = runningTotal.add(subtotal);
            }
        }

        order.setOrderItems(entityItems);
        order.setTotalAmount(runningTotal);

        // Assign Customer and calculate Loyalty Points (1 Point per ₹100 spent)
        if (dto.getCustomerId() != null && dto.getCustomerId() > 0) {
            Customer customer = customerRepository.findById(dto.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + dto.getCustomerId()));
            order.setCustomer(customer);

            int earnedPoints = runningTotal.divide(BigDecimal.valueOf(100), 0, java.math.RoundingMode.FLOOR).intValue();
            customer.setLoyaltyPoints(customer.getLoyaltyPoints() + earnedPoints);
            customerRepository.save(customer);
        }

        SalesOrder savedOrder = salesOrderRepository.save(order);
        return mapToDTO(savedOrder);
    }

    // 3. DELETE ORDER
    public void deleteOrder(Long id) {
        if (!salesOrderRepository.existsById(id)) {
            throw new ResourceNotFoundException("Sales Order not found with ID: " + id);
        }
        salesOrderRepository.deleteById(id);
    }

    // HELPER: Map Entity to DTO safely
    private SalesOrderDTO mapToDTO(SalesOrder order) {
        SalesOrderDTO dto = new SalesOrderDTO();
        dto.setId(order.getId());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setTotalAmount(order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO);
        dto.setStatus(order.getStatus() != null ? order.getStatus() : "COMPLETED");
        dto.setOrderDate(order.getCreatedAt());

        if (order.getEmployee() != null) {
            dto.setEmployeeId(order.getEmployee().getId());
            dto.setEmployeeName(order.getEmployee().getFullName() != null ? order.getEmployee().getFullName() : "Staff");
        } else {
            dto.setEmployeeId(null);
            dto.setEmployeeName("System Terminal");
        }

        if (order.getCustomer() != null) {
            dto.setCustomerId(order.getCustomer().getId());
            dto.setCustomerName(order.getCustomer().getFullName() != null ? order.getCustomer().getFullName() : "Registered Customer");
        } else {
            dto.setCustomerId(null);
            dto.setCustomerName("Guest Checkout (No Account)");
        }

        List<OrderItemDTO> itemDTOs = Collections.emptyList();
        if (order.getOrderItems() != null) {
            itemDTOs = order.getOrderItems().stream().map(item -> {
                OrderItemDTO iDto = new OrderItemDTO();
                iDto.setProductId(item.getProduct() != null ? item.getProduct().getId() : null);
                iDto.setProductName(item.getProductName() != null ? item.getProductName() : "Catalog Item");
                iDto.setQuantity(item.getQuantity());
                iDto.setUnitPrice(item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO);
                iDto.setSubtotal(item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO);
                return iDto;
            }).collect(Collectors.toList());
        }

        dto.setItems(itemDTOs);
        return dto;
    }
}