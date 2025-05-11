import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockStudents, mockVaccinationDrives, Student, VaccinationDrive } from '../lib/mockData';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

interface DataContextType {
  students: Student[];
  vaccinationDrives: VaccinationDrive[];
  addStudent: (student: Omit<Student, 'id' | 'vaccinations'>) => void;
  updateStudent: (student: Student) => void;
  addVaccinationDrive: (drive: Omit<VaccinationDrive, 'id' | 'usedDoses' | 'status'>) => boolean;
  updateVaccinationDrive: (drive: VaccinationDrive) => boolean;
  getStudentById: (id: string) => Student | undefined;
  getDriveById: (id: string) => VaccinationDrive | undefined;
  markStudentVaccinated: (studentId: string, driveId: string) => boolean;
  importStudents: (students: Omit<Student, 'id' | 'vaccinations'>[]) => void;
  getDriveVaccinatedStudents: (driveId: string) => Student[];
  getUpcomingDrives: () => VaccinationDrive[];
  getVaccinationStats: () => { total: number, vaccinated: number, percentage: number };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [vaccinationDrives, setVaccinationDrives] = useState<VaccinationDrive[]>([]);

  // Load mock data on initial render
  useEffect(() => {
    // Load data from localStorage if available
    const storedStudents = localStorage.getItem('students');
    const storedDrives = localStorage.getItem('vaccinationDrives');
    
    if (storedStudents && storedDrives) {
      setStudents(JSON.parse(storedStudents));
      setVaccinationDrives(JSON.parse(storedDrives));
    } else {
      // Otherwise use mock data
      setStudents(mockStudents);
      setVaccinationDrives(mockVaccinationDrives);

      // And store it for next time
      localStorage.setItem('students', JSON.stringify(mockStudents));
      localStorage.setItem('vaccinationDrives', JSON.stringify(mockVaccinationDrives));
    }
  }, []);

  // Update localStorage whenever data changes
  useEffect(() => {
    if (students.length > 0) {
      localStorage.setItem('students', JSON.stringify(students));
    }
    
    if (vaccinationDrives.length > 0) {
      localStorage.setItem('vaccinationDrives', JSON.stringify(vaccinationDrives));
    }
  }, [students, vaccinationDrives]);

  const addStudent = (student: Omit<Student, 'id' | 'vaccinations'>) => {
    const newStudent: Student = {
      ...student,
      id: (students.length + 1).toString(),
      vaccinations: []
    };
    
    setStudents(prev => [...prev, newStudent]);
    toast.success(`Student ${student.name} added successfully`);
  };

  const updateStudent = (updatedStudent: Student) => {
    setStudents(prev => 
      prev.map(student => student.id === updatedStudent.id ? updatedStudent : student)
    );
    toast.success(`Student ${updatedStudent.name} updated successfully`);
  };

  const addVaccinationDrive = (drive: Omit<VaccinationDrive, 'id' | 'usedDoses' | 'status'>): boolean => {
    // Convert date string to Date object for validation
    const driveDate = new Date(drive.date);
    const today = new Date();
    const minDate = addDays(today, 15); // 15 days from now
    
    // Check if drive date is at least 15 days in the future
    if (driveDate < minDate) {
      toast.error('Vaccination drive must be scheduled at least 15 days in advance');
      return false;
    }
    
    // Check for overlapping drives on the same date
    const sameDateDrives = vaccinationDrives.filter(existingDrive => 
      existingDrive.date === drive.date
    );
    
    if (sameDateDrives.length > 0) {
      toast.error('A vaccination drive is already scheduled for this date');
      return false;
    }
    
    const newDrive: VaccinationDrive = {
      ...drive,
      id: (vaccinationDrives.length + 1).toString(),
      usedDoses: 0,
      status: 'scheduled'
    };
    
    setVaccinationDrives(prev => [...prev, newDrive]);
    toast.success(`Vaccination drive "${drive.name}" scheduled successfully`);
    return true;
  };

