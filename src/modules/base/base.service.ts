import { Document, Types, Model } from 'mongoose';
import { IBaseService } from './base.interface';
import { HttpException, HttpStatus } from '@nestjs/common';

export abstract class BaseService<T> implements IBaseService<Document> {
  constructor(public readonly repository: Model<T>) {}

  create(doc: Partial<any>): Promise<any> {
    return this.repository.create(doc);
  }

  async findById(id: string | Types.ObjectId): Promise<any> {
    const result = await this.repository.findById(id);

    if (!result) {
      throw new HttpException('No data found', HttpStatus.NOT_FOUND);
    }

    return result;
  }
  async findOne(filter: object): Promise<any> {
    const result = await this.repository.findOne(filter);

    if (!result) {
      throw new HttpException('No data found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  async find(filter: object): Promise<any[]> {
    return await this.repository.find(filter);
  }

  async updateById(id: string | Types.ObjectId, data: any) {
    const item = await this.repository.findById(id);

    if (!item) {
      throw new HttpException('No data found', HttpStatus.NOT_FOUND);
    }

    if (data) {
      Object.keys(data).forEach(key => {
        if (data[key] === '') {
          delete data[key];
        } else {
          item[key] = data[key];
        }
      });

      data = item;
    }

    return await this.repository.updateOne({ _id: id }, data);
  }

  async updateOne(filter: object, update: object): Promise<any> {
    const result = await this.repository.updateOne(filter, update, {
      upsert: true,
    });

    if (!result) {
      throw new HttpException('No data found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  async updateMany(filter: object, update: object): Promise<any> {
    const result = await this.repository.updateMany(filter, update);

    if (!result) {
      throw new HttpException('No data found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  async deleteOne(filter: object): Promise<any> {
    const result = await this.repository.deleteOne(filter);

    if (!result) {
      throw new HttpException('No data found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  async deleteMany(filter: object): Promise<any> {
    const result = await this.repository.deleteMany(filter);

    if (!result) {
      throw new HttpException('No data found', HttpStatus.NOT_FOUND);
    }

    return result;
  }
}
