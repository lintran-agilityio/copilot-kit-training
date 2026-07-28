import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'node:path';
import { databaseEntities } from './entities';

const isTs = __filename.endsWith('.ts');

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: databaseEntities,
  migrations: [
    isTs
      ? join(__dirname, 'migrations', '*.ts')
      : join(__dirname, 'migrations', '*.js'),
  ],
  synchronize: false,
});
