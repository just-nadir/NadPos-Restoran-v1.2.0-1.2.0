import { useState, useEffect } from 'react';
import { useNetwork } from '../context/NetworkContext';
import axios from 'axios';

export interface Product {
    id: string;
    name: string;
    price: number;
    category_id: string;
    image_url?: string;
    unit_type: 'item' | 'kg';
}

export interface Category {
    id: string;
    name: string;
}

export const useMenu = () => {
    const { serverUrl, socket } = useNetwork();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!serverUrl) return;
        try {
            const [catRes, prodRes] = await Promise.all([
                axios.get(`${serverUrl}/api/categories`),
                axios.get(`${serverUrl}/api/products`)
            ]);
            setCategories(catRes.data);
            setProducts(prodRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [serverUrl]);

    return { products, categories, loading, refresh: loadData };
};
