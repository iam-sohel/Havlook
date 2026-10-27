package com.gesmio.havlook.order_module;

import com.gesmio.havlook.order_module.dto.OrderCreateRequestDTO;
import com.gesmio.havlook.order_module.exceptions.OrderValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock private com.gesmio.havlook.order_module.OrderRepository orderRepository;
    @Mock private com.gesmio.havlook.cart_module.CartRepository cartRepository;
    @Mock private com.gesmio.havlook.address_module.repository.AddressRepository addressRepository;
    @Mock private com.gesmio.havlook.customer_module.repository.CustomerRepository customerRepository;
    @Mock private com.gesmio.havlook.user_module.repository.UserRepository userRepository;
    @Mock private com.gesmio.havlook.seller_module.inventory_module.service.InventoryService inventoryService;
    @Mock private com.gesmio.havlook.product_module.productVariant.repository.ProductVariantRepository productVariantRepository;
    @Mock private com.gesmio.havlook.product_module.productPrice.repository.ProductVariantPriceRepository priceRepository;
    @Mock private com.gesmio.havlook.discount_module.ProductVariantDiscountRepository discountRepository;
    @Mock private com.gesmio.havlook.delivery_module.service.DeliveryService deliveryService;

    private OrderServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new OrderServiceImpl(orderRepository, cartRepository, addressRepository,
                customerRepository, userRepository, inventoryService, productVariantRepository,
                priceRepository, discountRepository, deliveryService);
    }

    @Test
    void createOrder_nullUserIdentifier_throwsValidation() {
        assertThrows(OrderValidationException.class, () -> service.createOrder(null, new OrderCreateRequestDTO()));
    }

    @Test
    void createOrder_blankUserIdentifier_throwsValidation() {
        assertThrows(OrderValidationException.class, () -> service.createOrder(" ", new OrderCreateRequestDTO()));
    }

    @Test
    void createOrder_nullRequest_throwsValidation() {
        assertThrows(OrderValidationException.class, () -> service.createOrder("1", null));
    }

    @Test
    void createOrder_missingAddressId_throwsValidation() {
        OrderCreateRequestDTO request = new OrderCreateRequestDTO();
        request.setPaymentMethod(com.gesmio.havlook.order_module.PaymentMethod.COD);
        assertThrows(OrderValidationException.class, () -> service.createOrder("1", request));
    }

    @Test
    void createOrder_missingPaymentMethod_throwsValidation() {
        OrderCreateRequestDTO request = new OrderCreateRequestDTO();
        request.setAddressId(1L);
        assertThrows(OrderValidationException.class, () -> service.createOrder("1", request));
    }
}
