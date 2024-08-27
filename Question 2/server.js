const express = require('express');
const axios = require('axios');
const uuid = require('uuid');

// Configuration
const BASE_URL = 'http://20.244.56.144/test/companies';
const BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzI0MTcxMzQwLCJpYXQiOjE3MjQxNzEwNDAsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImQwYWQyMjI5LTZjYTAtNGY2NC1hZDRiLThhMjhhYTY4OGVkMyIsInN1YiI6InByZWRhdG9yYWtraTA5MDZAYmJkbml0bS5hYy5pbiJ9LCJjb21wYW55TmFtZSI6IlByZWRhdG9yIiwiY2xpZW50SUQiOiJkMGFkMjIyOS02Y2EwLTRmNjQtYWQ0Yi04YTI4YWE2ODhlZDMiLCJjbGllbnRTZWNyZXQiOiJCTGdLV1JuWFNMclVTcG9sIiwib3duZXJOYW1lIjoiQW5zaHVsIFlhZGF2Iiwib3duZXJFbWFpbCI6InByZWRhdG9yYWtraTA5MDZAYmJkbml0bS5hYy5pbiIsInJvbGxObyI6IjIxMDA1NDAxMDAwNDAifQ.weSCYUSnhMOGyq0mjqOPA9geWCuJmem0-GBj8M4JiLE';

// Initialize Express app
const app = express();

// Utility function to generate a unique ID for products
function generateUniqueId() {
    return uuid.v4();
}

// Utility function to fetch products from a specific e-commerce API with Bearer token
async function fetchProducts(company, category, top, minPrice, maxPrice) {
    const url = `${BASE_URL}/${company}/categories/${category}/products`;

    // Convert minPrice and maxPrice to integers if provided
    const params = {
        top,
        minPrice: minPrice !== undefined ? Math.floor(minPrice) : 0,
        maxPrice: maxPrice !== undefined ? Math.floor(maxPrice) : Infinity,
    };

    const headers = { Authorization: `Bearer ${BEARER_TOKEN}` };

    try {
        const response = await axios.get(url, { params, headers });
        return response.data.products || [];
    } catch (error) {
        throw new Error(`Error fetching products from ${company}: ${error.message}`);
    }
}

// Endpoint to get top products
app.get('/categories/:categoryname/products', async (req, res) => {
    const { categoryname } = req.params;
    const { top = 10, minPrice, maxPrice, sortBy, order = 'asc', page = 1 } = req.query;

    if (page < 1) {
        return res.status(400).json({ detail: 'Invalid page number' });
    }

    const companies = ['AMZ', 'FLP', 'SNP', 'MYN', 'AZO'];
    let allProducts = [];

    for (const company of companies) {
        try {
            const products = await fetchProducts(company, categoryname, parseInt(top), parseFloat(minPrice), parseFloat(maxPrice));
            allProducts = allProducts.concat(products);
        } catch (error) {
            console.error(error.message);
        }
    }

    // Filter products
    let filteredProducts = allProducts.filter(product => 
        (minPrice === undefined || product.price >= minPrice) &&
        (maxPrice === undefined || product.price <= maxPrice)
    );

    // Sort products
    if (sortBy) {
        if (['rating', 'price', 'discount'].includes(sortBy)) {
            filteredProducts.sort((a, b) => {
                if (order === 'desc') {
                    return b[sortBy] - a[sortBy];
                } else {
                    return a[sortBy] - b[sortBy];
                }
            });
        } else {
            return res.status(400).json({ detail: 'Invalid sortBy parameter' });
        }
    }

    // Paginate results
    const start = (page - 1) * top;
    const end = start + parseInt(top);
    const paginatedProducts = filteredProducts.slice(start, end);

    // Add unique IDs to products
    paginatedProducts.forEach(product => {
        product.id = generateUniqueId();
    });

    res.json(paginatedProducts);
});

// Endpoint to get product details
app.get('/categories/products/:productId', async (req, res) => {
    const { productId } = req.params;
    const companies = ['AMZ', 'FLP', 'SNP', 'MYN', 'AZO'];
    let allProducts = [];

    for (const company of companies) {
        try {
            const products = await fetchProducts(company, 'all', 100, 0, Infinity);
            allProducts = allProducts.concat(products);
        } catch (error) {
            console.error(error.message);
        }
    }

    const product = allProducts.find(p => p.id === productId);
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ detail: 'Product not found' });
    }
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
