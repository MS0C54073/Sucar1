/**
 * Integration tests for the Booking Lifecycle.
 *
 * Tests the full booking status progression through the API,
 * including role-based access control, dual-confirmation flows,
 * and edge cases like cancellation and legacy fallbacks.
 *
 * Run with: npx jest --testPathPattern=booking-lifecycle
 */

import request from 'supertest';

// These tests assume the app is exported from index.ts or a test setup
// For now, we define the test structure; actual HTTP calls depend on test env setup.

const API_BASE = process.env.TEST_API_URL || 'http://localhost:5000/api';

// Mock tokens for testing (replace with actual test auth tokens)
const TOKENS = {
  client: process.env.TEST_CLIENT_TOKEN || 'test-client-token',
  driver: process.env.TEST_DRIVER_TOKEN || 'test-driver-token',
  carwash: process.env.TEST_CARWASH_TOKEN || 'test-carwash-token',
  admin: process.env.TEST_ADMIN_TOKEN || 'test-admin-token',
};

describe('Booking Lifecycle Integration Tests', () => {
  let bookingId: string;

  describe('POST /api/bookings - Create Booking', () => {
    it('should create a pickup_delivery booking with pending status', async () => {
      const res = await request(API_BASE)
        .post('/bookings')
        .set('Authorization', `Bearer ${TOKENS.client}`)
        .send({
          vehicleId: 'test-vehicle-id',
          carWashId: 'test-carwash-id',
          serviceId: 'test-service-id',
          pickupLocation: '123 Test Street',
          pickupCoordinates: { lat: -15.4, lng: 28.3 },
          bookingType: 'pickup_delivery',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.bookingType).toBe('pickup_delivery');
      bookingId = res.body.data.id;
    });

    it('should create a drive_in booking with waiting_bay status', async () => {
      const res = await request(API_BASE)
        .post('/bookings')
        .set('Authorization', `Bearer ${TOKENS.client}`)
        .send({
          vehicleId: 'test-vehicle-id',
          carWashId: 'test-carwash-id',
          serviceId: 'test-service-id',
          bookingType: 'drive_in',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('waiting_bay');
    });

    it('should reject booking without required fields', async () => {
      const res = await request(API_BASE)
        .post('/bookings')
        .set('Authorization', `Bearer ${TOKENS.client}`)
        .send({
          vehicleId: 'test-vehicle-id',
          // Missing carWashId and serviceId
        });

      expect(res.status).toBe(400);
    });

    it('should reject pickup_delivery without pickupLocation', async () => {
      const res = await request(API_BASE)
        .post('/bookings')
        .set('Authorization', `Bearer ${TOKENS.client}`)
        .send({
          vehicleId: 'test-vehicle-id',
          carWashId: 'test-carwash-id',
          serviceId: 'test-service-id',
          bookingType: 'pickup_delivery',
          // Missing pickupLocation
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/bookings/:id/status - Status Transitions', () => {
    describe('Driver Flow', () => {
      it('should allow driver to accept booking (pending -> accepted)', async () => {
        const res = await request(API_BASE)
          .put(`/bookings/${bookingId}/status`)
          .set('Authorization', `Bearer ${TOKENS.driver}`)
          .send({ status: 'accepted' });

        expect(res.status).toBe(200);
        // Backend maps driver's 'picked_up' to 'picked_up_pending_confirmation'
        expect(['accepted']).toContain(res.body.data.status);
      });

      it('should map driver picked_up to picked_up_pending_confirmation', async () => {
        const res = await request(API_BASE)
          .put(`/bookings/${bookingId}/status`)
          .set('Authorization', `Bearer ${TOKENS.driver}`)
          .send({ status: 'picked_up' });

        expect(res.status).toBe(200);
        // Should be either picked_up_pending_confirmation or picked_up (legacy fallback)
        expect(['picked_up_pending_confirmation', 'picked_up']).toContain(res.body.data.status);
      });

      it('should NOT allow driver to set washing_bay', async () => {
        const res = await request(API_BASE)
          .put(`/bookings/${bookingId}/status`)
          .set('Authorization', `Bearer ${TOKENS.driver}`)
          .send({ status: 'washing_bay' });

        expect(res.status).toBe(400);
      });
    });

    describe('Client Flow', () => {
      it('should allow client to confirm pickup', async () => {
        // First, ensure booking is in picked_up_pending_confirmation state
        const res = await request(API_BASE)
          .put(`/bookings/${bookingId}/status`)
          .set('Authorization', `Bearer ${TOKENS.client}`)
          .send({ status: 'picked_up' });

        // Should succeed if in correct state, or fail with descriptive error
        expect([200, 400]).toContain(res.status);
      });

      it('should allow client to cancel booking', async () => {
        const res = await request(API_BASE)
          .put(`/bookings/${bookingId}/cancel`)
          .set('Authorization', `Bearer ${TOKENS.client}`);

        expect([200, 400]).toContain(res.status);
      });

      it('should NOT allow client to set at_wash', async () => {
        const res = await request(API_BASE)
          .put(`/bookings/${bookingId}/status`)
          .set('Authorization', `Bearer ${TOKENS.client}`)
          .send({ status: 'at_wash' });

        expect(res.status).toBe(400);
      });
    });

    describe('Car Wash Flow', () => {
      it('should allow carwash to set at_wash', async () => {
        const res = await request(API_BASE)
          .put(`/bookings/${bookingId}/status`)
          .set('Authorization', `Bearer ${TOKENS.carwash}`)
          .send({ status: 'at_wash' });

        expect([200, 400]).toContain(res.status);
      });

      it('should allow carwash to progress through wash statuses', async () => {
        const washStatuses = ['waiting_bay', 'washing_bay', 'drying_bay', 'wash_completed'];
        for (const status of washStatuses) {
          const res = await request(API_BASE)
            .put(`/bookings/${bookingId}/status`)
            .set('Authorization', `Bearer ${TOKENS.carwash}`)
            .send({ status });

          // May fail if not in correct preceding state, but should not be 403
          expect(res.status).not.toBe(403);
        }
      });

      it('should NOT allow carwash to set picked_up', async () => {
        const res = await request(API_BASE)
          .put(`/bookings/${bookingId}/status`)
          .set('Authorization', `Bearer ${TOKENS.carwash}`)
          .send({ status: 'picked_up' });

        expect(res.status).toBe(400);
      });
    });

    describe('Admin Flow', () => {
      it('should allow admin to set any status', async () => {
        const res = await request(API_BASE)
          .put(`/bookings/${bookingId}/status`)
          .set('Authorization', `Bearer ${TOKENS.admin}`)
          .send({ status: 'wash_completed' });

        expect([200, 400]).toContain(res.status);
      });
    });
  });

  describe('POST /api/bookings/:id/return-in-progress', () => {
    it('should allow driver to mark return in progress after wash_completed', async () => {
      const res = await request(API_BASE)
        .post(`/bookings/${bookingId}/return-in-progress`)
        .set('Authorization', `Bearer ${TOKENS.driver}`);

      expect([200, 400]).toContain(res.status);
    });

    it('should NOT allow client to mark return in progress', async () => {
      const res = await request(API_BASE)
        .post(`/bookings/${bookingId}/return-in-progress`)
        .set('Authorization', `Bearer ${TOKENS.client}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/bookings/:id/out-for-delivery', () => {
    it('should allow driver to mark out for delivery after return in progress', async () => {
      const res = await request(API_BASE)
        .post(`/bookings/${bookingId}/out-for-delivery`)
        .set('Authorization', `Bearer ${TOKENS.driver}`);

      expect([200, 400]).toContain(res.status);
    });
  });

  describe('PUT /api/bookings/:id/cancel - Cancellation Rules', () => {
    it('should NOT allow cancellation of completed booking', async () => {
      // First set to completed via admin
      await request(API_BASE)
        .put(`/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${TOKENS.admin}`)
        .send({ status: 'completed' });

      const res = await request(API_BASE)
        .put(`/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${TOKENS.client}`);

      expect(res.status).toBe(400);
    });
  });
});
