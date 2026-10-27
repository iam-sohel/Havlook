package com.gesmio.havlook.delivery_module.service;

import com.gesmio.havlook.delivery_module.entity.DeliveryChargeRuleEntity;
import com.gesmio.havlook.delivery_module.exceptions.DeliveryException;
import com.gesmio.havlook.delivery_module.exceptions.DeliveryRuleConfigurationException;
import com.gesmio.havlook.delivery_module.exceptions.DeliveryRuleNotFoundException;
import com.gesmio.havlook.delivery_module.repository.DeliveryChargeRuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeliveryServiceImplTest {

    @Mock
    private DeliveryChargeRuleRepository repository;

    private DeliveryServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new DeliveryServiceImpl(repository);
    }

    private DeliveryChargeRuleEntity rule(String code, BigDecimal min, BigDecimal max, BigDecimal fee) {
        DeliveryChargeRuleEntity entity = new DeliveryChargeRuleEntity();
        entity.setRuleCode(code);
        entity.setRuleName(code);
        entity.setMinimumOrderAmount(min);
        entity.setMaximumOrderAmount(max);
        entity.setDeliveryFee(fee);
        entity.setActive(true);
        return entity;
    }

    @Test
    void calculateDeliveryFee_nullAmount_throws() {
        assertThrows(DeliveryException.class, () -> service.calculateDeliveryFee(null));
    }

    @Test
    void calculateDeliveryFee_negativeAmount_throws() {
        assertThrows(DeliveryException.class, () -> service.calculateDeliveryFee(new BigDecimal("-1")));
    }

    @Test
    void calculateDeliveryFee_zeroAmountWithMatchingRule_returnsFee() {
        when(repository.findByActiveTrue()).thenReturn(List.of(
                rule("R1", BigDecimal.ZERO, new BigDecimal("100"), new BigDecimal("50"))
        ));
        assertEquals(new BigDecimal("50"), service.calculateDeliveryFee(BigDecimal.ZERO));
    }

    @Test
    void calculateDeliveryFee_noActiveRules_throwsNotFound() {
        when(repository.findByActiveTrue()).thenReturn(List.of());
        assertThrows(DeliveryRuleNotFoundException.class, () -> service.calculateDeliveryFee(new BigDecimal("10")));
    }

    @Test
    void calculateDeliveryFee_negativeFee_throwsConfiguration() {
        when(repository.findByActiveTrue()).thenReturn(List.of(
                rule("R1", BigDecimal.ZERO, null, new BigDecimal("-1"))
        ));
        assertThrows(DeliveryRuleConfigurationException.class, () -> service.calculateDeliveryFee(new BigDecimal("10")));
    }

    @Test
    void calculateDeliveryFee_maxLessThanOrEqualToMin_throwsConfiguration() {
        when(repository.findByActiveTrue()).thenReturn(List.of(
                rule("R1", new BigDecimal("10"), new BigDecimal("10"), new BigDecimal("5"))
        ));
        assertThrows(DeliveryRuleConfigurationException.class, () -> service.calculateDeliveryFee(new BigDecimal("10")));
    }

    @Test
    void calculateDeliveryFee_multipleMatchingRules_throwsConfiguration() {
        when(repository.findByActiveTrue()).thenReturn(List.of(
                rule("R1", BigDecimal.ZERO, new BigDecimal("100"), new BigDecimal("5")),
                rule("R2", new BigDecimal("50"), new BigDecimal("150"), new BigDecimal("7"))
        ));
        assertThrows(DeliveryRuleConfigurationException.class, () -> service.calculateDeliveryFee(new BigDecimal("75")));
    }

    @Test
    void calculateDeliveryFee_upperBoundaryUsesNextRule() {
        when(repository.findByActiveTrue()).thenReturn(List.of(
                rule("R1", BigDecimal.ZERO, new BigDecimal("100"), new BigDecimal("5")),
                rule("R2", new BigDecimal("100"), null, new BigDecimal("7"))
        ));
        assertEquals(new BigDecimal("7"), service.calculateDeliveryFee(new BigDecimal("100")));
    }
}