// core/constants.ts

// Valid credentials
export const VALID_CREDENTIALS = {
  controlNumber: '0011111',
  studentId: '06-2526-123456'
};

// 15 Courses for UI dropdowns only
export const ALL_COURSES = [
  { code: "BSN", name: "BS Nursing (BSN)" },
  { code: "BSMLS", name: "BS Medical Laboratory Sciences (Medical Technology)" },
  { code: "BSPSY", name: "BS Psychology" },
  { code: "BSRADTECH", name: "BS Radiologic Technology (RadTech)" },
  { code: "BSRESPT", name: "BS Respiratory Therapy" },
  { code: "BSPHARM", name: "BS Pharmacy" },
  { code: "BSPT", name: "BS Physical Therapy" },
  { code: "BSIT", name: "BS Information Technology (BSIT)" },
  { code: "BSA", name: "BS Accountancy (BSA)" },
  { code: "BSBA", name: "BS Business Administration (BSBA)" },
  { code: "BSHM", name: "BS Hospitality Management (BSHM)" },
  { code: "BSTM", name: "BS Tourism Management (BSTM)" },
  { code: "BSCRIM", name: "BS Criminology (BSCrim)" },
  { code: "BEED", name: "Bachelor of Elementary Education (BEEd)" },
  { code: "BSED", name: "Bachelor of Secondary Education (BSEd)" }
];

// Helper functions
export const getCourseDisplayName = (code: string) => 
  ALL_COURSES.find(c => c.code === code)?.name || code;

export const getCourseOptions = () => 
  ALL_COURSES.map(c => ({ value: c.code, label: c.name }));