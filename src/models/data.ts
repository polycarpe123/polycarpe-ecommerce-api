import { IUser } from './user';
import { ICategory } from './category';
import { IProduct } from './product';
import { ICart } from './cart';

// In-memory data stores
export const users: IUser[] = [];
export const categories: ICategory[] = [];
export const products: IProduct[] = [];
export const carts: ICart[] = [];

// Token blacklist (for logout)
export const tokenBlacklist: Set<string> = new Set();