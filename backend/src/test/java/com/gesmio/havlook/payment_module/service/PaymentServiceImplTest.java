package com.gesmio.havlook.payment_module.service;

import com.gesmio.havlook.payment_module.dto.VerifyPaymentRequestDTO;
import com.gesmio.havlook.payment_module.exceptions.PaymentNotFoundException;
import com.gesmio.havlook.payment_module.exceptions.PaymentValidationException;
import com.gesmio.havlook.user_module.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock private com.gesmio.havlook.seller_module.payment_module.service.SellerEarningService sellerEarningService;
    @Mock private com.gesmio.havlook.payment_module.repository.PaymentTransactionRepository paymentRepository;
    @Mock private com.gesmio.havlook.order_module.OrderRepository orderRepository;
    @Mock private UserRepository userRepository;

    private PaymentServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PaymentServiceImpl(sellerEarningService, paymentRepository, orderRepository, userRepository);
    }

    @Test
    void verifyPayment_nullRequest_throwsValidation() {
        assertThrows(PaymentValidationException.class, () -> service.verifyPayment("1", null));
    }

    @Test
    void verifyPayment_nullUserId_throwsValidation() {
        VerifyPaymentRequestDTO request = new VerifyPaymentRequestDTO();
        request.setOrderId(1L);
        request.setRazorpayOrderId("order_1");
        request.setRazorpayPaymentId("pay_1");
        request.setRazorpaySignature("sig");
        assertThrows(PaymentValidationException.class, () -> service.verifyPayment(null, request));
    }

    @Test
    void verifyPayment_invalidUserId_throwsValidation() {
        VerifyPaymentRequestDTO request = new VerifyPaymentRequestDTO();
        request.setOrderId(1L);
        request.setRazorpayOrderId("order_1");
        request.setRazorpayPaymentId("pay_1");
        request.setRazorpaySignature("sig");
        assertThrows(PaymentValidationException.class, () -> service.verifyPayment("abc", request));
    }

    @Test
    void verifyPayment_unknownUser_throwsNotFound() {
        VerifyPaymentRequestDTO request = new VerifyPaymentRequestDTO();
        request.setOrderId(1L);
        request.setRazorpayOrderId("order_1");
        request.setRazorpayPaymentId("pay_1");
        request.setRazorpaySignature("sig");
        when(userRepository.findById(1L)).thenReturn(java.util.Optional.empty());
        assertThrows(PaymentNotFoundException.class, () -> service.verifyPayment("1", request));
    }

    @Test
    void verifyPayment_unknownOrder_throwsNotFound() {
        VerifyPaymentRequestDTO request = new VerifyPaymentRequestDTO();
        request.setOrderId(1L);
        request.setRazorpayOrderId("order_1");
        request.setRazorpayPaymentId("pay_1");
        request.setRazorpaySignature("sig");

        com.gesmio.havlook.user_module.entity.User user = new com.gesmio.havlook.user_module.entity.User();
        user.setId(1L);
        when(userRepository.findById(1L)).thenReturn(java.util.Optional.of(user));
        when(orderRepository.findByIdForUpdate(1L)).thenReturn(java.util.Optional.empty());

        assertThrows(PaymentNotFoundException.class, () -> service.verifyPayment("1", request));
    }
    @Test
    void verifyPayment_alreadySuccessful_returnsExistingResponse() {
        com.gesmio.havlook.user_module.entity.User user = new com.gesmio.havlook.user_module.entity.User();
        user.setId(1L);

        com.gesmio.havlook.order_module.OrderEntity order = new com.gesmio.havlook.order_module.OrderEntity();
        order.setId(10L);
        order.setUser(user);
        order.setStatus(com.gesmio.havlook.order_module.OrderStatus.PENDING);

        com.gesmio.havlook.payment_module.entity.PaymentTransaction transaction =
                new com.gesmio.havlook.payment_module.entity.PaymentTransaction();
        transaction.setId(5L);
        transaction.setUser(user);
        transaction.setOrder(order);
        transaction.setRazorpayOrderId("order_1");
        transaction.setStatus(com.gesmio.havlook.payment_module.entity.PaymentStatusEnum.SUCCESS);

        when(userRepository.findById(1L)).thenReturn(java.util.Optional.of(user));
        when(orderRepository.findByIdForUpdate(10L)).thenReturn(java.util.Optional.of(order));
        when(paymentRepository.findByRazorpayOrderIdForUpdate("order_1")).thenReturn(java.util.Optional.of(transaction));

        com.gesmio.havlook.payment_module.dto.VerifyPaymentRequestDTO request = new com.gesmio.havlook.payment_module.dto.VerifyPaymentRequestDTO();
        request.setOrderId(10L);
        request.setRazorpayOrderId("order_1");
        request.setRazorpayPaymentId("pay_1");
        request.setRazorpaySignature("sig");

        com.gesmio.havlook.payment_module.dto.PaymentResponseDTO response = service.verifyPayment("1", request);
        org.junit.jupiter.api.Assertions.assertEquals(com.gesmio.havlook.payment_module.entity.PaymentStatusEnum.SUCCESS, response.getStatus());
    }

    @Test
    void verifyPayment_refunded_throwsVerificationException() {
        com.gesmio.havlook.user_module.entity.User user = new com.gesmio.havlook.user_module.entity.User();
        user.setId(1L);

        com.gesmio.havlook.order_module.OrderEntity order = new com.gesmio.havlook.order_module.OrderEntity();
        order.setId(10L);
        order.setUser(user);
        order.setStatus(com.gesmio.havlook.order_module.OrderStatus.PENDING);

        com.gesmio.havlook.payment_module.entity.PaymentTransaction transaction =
                new com.gesmio.havlook.payment_module.entity.PaymentTransaction();
        transaction.setId(5L);
        transaction.setUser(user);
        transaction.setOrder(order);
        transaction.setRazorpayOrderId("order_1");
        transaction.setStatus(com.gesmio.havlook.payment_module.entity.PaymentStatusEnum.REFUNDED);

        when(userRepository.findById(1L)).thenReturn(java.util.Optional.of(user));
        when(orderRepository.findByIdForUpdate(10L)).thenReturn(java.util.Optional.of(order));
        when(paymentRepository.findByRazorpayOrderIdForUpdate("order_1")).thenReturn(java.util.Optional.of(transaction));

        com.gesmio.havlook.payment_module.dto.VerifyPaymentRequestDTO request = new com.gesmio.havlook.payment_module.dto.VerifyPaymentRequestDTO();
        request.setOrderId(10L);
        request.setRazorpayOrderId("order_1");
        request.setRazorpayPaymentId("pay_1");
        request.setRazorpaySignature("sig");

        assertThrows(com.gesmio.havlook.payment_module.exceptions.PaymentVerificationException.class,
                () -> service.verifyPayment("1", request));
    }

    @Test
    void verifyPayment_transactionBelongsToDifferentOrder_throwsVerificationException() {
        com.gesmio.havlook.user_module.entity.User user = new com.gesmio.havlook.user_module.entity.User();
        user.setId(1L);

        com.gesmio.havlook.order_module.OrderEntity order = new com.gesmio.havlook.order_module.OrderEntity();
        order.setId(10L);
        order.setUser(user);
        order.setStatus(com.gesmio.havlook.order_module.OrderStatus.PENDING);

        com.gesmio.havlook.order_module.OrderEntity otherOrder = new com.gesmio.havlook.order_module.OrderEntity();
        otherOrder.setId(99L);

        com.gesmio.havlook.payment_module.entity.PaymentTransaction transaction =
                new com.gesmio.havlook.payment_module.entity.PaymentTransaction();
        transaction.setId(5L);
        transaction.setUser(user);
        transaction.setOrder(otherOrder);
        transaction.setRazorpayOrderId("order_1");
        transaction.setStatus(com.gesmio.havlook.payment_module.entity.PaymentStatusEnum.CREATED);

        when(userRepository.findById(1L)).thenReturn(java.util.Optional.of(user));
        when(orderRepository.findByIdForUpdate(10L)).thenReturn(java.util.Optional.of(order));
        when(paymentRepository.findByRazorpayOrderIdForUpdate("order_1")).thenReturn(java.util.Optional.of(transaction));

        com.gesmio.havlook.payment_module.dto.VerifyPaymentRequestDTO request = new com.gesmio.havlook.payment_module.dto.VerifyPaymentRequestDTO();
        request.setOrderId(10L);
        request.setRazorpayOrderId("order_1");
        request.setRazorpayPaymentId("pay_1");
        request.setRazorpaySignature("sig");

        assertThrows(com.gesmio.havlook.payment_module.exceptions.PaymentVerificationException.class,
                () -> service.verifyPayment("1", request));
    }

    @Test
    void verifyPayment_orderNotPending_throwsVerificationException() {
        com.gesmio.havlook.user_module.entity.User user = new com.gesmio.havlook.user_module.entity.User();
        user.setId(1L);

        com.gesmio.havlook.order_module.OrderEntity order = new com.gesmio.havlook.order_module.OrderEntity();
        order.setId(10L);
        order.setUser(user);
        order.setStatus(com.gesmio.havlook.order_module.OrderStatus.CONFIRMED);

        com.gesmio.havlook.payment_module.entity.PaymentTransaction transaction =
                new com.gesmio.havlook.payment_module.entity.PaymentTransaction();
        transaction.setId(5L);
        transaction.setUser(user);
        transaction.setOrder(order);
        transaction.setRazorpayOrderId("order_1");
        transaction.setStatus(com.gesmio.havlook.payment_module.entity.PaymentStatusEnum.CREATED);

        when(userRepository.findById(1L)).thenReturn(java.util.Optional.of(user));
        when(orderRepository.findByIdForUpdate(10L)).thenReturn(java.util.Optional.of(order));
        when(paymentRepository.findByRazorpayOrderIdForUpdate("order_1")).thenReturn(java.util.Optional.of(transaction));

        com.gesmio.havlook.payment_module.dto.VerifyPaymentRequestDTO request = new com.gesmio.havlook.payment_module.dto.VerifyPaymentRequestDTO();
        request.setOrderId(10L);
        request.setRazorpayOrderId("order_1");
        request.setRazorpayPaymentId("pay_1");
        request.setRazorpaySignature("sig");

        assertThrows(com.gesmio.havlook.payment_module.exceptions.PaymentVerificationException.class,
                () -> service.verifyPayment("1", request));
    }

}
