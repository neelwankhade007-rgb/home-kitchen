package com.homekitchen.backend.service;

import com.homekitchen.backend.model.Order;
import com.homekitchen.backend.model.OrderItem;
import com.homekitchen.backend.repository.OrderRepository;
import org.springframework.stereotype.Service;

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
        order.setCreatedAt(LocalDateTime.now());

        double total = 0;

        for (OrderItem item : order.getItems()) {
            item.setOrder(order);
            total += item.getPrice() * item.getQuantity();
        }

        order.setTotalPrice(total);
        return orderRepository.save(order);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
}
