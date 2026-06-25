
-- Seeding Data via SQL (Robust)

-- 1. Clean existing data
-- Truncate dependent tables first to allow user deletion
TRUNCATE TABLE payments, bookings, vehicles, services CASCADE;
-- Delete users except admin
DELETE FROM users WHERE role IN ('client', 'driver', 'carwash');

-- 2. Insert Clients
INSERT INTO users (name, email, password, phone, nrc, role, is_active, approval_status, approved_at, location_coordinates) VALUES
('John Mwansa', 'john.mwansa@email.com', '$2a$10$GsXieZRdmZrStpqTLVAIwuaowtEo5c4jOUxx4lO5U0GMLOYpcRS/2', '0977123456', 'CLI001', 'client', true, 'approved', NOW(), '{"lat": -15.3875, "lng": 28.3228}'),
('Sarah Banda', 'sarah.banda@email.com', '$2a$10$GsXieZRdmZrStpqTLVAIwuaowtEo5c4jOUxx4lO5U0GMLOYpcRS/2', '0977123457', 'CLI002', 'client', true, 'approved', NOW(), '{"lat": -15.3900, "lng": 28.3200}'),
('Peter Phiri', 'peter.phiri@email.com', '$2a$10$GsXieZRdmZrStpqTLVAIwuaowtEo5c4jOUxx4lO5U0GMLOYpcRS/2', '0977123458', 'CLI003', 'client', true, 'approved', NOW(), '{"lat": -15.3850, "lng": 28.3250}'),
('Mary Tembo', 'mary.tembo@email.com', '$2a$10$GsXieZRdmZrStpqTLVAIwuaowtEo5c4jOUxx4lO5U0GMLOYpcRS/2', '0977123459', 'CLI004', 'client', true, 'approved', NOW(), '{"lat": -15.3950, "lng": 28.3150}'),
('David Ngoma', 'david.ngoma@email.com', '$2a$10$GsXieZRdmZrStpqTLVAIwuaowtEo5c4jOUxx4lO5U0GMLOYpcRS/2', '0977123460', 'CLI005', 'client', true, 'approved', NOW(), '{"lat": -15.3800, "lng": 28.3300}');

-- 3. Insert Vehicles (Randomized)
INSERT INTO vehicles (client_id, make, model, plate_no, color)
SELECT id, 'Toyota', 'Corolla', 'ABC ' || floor(random()*9000+1000)::text, 'White' FROM users WHERE role = 'client';

INSERT INTO vehicles (client_id, make, model, plate_no, color)
SELECT id, 'Honda', 'Civic', 'XYZ ' || floor(random()*9000+1000)::text, 'Black' FROM users WHERE role = 'client';

INSERT INTO vehicles (client_id, make, model, plate_no, color)
SELECT id, 'Nissan', 'Sunny', 'LUS ' || floor(random()*9000+1000)::text, 'Silver' FROM users WHERE role = 'client' AND random() > 0.5;

-- 4. Insert Car Washes
INSERT INTO users (name, email, password, phone, nrc, role, is_active, approval_status, approved_at, car_wash_name, location, washing_bays, location_coordinates) VALUES
('Sparkle Auto Wash', 'sparkle@carwash.com', '$2a$10$P3/fWFZZErf.B/ffki2fa.oZyVGjtU3/zZFA3eqI3vzNJSlJYo5za', '0211234567', 'CW001', 'carwash', true, 'approved', NOW(), 'Sparkle Auto Wash', 'Cairo Road, Lusaka', 3, '{"lat": -15.3870, "lng": 28.3220}'),
('Crystal Clean', 'crystal@carwash.com', '$2a$10$P3/fWFZZErf.B/ffki2fa.oZyVGjtU3/zZFA3eqI3vzNJSlJYo5za', '0211234568', 'CW002', 'carwash', true, 'approved', NOW(), 'Crystal Clean', 'Great East Road', 4, '{"lat": -15.3900, "lng": 28.3300}'),
('Shine Bright', 'shine@carwash.com', '$2a$10$P3/fWFZZErf.B/ffki2fa.oZyVGjtU3/zZFA3eqI3vzNJSlJYo5za', '0211234569', 'CW003', 'carwash', true, 'approved', NOW(), 'Shine Bright', 'Makeni', 2, '{"lat": -15.3850, "lng": 28.3150}'),
('Premium Wash', 'premium@carwash.com', '$2a$10$P3/fWFZZErf.B/ffki2fa.oZyVGjtU3/zZFA3eqI3vzNJSlJYo5za', '0211234570', 'CW004', 'carwash', true, 'approved', NOW(), 'Premium Wash', 'Woodlands', 5, '{"lat": -15.4000, "lng": 28.3400}'),
('Quick Wash', 'quick@carwash.com', '$2a$10$P3/fWFZZErf.B/ffki2fa.oZyVGjtU3/zZFA3eqI3vzNJSlJYo5za', '0211234571', 'CW005', 'carwash', true, 'approved', NOW(), 'Quick Wash', 'Kabulonga', 2, '{"lat": -15.3750, "lng": 28.3100}');

