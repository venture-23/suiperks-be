import { BaseService } from '../base/base.service';
import { IPointDocument } from './points.interface';
import { PointModel } from './points.model';

class PointService extends BaseService<IPointDocument> {
  static instance: null | PointService;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor(repository = PointModel) {
    super(repository);
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new PointService();
    }
    return this.instance;
  }

  async addPoints(walletAddress: string, point: number) {
    return await this.repository.updateOne({ walletAddress }, { $inc: { point } }, { new: true, upsert: true });
  }
  async getPoints(walletAddress: string) {
    return await this.repository.findOne({ walletAddress });
  }

  async getTopPoints(size = 10) {
    return await this.repository.find({}).sort({ point: -1 }).limit(size);
  }
}

export default PointService.getInstance();
