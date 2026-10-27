package com.gesmio.havlook.seller_module.inventory_module.service;

import com.gesmio.havlook.seller_module.inventory_module.entity.Inventory;
import com.gesmio.havlook.seller_module.inventory_module.entity.InventoryItem;
import com.gesmio.havlook.seller_module.inventory_module.exceptions.InventoryNotFoundException;
import com.gesmio.havlook.seller_module.inventory_module.exceptions.InventoryProductVariantNotFoundException;
import com.gesmio.havlook.seller_module.inventory_module.exceptions.InventoryStockException;
import com.gesmio.havlook.seller_module.inventory_module.exceptions.InventoryValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceImplTest {

    @Mock private com.gesmio.havlook.seller_module.inventory_module.repository.InventoryRepository inventoryRepository;
    @Mock private com.gesmio.havlook.seller_module.inventory_module.repository.InventoryItemRepository inventoryItemRepository;
    @Mock private com.gesmio.havlook.seller_module.seller.repository.SellerRepository sellerRepository;
    @Mock private com.gesmio.havlook.seller_module.warehouse_module.repository.WarehouseRepository warehouseRepository;
    @Mock private com.gesmio.havlook.product_module.productVariant.repository.ProductVariantRepository productVariantRepository;

    private InventoryServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new InventoryServiceImpl(inventoryRepository, inventoryItemRepository, sellerRepository,
                warehouseRepository, productVariantRepository);
    }

    @Test
    void addStock_nullQuantity_throwsValidation() {
        assertThrows(InventoryValidationException.class, () -> service.addStock(1L, 1L, null));
    }

    @Test
    void addStock_zeroQuantity_throwsValidation() {
        assertThrows(InventoryValidationException.class, () -> service.addStock(1L, 1L, 0));
    }

    @Test
    void addStock_missingInventory_throwsNotFound() {
        when(inventoryRepository.findByWarehouseIdForUpdate(1L)).thenReturn(java.util.Optional.empty());
        assertThrows(InventoryNotFoundException.class, () -> service.addStock(1L, 1L, 5));
    }

    @Test
    void addStock_missingItem_throwsProductVariantNotFound() {
        Inventory inventory = new Inventory();
        inventory.setId(10L);
        when(inventoryRepository.findByWarehouseIdForUpdate(1L)).thenReturn(java.util.Optional.of(inventory));
        when(inventoryItemRepository.findByInventoryIdAndProductVariantIdForUpdate(10L, 1L))
                .thenReturn(java.util.Optional.empty());
        assertThrows(InventoryProductVariantNotFoundException.class, () -> service.addStock(1L, 1L, 5));
    }

    @Test
    void addStock_validQuantity_updatesAndSaves() {
        Inventory inventory = new Inventory();
        inventory.setId(10L);
        InventoryItem item = new InventoryItem();
        item.setAvailableStock(5);
        when(inventoryRepository.findByWarehouseIdForUpdate(1L)).thenReturn(java.util.Optional.of(inventory));
        when(inventoryItemRepository.findByInventoryIdAndProductVariantIdForUpdate(10L, 1L))
                .thenReturn(java.util.Optional.of(item));
        service.addStock(1L, 1L, 3);
        org.junit.jupiter.api.Assertions.assertEquals(8, item.getAvailableStock());
        verify(inventoryItemRepository).save(item);
    }

    @Test
    void reserveStock_insufficientStock_throwsStockException() {
        Inventory inventory = new Inventory();
        inventory.setId(10L);
        InventoryItem item = new InventoryItem();
        item.setAvailableStock(2);
        when(inventoryRepository.findByWarehouseIdForUpdate(1L)).thenReturn(java.util.Optional.of(inventory));
        when(inventoryItemRepository.findByInventoryIdAndProductVariantIdForUpdate(10L, 1L))
                .thenReturn(java.util.Optional.of(item));
        assertThrows(InventoryStockException.class, () -> service.reserveStock(1L, 1L, 5));
    }

    @Test
    void reserveStock_validQuantity_updatesStocks() {
        Inventory inventory = new Inventory();
        inventory.setId(10L);
        InventoryItem item = new InventoryItem();
        item.setAvailableStock(5);
        item.setReservedStock(1);
        when(inventoryRepository.findByWarehouseIdForUpdate(1L)).thenReturn(java.util.Optional.of(inventory));
        when(inventoryItemRepository.findByInventoryIdAndProductVariantIdForUpdate(10L, 1L))
                .thenReturn(java.util.Optional.of(item));
        service.reserveStock(1L, 1L, 2);
        org.junit.jupiter.api.Assertions.assertEquals(3, item.getAvailableStock());
        org.junit.jupiter.api.Assertions.assertEquals(3, item.getReservedStock());
        verify(inventoryItemRepository).save(item);
    }
}
