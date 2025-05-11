import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Student, VaccinationDrive, Vaccination } from '@/lib/mockData';
import { mockStudents, mockVaccinationDrives } from '@/lib/mockData';

interface DataContextType {
  students: Student[];
  vaccinationDrives: VaccinationDrive[];
  addStudent: (student: Omit<Student, 'id' | 'vaccinations'>) => void;
  updateStudent: (student: Student) => boolean;
  deleteStudent: (id: string) => void;
  getStudentById: (id: string) => Student | undefined;
  addVaccinationDrive: (drive: Omit<VaccinationDrive, 'id' | 'usedDoses' | 'status'>) => void;
  updateVaccinationDrive: (drive: VaccinationDrive) => boolean;
  cancelVaccinationDrive: (id: string) => void;
  completeVaccinationDrive: (id: string) => void;
  getDriveById: (id: string) => VaccinationDrive | undefined;
  getDriveVaccinatedStudents: (driveId: string) => Student[];
  markStudentVaccinated: (studentId: string, driveId: string) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: React.ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(() => {
    const storedStudents = localStorage.getItem('students');
    return storedStudents ? JSON.parse(storedStudents) : mockStudents;
  });
  const [vaccinationDrives, setVaccinationDrives] = useState<VaccinationDrive[]>(() => {
    const storedDrives = localStorage.getItem('vaccinationDrives');
    return storedDrives ? JSON.parse(storedDrives) : mockVaccinationDrives;
  });
  
  // Function to update local storage
  const updateLocalStorage = useCallback(() => {
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('vaccinationDrives', JSON.stringify(vaccinationDrives));
  }, [students, vaccinationDrives]);

  useEffect(() => {
    updateLocalStorage();
  }, [students, vaccinationDrives, updateLocalStorage]);

  const addStudent = (student: Omit<Student, 'id' | 'vaccinations'>) => {
    const newStudent: Student = {
      id: Math.random().toString(36).substring(2, 15),
      ...student,
      vaccinations: [],
    };
    setStudents((prev) => [...prev, newStudent]);
    toast.success(`${student.name} added successfully!`);
  };
  
  const updateStudent = (student: Student): boolean => {
    setStudents(prev =>
      prev.map(s => (s.id === student.id ? student : s))
    );
    toast.success(`${student.name} updated successfully!`);
    return true;
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((student) => student.id !== id));
    toast.success('Student deleted successfully!');
  };

  const getStudentById = (id: string): Student | undefined => {
    return students.find((student) => student.id === id);
  };

  const addVaccinationDrive = (drive: Omit<VaccinationDrive, 'id' | 'usedDoses' | 'status'>) => {
    const newDrive: VaccinationDrive = {
      id: Math.random().toString(36).substring(2, 15),
      ...drive,
      usedDoses: 0,
      status: 'scheduled',
    };
    setVaccinationDrives((prev) => [...prev, newDrive]);
    toast.success(`${drive.name} added successfully!`);
  };
  
  const updateVaccinationDrive = (drive: VaccinationDrive): boolean => {
    if (drive.usedDoses > drive.totalDoses) {
      toast.error("Used doses cannot be more than total doses");
      return false;
    }
    
    setVaccinationDrives(prev =>
      prev.map(d => (d.id === drive.id ? drive : d))
    );
    toast.success(`${drive.name} updated successfully!`);
    return true;
  };

  const cancelVaccinationDrive = (id: string) => {
    setVaccinationDrives(prev =>
      prev.map(drive =>
        drive.id === id ? { ...drive, status: 'cancelled' } : drive
      )
    );
    toast.success('Vaccination drive cancelled successfully!');
  };
  
  const completeVaccinationDrive = (id: string) => {
    setVaccinationDrives(prev =>
      prev.map(drive =>
        drive.id === id ? { ...drive, status: 'completed' } : drive
      )
    );
    toast.success('Vaccination drive completed successfully!');
  };

  const getDriveById = (id: string): VaccinationDrive | undefined => {
    return vaccinationDrives.find((drive) => drive.id === id);
  };
  
  const getDriveVaccinatedStudents = (driveId: string): Student[] => {
    return students.filter(student =>
      student.vaccinations.some(vaccination => vaccination.driveId === driveId)
    );
  };
  
  const markStudentVaccinated = (studentId: string, driveId: string): boolean => {
    const student = students.find(s => s.id === studentId);
    const drive = vaccinationDrives.find(d => d.id === driveId);
    
    if (!student || !drive) {
      toast.error("Student or vaccination drive not found");
      return false;
    }
    
    // Check if student is already vaccinated in this drive
    if (student.vaccinations.some(v => v.driveId === driveId)) {
      toast.error(`${student.name} has already been vaccinated in this drive`);
      return false;
    }
    
    // Check if there are enough doses left
    if (drive.usedDoses >= drive.totalDoses) {
      toast.error("No vaccine doses remaining for this drive");
      return false;
    }
    
    // Add vaccination record to student
    setStudents(prev => 
      prev.map(s => {
        if (s.id === student.id) {
          return {
            ...s,
            vaccinations: [
              ...s.vaccinations,
              {
                driveId: drive.id,
                vaccineName: drive.vaccineName,
                date: new Date().toISOString().split('T')[0],
                status: "completed" as const
              }
            ]
          };
        }
        return s;
      })
    );
    
    // Update usedDoses in vaccinationDrive
    setVaccinationDrives(prev =>
      prev.map(d => {
        if (d.id === driveId) {
          return {
            ...d,
            usedDoses: d.usedDoses + 1
          };
        }
        return d;
      })
    );
    
    toast.success(`${student.name} marked as vaccinated!`);
    return true;
  };

  const value: DataContextType = {
    students,
    vaccinationDrives,
    addStudent,
    updateStudent,
    deleteStudent,
    getStudentById,
    addVaccinationDrive,
    updateVaccinationDrive,
    cancelVaccinationDrive,
    completeVaccinationDrive,
    getDriveById,
    getDriveVaccinatedStudents,
    markStudentVaccinated,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