  const updateVaccinationDrive = (updatedDrive: VaccinationDrive): boolean => {
    // Find the existing drive
    const existingDrive = vaccinationDrives.find(drive => drive.id === updatedDrive.id);
    
    if (!existingDrive) {
      toast.error('Vaccination drive not found');
      return false;
    }
    
    // Check if drive is already completed
    if (existingDrive.status === 'completed') {
      toast.error('Cannot edit a completed vaccination drive');
      return false;
    }
    
    // Convert date string to Date for validation
    const driveDate = new Date(updatedDrive.date);
    const today = new Date();
    const minDate = addDays(today, 15); // 15 days from now
    
    // Check date requirement only if the date has changed
    if (updatedDrive.date !== existingDrive.date && driveDate < minDate) {
      toast.error('Vaccination drive must be scheduled at least 15 days in advance');
      return false;
    }
    
    // Check for overlapping drives only if date has changed
    if (updatedDrive.date !== existingDrive.date) {
      const sameDateDrives = vaccinationDrives.filter(drive => 
        drive.date === updatedDrive.date && drive.id !== updatedDrive.id
      );
      
      if (sameDateDrives.length > 0) {
        toast.error('Another vaccination drive is already scheduled for this date');
        return false;
      }
    }
    
    setVaccinationDrives(prev => 
      prev.map(drive => drive.id === updatedDrive.id ? updatedDrive : drive)
    );
    
    toast.success(`Vaccination drive "${updatedDrive.name}" updated successfully`);
    return true;
  };

  const getStudentById = (id: string): Student | undefined => {
    return students.find(student => student.id === id);
  };

  const getDriveById = (id: string): VaccinationDrive | undefined => {
    return vaccinationDrives.find(drive => drive.id === id);
  };

  const markStudentVaccinated = (studentId: string, driveId: string): boolean => {
    const student = students.find(s => s.id === studentId);
    const drive = vaccinationDrives.find(d => d.id === driveId);
    
    if (!student || !drive) {
      toast.error('Student or vaccination drive not found');
      return false;
    }
    
    // Check if student's class is in target classes
    if (!drive.targetClasses.includes(student.class)) {
      toast.error(`This student is not in the target classes (${drive.targetClasses.join(', ')}) for this drive`);
      return false;
    }
    
    // Check if student is already vaccinated in this drive
    if (student.vaccinations.some(v => v.driveId === driveId && v.status === 'completed')) {
      toast.error('Student has already been vaccinated in this drive');
      return false;
    }
    
    // Check if drive has available doses
    if (drive.usedDoses >= drive.totalDoses) {
      toast.error('No more doses available for this vaccination drive');
      return false;
    }
    
    // Update student vaccination record
    const updatedVaccinations = [
      ...student.vaccinations.filter(v => v.driveId !== driveId),
      {
        driveId,
        vaccineName: drive.vaccineName,
        date: drive.date,
        status: 'completed'
      }
    ];
    
    const updatedStudent = {
      ...student,
      vaccinations: updatedVaccinations
    };
    
    // Update drive used doses
    const updatedDrive = {
      ...drive,
      usedDoses: drive.usedDoses + 1
    };
    
    setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));
    setVaccinationDrives(prev => prev.map(d => d.id === driveId ? updatedDrive : d));
    
    toast.success(`${student.name} has been vaccinated with ${drive.vaccineName}`);
    return true;
  };

  const importStudents = (newStudents: Omit<Student, 'id' | 'vaccinations'>[]) => {
    let lastId = Math.max(...students.map(s => parseInt(s.id)), 0);
    
    const studentsToAdd = newStudents.map(student => ({
      ...student,
      id: (++lastId).toString(),
      vaccinations: []
    }));
    
    setStudents(prev => [...prev, ...studentsToAdd]);
    toast.success(`${studentsToAdd.length} students imported successfully`);
  };

  const getDriveVaccinatedStudents = (driveId: string): Student[] => {
    return students.filter(student => 
      student.vaccinations.some(v => v.driveId === driveId && v.status === 'completed')
    );
  };

  const getUpcomingDrives = (): VaccinationDrive[] => {
    const today = new Date();
    const thirtyDaysLater = addDays(today, 30);
    
    return vaccinationDrives.filter(drive => {
      const driveDate = new Date(drive.date);
      return driveDate >= today && driveDate <= thirtyDaysLater && drive.status === 'scheduled';
    });
  };

  const getVaccinationStats = () => {
    const total = students.length;
    // Count students with at least one completed vaccination
    const vaccinated = students.filter(student => 
      student.vaccinations.some(v => v.status === 'completed')
    ).length;
    
    const percentage = total > 0 ? Math.round((vaccinated / total) * 100) : 0;
    
    return { total, vaccinated, percentage };
  };

  const value = {
    students,
    vaccinationDrives,
    addStudent,
    updateStudent,
    addVaccinationDrive,
    updateVaccinationDrive,
    getStudentById,
    getDriveById,
    markStudentVaccinated,
    importStudents,
    getDriveVaccinatedStudents,
    getUpcomingDrives,
    getVaccinationStats,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
