
// This file extends the existing mockData.ts types with MongoDB specific fields

import { Student as BaseStudent, VaccinationDrive as BaseVaccinationDrive } from './mockData';

// MongoDB related types
export interface MongoDBDocument {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

// Extended types for API responses
export interface Student extends Omit<BaseStudent, 'id'>, MongoDBDocument {
  id?: string; // Keep for backward compatibility
}

export interface VaccinationDrive extends Omit<BaseVaccinationDrive, 'id'>, MongoDBDocument {
  id?: string; // Keep for backward compatibility
}
