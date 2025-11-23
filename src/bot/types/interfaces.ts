import { User } from "@grammyjs/types";

export interface UserInterface extends User {
    lang: string;
    db_id: string;
}

export interface SessionBasketItemsInterface {
    count: number;
    price: number;
    total: number;
    product_name: string;
    product_id: string;
}

export interface SessionBasketInterface {
    total: number;
    items: SessionBasketItemsInterface[]
}