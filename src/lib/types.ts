
// This file extends the existing mockData.ts types with MongoDB specific fields

import { Student as BaseStudent, VaccinationDrive as BaseVaccinationDrive } from './mockData';

// MongoDB related types
export interface MongoDBDocument {
  _id: string;
  id?: string; // Keeping for backward compatibility
  createdAt?: string;
  updatedAt?: string;
}

// Extended types for API responses
export interface Student extends Omit<BaseStudent, 'id'>, MongoDBDocument {
  // _id is already included through MongoDBDocument
  vaccinations: {
    driveId: string;
    vaccineName: string;
    date: string;
    status: 'scheduled' | 'completed' | 'cancelled';
  }[];
}

export interface VaccinationDrive extends Omit<BaseVaccinationDrive, 'id'>, MongoDBDocument {
  // _id is already included through MongoDBDocument
}

// Update the base student type interface from mockData to include the cancelled status
export type StudentVaccinationStatus = 'scheduled' | 'completed' | 'cancelled';

// Add helper functions to convert between types
export const convertToUIStudent = (student: Student): BaseStudent => {
  return {
    ...student,
    id: student._id || student.id || '',
    vaccinations: student.vaccinations.map(v => ({
      ...v,
      // No need to map cancelled to completed since we're updating the base type
    })),
  };
};

export const convertToUIVaccinationDrive = (drive: VaccinationDrive): BaseVaccinationDrive => {
  return {
    ...drive,
    id: drive._id || drive.id || '',
  };
};
