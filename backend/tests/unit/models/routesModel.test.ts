import Route from '../../../src/models/routesModel';
import '../../mongodb_helper';

describe('Route Model', () => {
  beforeEach(async () => {
    await Route.deleteMany({});
  });

  it('should create and save a route successfully', async (): Promise<void> => {
    const route = new Route({
      startStation: 'Station A',
      endStation: 'Station B',
    });

    const savedRoute = await route.save();

    expect(savedRoute._id).toBeDefined();
    expect(savedRoute.startStation).toBe('Station A');
    expect(savedRoute.endStation).toBe('Station B');
  });

  it('should not save a route without a startStation', async (): Promise<void> => {
    const route = new Route({
      endStation: 'Station B',
    });

    await expect(route.save()).rejects.toThrow(
      /Path `startStation` is required/,
    );
  });

  it('should not save a route without an endStation', async (): Promise<void> => {
    const route = new Route({
      startStation: 'Station A',
    });

    await expect(route.save()).rejects.toThrow(
      /Path `endStation` is required/,
    );
  });

  it('should update a route successfully', async (): Promise<void> => {
    const route = new Route({
      startStation: 'Station A',
      endStation: 'Station B',
    });

    const savedRoute = await route.save();

    await Route.updateOne(
      { _id: savedRoute._id },
      { endStation: 'Updated Station B' },
    );

    const updatedRoute = await Route.findById(
      savedRoute._id,
    );
    expect(updatedRoute?.endStation).toBe(
      'Updated Station B',
    );
  });

  it('should delete a route by ID', async (): Promise<void> => {
    const route = new Route({
      startStation: 'Station A',
      endStation: 'Station B',
    });

    const savedRoute = await route.save();

    const result = await Route.deleteOne({
      _id: savedRoute._id,
    });
    expect(result.deletedCount).toBe(1);
  });
});