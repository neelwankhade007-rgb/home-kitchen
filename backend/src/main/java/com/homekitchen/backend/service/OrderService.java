package com.homekitchen.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.homekitchen.backend.exception.FoodException;
import com.homekitchen.backend.model.FoodItem;
import com.homekitchen.backend.model.Order;
import com.homekitchen.backend.model.OrderItem;
import com.homekitchen.backend.repository.FoodItemRepository;
import com.homekitchen.backend.repository.OrderRepository;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final FoodItemRepository foodItemRepository;
    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public OrderService(OrderRepository orderRepository, FoodItemRepository foodItemRepository) {
        this.orderRepository = orderRepository;
        this.foodItemRepository = foodItemRepository;
    }

    public Order placeOrder(Order order) {
        order.setStatus("PENDING");
        order.setCreatedAt(LocalDateTime.now());

        double total = 0;

        for (OrderItem item : order.getItems()) {
            item.setOrder(order);

            FoodItem food = foodItemRepository.findByName(item.getFoodName())
                    .orElseThrow(() -> new FoodException("Item '" + item.getFoodName() + "' not found"));

            if (!food.isAvailable()) {
                throw new FoodException("Item '" + food.getName() + "' is unavailable, please select other item");
            }

            // Use authoritative price from DB to avoid tampering from client
            item.setPrice(food.getPrice());
            total += item.getPrice() * item.getQuantity();
        }

        order.setTotalPrice(total);
        Order saved = orderRepository.save(order);
        notifyOrderPlaced(saved);
        return saved;
    }

    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        return emitter;
    }

    private void notifyOrderPlaced(Order order) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("orderPlaced").data(order));
            } catch (Exception ex) {
                emitters.remove(emitter);
            }
        }
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
                .filter(o -> "DONE".equalsIgnoreCase(o.getStatus()))
                .collect(java.util.stream.Collectors.toList());
        orderRepository.deleteAll(completed);
    }

    public void clearAllOrders() {
        orderRepository.deleteAll();
    }
}
