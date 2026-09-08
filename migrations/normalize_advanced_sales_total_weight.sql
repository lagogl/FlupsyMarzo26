-- advanced_sales.total_weight is expressed in grams.
-- sale_bags.total_weight is normally expressed in kg, except for a few legacy
-- rows that already contain grams. Infer the legacy unit from animal density.
WITH normalized_sales AS (
  SELECT
    b.advanced_sale_id,
    SUM(
      CASE
        WHEN b.animals_per_kg > 0
          AND b.animal_count > 0
          AND b.total_weight / (b.animal_count / b.animals_per_kg) > 100
          THEN b.total_weight
        ELSE b.total_weight * 1000
      END
    ) AS total_weight_grams
  FROM sale_bags b
  GROUP BY b.advanced_sale_id
)
UPDATE advanced_sales a
SET
  total_weight = n.total_weight_grams,
  updated_at = NOW()
FROM normalized_sales n
WHERE a.id = n.advanced_sale_id
  AND ABS(COALESCE(a.total_weight, 0) - n.total_weight_grams) > 0.01;