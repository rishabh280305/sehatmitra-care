import type {DemoRole} from "./session";
export const canCreateAppointment=(role:DemoRole)=>role==="patient"||role==="asha";
export const canConfirmAppointment=(role:DemoRole)=>role==="doctor"||role==="admin";
export const canViewFieldVisits=(role:DemoRole)=>role!=="patient";
export const canCreateFieldVisit=(role:DemoRole)=>role==="asha";
export const canForecastStaffing=(role:DemoRole)=>role==="admin";
