/**
 * @module services/domain
 * @description Entity classes for service offerings
 * @safety YELLOW
 */

import type { Service } from './service.types';

export class ServiceEntity implements Service {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly price: number,
    public readonly active: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly description?: string,
    public readonly duration?: number
  ) {}

  static create(data: Service): ServiceEntity {
    return new ServiceEntity(
      data.id,
      data.name,
      data.price,
      data.active,
      data.createdAt,
      data.updatedAt,
      data.description,
      data.duration
    );
  }
}
