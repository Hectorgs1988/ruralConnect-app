export type CajaProductCategory = "BEBIDA" | "COMIDA";

export interface CajaProduct {
    id: string;
    name: string;
    category: CajaProductCategory;
    priceCents: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}
