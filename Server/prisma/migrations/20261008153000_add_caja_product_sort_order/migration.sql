ALTER TABLE `CajaProduct`
    ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0;

UPDATE `CajaProduct` AS product
INNER JOIN (
    SELECT
        `id`,
        ROW_NUMBER() OVER (
            PARTITION BY `category`
            ORDER BY `name` ASC, `id` ASC
        ) - 1 AS `position`
    FROM `CajaProduct`
) AS ordered_products ON ordered_products.`id` = product.`id`
SET product.`sortOrder` = ordered_products.`position`;

CREATE INDEX `CajaProduct_category_sortOrder_idx`
    ON `CajaProduct`(`category`, `sortOrder`);
