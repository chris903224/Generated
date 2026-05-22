export interface Student {
  id: string;
  phinmaId: string;
  name: string;
  course: string;
  year: string;
  supportType: string;
  remarks: string;
  endorsement: string;
  dataSheet: string;
  duties: string;
}

export interface StudentFormData {
  name: string;
  course: string;
  year: string;
  supportType: string;
  remarks: string;
  endorsement: string;
  dataSheet: string;
  duties: string;
}