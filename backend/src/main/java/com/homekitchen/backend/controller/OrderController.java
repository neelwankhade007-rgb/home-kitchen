package com.homekitchen.backend.controller;

import com.homekitchen.backend.model.Order;
import com.homekitchen.backend.service.OrderService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5173/"}, allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
@RestController
@RequestMapping("/orders")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public Order placeOrder(@RequestBody Order order) {
        return orderService.placeOrder(order);
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/{id}")
    public Order getOrderById(@PathVariable Long id) {
        return orderService.getOrderById(id);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Order> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(orderService.updateStatus(id, body.get("status")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.ok(Map.of("message", "Order deleted successfully"));
    }

    @DeleteMapping("/completed")
    public ResponseEntity<Map<String, String>> deleteCompletedOrders() {
        orderService.deleteCompletedOrders();
        return ResponseEntity.ok(Map.of("message", "Completed orders deleted successfully"));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> clearAllOrders() {
        orderService.clearAllOrders();
        return ResponseEntity.ok(Map.of("message", "All orders cleared successfully"));
    }
}
