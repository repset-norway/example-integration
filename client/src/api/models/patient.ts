import type { IProgram } from "./program";

export interface IPatient {
    id: number;
    name: string;
    email?: string;
    repsetCustomerId?: string;
    programs: IProgram[];
}