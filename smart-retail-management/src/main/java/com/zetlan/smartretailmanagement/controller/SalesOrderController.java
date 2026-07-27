package com.zetlan.smartretailmanagement.controller;

import com.zetlan.smartretailmanagement.dto.SalesOrderDTO;
import com.zetlan.smartretailmanagement.service.SalesOrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sales-orders")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    public SalesOrderController(SalesOrderService salesOrderService) {
        this.salesOrderService = salesOrderService;
    }

    @PostMapping
    public ResponseEntity<SalesOrderDTO> checkout(@RequestBody SalesOrderDTO orderDTO) {
        SalesOrderDTO completedOrder = salesOrderService.createOrder(orderDTO);
        return new ResponseEntity<>(completedOrder, HttpStatus.CREATED);
    }
}