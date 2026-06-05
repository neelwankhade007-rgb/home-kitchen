package com.homekitchen.backend.service;

import com.homekitchen.backend.exception.FoodException;
import com.homekitchen.backend.model.Order;
import com.homekitchen.backend.model.OrderItem;
import com.homekitchen.backend.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {
    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Order placeOrder(Order order) {
        order.setStatus("PENDING");

        double total = 0;

        for (OrderItem item : order.getItems()) {
            item.setOrder(order);
            total += item.getPrice() * item.getQuantity();
        }

        order.setTotalPrice(total);
        
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay   = LocalDate.now().atTime(23, 59, 59);
        int countToday = orderRepository.countByCreatedAtBetween(startOfDay, endOfDay);
        order.setDailyNumber(countToday + 1);
        
        return orderRepository.save(order);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order updateStatus(Long id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new FoodException("Order not found"));
                order.setStatus(status);
                return orderRepository.save(order);
    }

    public void deleteOrder(Long id) {
        if (!orderRepository.existsById(id)) {
            throw new FoodException("Order not found");
        }
        orderRepository.deleteById(id);
    }

    public void deleteCompletedOrders() {
        List<Order> completed = orderRepository.findAll().stream()
                .filter(o -> "READY".equalsIgnoreCase(o.getStatus()))
                .collect(java.util.stream.Collectors.toList());
        orderRepository.deleteAll(completed);
    }

    public void clearAllOrders() {
        orderRepository.deleteAll();
    }
}
