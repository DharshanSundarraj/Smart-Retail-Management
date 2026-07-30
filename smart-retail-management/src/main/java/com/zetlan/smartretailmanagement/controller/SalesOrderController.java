package com.zetlan.smartretailmanagement.controller;

import com.zetlan.smartretailmanagement.dto.SalesOrderDTO;
import com.zetlan.smartretailmanagement.service.SalesOrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales-orders")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    public SalesOrderController(SalesOrderService salesOrderService) {
        this.salesOrderService = salesOrderService;
    }

    @GetMapping
    public ResponseEntity<List<SalesOrderDTO>> getAllOrders() {
        return new ResponseEntity<>(salesOrderService.getAllOrders(), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<SalesOrderDTO> checkout(@RequestBody SalesOrderDTO orderDTO) {
        SalesOrderDTO completedOrder = salesOrderService.createOrder(orderDTO);
        return new ResponseEntity<>(completedOrder, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        salesOrderService.deleteOrder(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}