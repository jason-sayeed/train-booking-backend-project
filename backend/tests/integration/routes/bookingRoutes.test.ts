import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../../src/app';
import Booking from '../../../src/models/bookingModel';
import User, {
  type IUser,
} from '../../../src/models/userModel';
import Train, {
  type ITrain,
} from '../../../src/models/trainModel';
import '../../mongodb_helper';

describe('Booking Routes', () => {
  const userData = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'password123',
  };

  const trainData = {
    name: 'Test Train',
    route: new mongoose.Types.ObjectId(),
    departureTime: new Date(),
    arrivalTime: new Date(),
    availableSeats: 100,
    availableDates: [
      {
        date: new Date(),
        availableSeats: 100,
        seatsBooked: 0,
      },
    ],
  };

  let user: IUser;
  let train: ITrain;

  beforeEach(async (): Promise<void> => {
    await User.deleteMany();
    await Train.deleteMany();
    await Booking.deleteMany();

    user = await User.create(userData);
    train = await Train.create(trainData);
  });

  describe('POST /bookings', () => {
    it('should create a new booking and return 201', async (): Promise<void> => {
      const bookingData = {
        user: user._id,
        train: train._id,
        seatsBooked: 2,
        bookingDate: new Date(),
      };

      const res = await request(app)
        .post('/bookings')
        .send(bookingData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.user).toBe(user._id.toString());
      expect(res.body.train).toBe(train._id.toString());
      expect(res.body.seatsBooked).toBe(2);
    });

    it('should return 400 if required fields are missing', async (): Promise<void> => {
      const res = await request(app)
        .post('/bookings')
        .send({ user: user._id, train: train._id });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        'User, train, seatsBooked, and bookingDate are required',
      );
    });

    it('should return 400 if booking exceeds available seats', async () => {
      const res = await request(app)
        .post('/bookings')
        .send({
          user: user._id,
          train: train._id,
          seatsBooked: 101,
          bookingDate: new Date(),
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe(
        'Not enough available seats',
      );
    });

    it('should return 400 for invalid booking date', async () => {
      const res = await request(app)
        .post('/bookings')
        .send({
          user: user._id,
          train: train._id,
          seatsBooked: 2,
          bookingDate: 'invalid-date',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /bookings/:id', () => {
    it('should return a booking by ID', async (): Promise<void> => {
      const bookingData = {
        user: user._id,
        train: train._id,
        seatsBooked: 2,
        bookingDate: new Date(),
      };

      const booking = await Booking.create(bookingData);

      const res = await request(app).get(
        `/bookings/${booking._id}`,
      );

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(booking._id.toString());
      expect(res.body.user).toBe(user._id.toString());
      expect(res.body.train).toBe(train._id.toString());
      expect(res.body.seatsBooked).toBe(2);
    });

    it('should return 404 if booking is not found', async (): Promise<void> => {
      const res = await request(app).get(
        '/bookings/invalid-booking-id',
      );

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Booking not found');
    });
  });

  describe('PUT /bookings/:id', () => {
    it('should update a booking and return the updated booking', async (): Promise<void> => {
      const bookingData = {
        user: user._id,
        train: train._id,
        seatsBooked: 2,
        bookingDate: new Date(),
      };

      const booking = await Booking.create(bookingData);

      const res = await request(app)
        .put(`/bookings/${booking._id}`)
        .send({ seatsBooked: 3 });

      expect(res.status).toBe(200);
      expect(res.body.seatsBooked).toBe(3);
    });

    it('should return 404 if booking not found', async (): Promise<void> => {
      const res = await request(app)
        .put('/bookings/invalid-booking-id')
        .send({ seatsBooked: 3 });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Booking not found');
    });
  });

  describe('DELETE /bookings/:id', () => {
    it('should delete a booking and return a success message', async (): Promise<void> => {
      const bookingData = {
        user: user._id,
        train: train._id,
        seatsBooked: 2,
        bookingDate: new Date(),
      };

      const booking = await Booking.create(bookingData);

      const res = await request(app).delete(
        `/bookings/${booking._id}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(
        'Booking successfully deleted',
      );
    });

    it('should return 404 if booking not found', async (): Promise<void> => {
      const res = await request(app).delete(
        '/bookings/invalid-booking-id',
      );

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Booking not found');
    });
  });
});