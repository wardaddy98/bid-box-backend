import { nanoid } from 'nanoid';

export const generateOrderId = () => `ORD-${nanoid(6).toUpperCase()}`;
