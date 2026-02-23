/**
 * @module clients/domain
 * @description Entity classes for client management
 * @safety YELLOW
 */

import type { Client } from './client.types';

export class ClientEntity implements Client {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly phone?: string,
    public readonly address?: string,
    public readonly notes?: string
  ) {}

  static create(data: Client): ClientEntity {
    return new ClientEntity(
      data.id,
      data.name,
      data.email,
      data.createdAt,
      data.updatedAt,
      data.phone,
      data.address,
      data.notes
    );
  }
}
