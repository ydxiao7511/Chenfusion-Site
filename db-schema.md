# ChenFusion Database Schema

This document outlines the conceptual data structures required to support the Admin OS portal, specifically focusing on the new Financial Controls and System Settings modules.

## Tables

### 1. `transactions`
Stores all financial transactions related to bookings, product sales, and package purchases.
- `id` (UUID): Primary Key
- `client_id` (UUID): Foreign Key -> `clients.id`
- `therapist_id` (UUID, nullable): Foreign Key -> `therapists.id` (null if product sale)
- `service_id` (UUID, nullable): Foreign Key -> `services.id`
- `amount` (Decimal): The base amount charged for the service/item.
- `tip_amount` (Decimal): The tip amount added to the transaction.
- `transaction_date` (Timestamp): When the transaction occurred.
- `status` (Enum: `COMPLETED`, `PENDING`, `REFUNDED`): Status of the payment.
- `payment_method` (String): e.g., 'Credit Card', 'Cash', 'Package Credit'.

### 2. `packages`
Tracks prepaid massage bundles purchased by clients.
- `id` (UUID): Primary Key
- `client_id` (UUID): Foreign Key -> `clients.id`
- `package_type` (String): e.g., '5-Pack 60min', '10-Pack 90min'.
- `credits_total` (Int): Total number of credits included in the package.
- `credits_remaining` (Int): Current number of remaining credits.
- `purchase_date` (Timestamp): When the package was purchased.
- `expiration_date` (Timestamp, nullable): When the package expires.

### 3. `settings`
Key-value store for global system configurations and business rules.
- `key` (String): Primary Key, e.g., `buffer_time_mins`, `lead_time_hours`, `sms_template_reminder`, `therapist_revenue_visibility`.
- `value` (Text/JSON): The configured value. Can be a simple string/number or a JSON object for complex settings.
- `description` (String): A human-readable description of what the setting does.
- `updated_at` (Timestamp): When the setting was last modified.
