package com.gesmio.havlook.cart_module;

import com.gesmio.havlook.cart_module.dto.CartItemAddRequestDTO;
import com.gesmio.havlook.cart_module.exceptions.CartProductVariantNotFoundException;
import com.gesmio.havlook.cart_module.exceptions.CartUserNotFoundException;
import com.gesmio.havlook.cart_module.exceptions.InvalidCartQuantityException;
import com.gesmio.havlook.product_module.productVariant.entity.ProductVariantStatus;
import com.gesmio.havlook.product_module.productVariant.repository.ProductVariantRepository;
import com.gesmio.havlook.user_module.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CartServiceImplTest {

    @Mock private CartRepository cartRepository;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProductVariantRepository productVariantRepository;
    @Mock private com.gesmio.havlook.product_module.productPrice.repository.ProductVariantPriceRepository priceRepository;
    @Mock private com.gesmio.havlook.discount_module.ProductVariantDiscountRepository discountRepository;
    @Mock private CartMapper cartMapper;

    private CartServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new CartServiceImpl(cartRepository, cartItemRepository, userRepository,
                productVariantRepository, priceRepository, discountRepository, cartMapper);
    }

    @Test
    void addItem_nullRequest_throwsInvalidQuantity() {
        assertThrows(InvalidCartQuantityException.class, () -> service.addItem("1", null));
    }

    @Test
    void addItem_missingUser_throwsCartUserNotFound() {
        CartItemAddRequestDTO request = new CartItemAddRequestDTO();
        request.setProductVariantId(1L);
        request.setQuantity(1);
        when(userRepository.findById(1L)).thenReturn(java.util.Optional.empty());
        assertThrows(CartUserNotFoundException.class, () -> service.addItem("1", request));
    }

    @Test
    void addItem_invalidProductVariant_throwsNotFound() {
        CartItemAddRequestDTO request = new CartItemAddRequestDTO();
        request.setProductVariantId(0L);
        request.setQuantity(1);
        com.gesmio.havlook.user_module.entity.User user = new com.gesmio.havlook.user_module.entity.User();
        user.setId(1L);
        when(userRepository.findById(1L)).thenReturn(java.util.Optional.of(user));
        assertThrows(CartProductVariantNotFoundException.class, () -> service.addItem("1", request));
    }
}
