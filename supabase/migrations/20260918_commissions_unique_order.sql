-- One commission per order.
--
-- /api/order-complete is fed by WooCommerce's `order.updated` topic, which
-- fires on every status change — pending→processing writes a row, and the
-- later processing→completed (set by hand when the goods reach the gym)
-- wrote a second one for the same sale. Verified 2026-09-17 on order #141:
-- two 9.60 rows. Left alone, gyms get paid once per status touch.
--
-- The index is what actually guarantees this: two deliveries can arrive
-- concurrently and both pass a read-then-insert check in application code.

create unique index if not exists commissions_order_id_idx
  on sweat_eshop.commissions (order_id);