-- 5. Insert Services for Car Washes
INSERT INTO services (car_wash_id, name, description, price, is_active)
SELECT id, 'Full Basic Wash', 'Complete exterior and interior wash', 50.00, true FROM users WHERE role = 'carwash';

INSERT INTO services (car_wash_id, name, description, price, is_active)
SELECT id, 'Engine Wash', 'Steam clean engine', 80.00, true FROM users WHERE role = 'carwash';

INSERT INTO services (car_wash_id, name, description, price, is_active)
SELECT id, 'Wax & Polish', 'Premium wax finish', 100.00, true FROM users WHERE role = 'carwash';

-- 6. Insert Drivers
INSERT INTO users (name, email, password, phone, nrc, role, is_active, approval_status, approved_at, availability, license_no, license_type, license_expiry, address, driver_rating, completed_jobs, location_coordinates) VALUES
('James Mulenga', 'james.mulenga@driver.com', '$2a$10$OElgvroVq3bHN9zX2kWC4u2/eyhxqY7UkI965TPf6/CdVDVuAHmqy', '0978123456', 'DRV001', 'driver', true, 'approved', NOW(), true, 'DL001', 'Class B', NOW() + INTERVAL '1 year', 'Lusaka', 4.8, 150, '{"lat": -15.3880, "lng": 28.3230}'),
('Michael Chanda', 'michael.chanda@driver.com', '$2a$10$OElgvroVq3bHN9zX2kWC4u2/eyhxqY7UkI965TPf6/CdVDVuAHmqy', '0978123457', 'DRV002', 'driver', true, 'approved', NOW(), true, 'DL002', 'Class B', NOW() + INTERVAL '1 year', 'Lusaka', 4.5, 120, '{"lat": -15.3860, "lng": 28.3210}'),
('Robert Mwanza', 'robert.mwanza@driver.com', '$2a$10$OElgvroVq3bHN9zX2kWC4u2/eyhxqY7UkI965TPf6/CdVDVuAHmqy', '0978123458', 'DRV003', 'driver', true, 'approved', NOW(), true, 'DL003', 'Class C', NOW() + INTERVAL '1 year', 'Lusaka', 4.9, 200, '{"lat": -15.3910, "lng": 28.3240}'),
('Thomas Banda', 'thomas.banda@driver.com', '$2a$10$OElgvroVq3bHN9zX2kWC4u2/eyhxqY7UkI965TPf6/CdVDVuAHmqy', '0978123459', 'DRV004', 'driver', true, 'approved', NOW(), true, 'DL004', 'Class B', NOW() + INTERVAL '1 year', 'Lusaka', 4.2, 80, '{"lat": -15.3840, "lng": 28.3190}'),
('Andrew Phiri', 'andrew.phiri@driver.com', '$2a$10$OElgvroVq3bHN9zX2kWC4u2/eyhxqY7UkI965TPf6/CdVDVuAHmqy', '0978123460', 'DRV005', 'driver', true, 'approved', NOW(), true, 'DL005', 'Class B', NOW() + INTERVAL '1 year', 'Lusaka', 4.7, 180, '{"lat": -15.3920, "lng": 28.3260}');

COMMIT;
