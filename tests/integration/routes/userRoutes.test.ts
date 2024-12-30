import request from 'supertest';
import { app } from '../../../src/app';
import User from '../../../src/models/userModel';
import '../../mongodb_helper';
import { hashPassword } from '../../../src/utils/hashPassword';

describe('User Routes', () => {
  const userData = {
    name: 'John Doe',
    email: 'johndoe@example.com',
    password: 'Password123',
  };

  beforeEach(async (): Promise<void> => {
    await User.deleteMany();
  });

  describe('POST /users', () => {
    it('should create a new user and return 201', async (): Promise<void> => {
      const res = await request(app)
        .post('/users')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe(userData.name);
      expect(res.body.email).toBe(userData.email);
    });

    it('should return 400 if a required fields are missing', async (): Promise<void> => {
      const res = await request(app).post('/users').send({
        email: userData.email,
        password: 'Password123',
      });

      expect(res.status).toBe(400);

      expect(res.body.error).toBe('Name is required');
    });
  });

  describe('GET /users/:id', () => {
    it('should return a user by ID', async (): Promise<void> => {
      const hashedPassword: string = await hashPassword(
        userData.password,
      );
      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });

      const agent = request.agent(app);

      await agent.post('/auth/login').send({
        email: userData.email,
        password: userData.password,
      });

      const res = await agent.get(`/users/${user._id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe(userData.name);
      expect(res.body.email).toBe(userData.email);
    });
  });

  describe('PUT /users/:id', () => {
    it('should update a user and return the updated user', async (): Promise<void> => {
      const hashedPassword: string = await hashPassword(
        userData.password,
      );
      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });

      const agent = request.agent(app);

      await agent.post('/auth/login').send({
        email: userData.email,
        password: userData.password,
      });

      const res = await agent
        .put(`/users/${user._id}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe('Updated Name');
    });

    it('should return 400 if the user is not found', async (): Promise<void> => {
      const hashedPassword: string = await hashPassword(
        userData.password,
      );

      await User.create({
        ...userData,
        password: hashedPassword,
      });

      const agent = request.agent(app);

      await agent.post('/auth/login').send({
        email: userData.email,
        password: userData.password,
      });

      const res = await agent
        .put(`/users/'invalid-id`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid ID format');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user by ID and return a success message', async (): Promise<void> => {
      const hashedPassword: string = await hashPassword(
        userData.password,
      );

      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });

      const agent = request.agent(app);

      await agent.post('/auth/login').send({
        email: userData.email,
        password: userData.password,
      });

      const res = await agent.delete(`/users/${user._id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(
        'User successfully deleted',
      );
    });

    it('should return 400 if the user is not found', async (): Promise<void> => {
      const hashedPassword: string = await hashPassword(
        userData.password,
      );

      await User.create({
        ...userData,
        password: hashedPassword,
      });

      const agent = request.agent(app);

      await agent.post('/auth/login').send({
        email: userData.email,
        password: userData.password,
      });

      const res = await agent.delete('/users/invalid-id');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid ID format');
    });
  });

  describe('User validation middleware', () => {
    it('should return 400 if name is missing', async () => {
      const res = await request(app).post('/users').send({
        email: 'johndoe@example.com',
        password: 'Password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch('Name is required');
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app).post('/users').send({
        name: 'John Doe',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe(
        'Please provide a valid email address',
      );
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app).post('/users').send({
        name: 'John Doe',
        email: 'johndoe@example.com',
      });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe(
        'Password must be at least 8 characters long',
      );
    });

    it('should return 400 if email is invalid', async () => {
      const res = await request(app).post('/users').send({
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe(
        'Please provide a valid email address',
      );
    });

    it('should return 400 if password is too short', async () => {
      const res = await request(app).post('/users').send({
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: 'short',
      });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe(
        'Password must be at least 8 characters long',
      );
    });

    it('should return 400 if password does not contain a number', async () => {
      const res = await request(app).post('/users').send({
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: 'password',
      });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe(
        'Password must contain at least one number',
      );
    });

    it('should return 400 if password does not contain an uppercase letter', async () => {
      const res = await request(app).post('/users').send({
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: 'password1',
      });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe(
        'Password must contain at least one uppercase letter',
      );
    });

    it('should return 400 if password does not contain a lowercase letter', async () => {
      const res = await request(app).post('/users').send({
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: 'PASSWORD123',
      });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].msg).toBe(
        'Password must contain at least one lowercase letter',
      );
    });
  });
});