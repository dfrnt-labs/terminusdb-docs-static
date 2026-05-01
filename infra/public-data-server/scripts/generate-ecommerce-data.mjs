#!/usr/bin/env node
/**
 * Generate E-Commerce template data for the public TerminusDB data server.
 *
 * Produces synthetic but realistic ecommerce data: customers, categories,
 * products, orders, and order lines with proper cross-references.
 *
 * Usage:
 *   node scripts/generate-ecommerce-data.mjs
 *
 * Outputs:
 *   templates/ecommerce/schema.json
 *   templates/ecommerce/data.json
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = resolve(__dirname, "../templates/ecommerce");

// --- Utilities ---

/**
 * Encode a value for use in a TerminusDB Lexical key @id.
 *
 * TerminusDB uses SWI-Prolog's uri_encoded(segment, ...) which keeps:
 *   unreserved: A-Z a-z 0-9 - . _ ~
 *   sub-delims: ! $ & ' ( ) * + , ; =
 *   plus: : @
 * Everything else is percent-encoded (e.g., spaces -> %20).
 * Then literal '+' is replaced with '%2B'.
 *
 * JavaScript's encodeURIComponent over-encodes (it encodes & @ : etc.),
 * so we decode the chars that SWI-Prolog's segment encoding preserves.
 */
function encodeLexicalField(value) {
  const encoded = encodeURIComponent(String(value))
    .replace(/%21/g, "!")
    .replace(/%24/g, "$")
    .replace(/%26/g, "&")
    .replace(/%27/g, "'")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%2A/g, "*")
    .replace(/%2B/g, "+")
    .replace(/%2C/g, ",")
    .replace(/%3B/g, ";")
    .replace(/%3D/g, "=")
    .replace(/%3A/g, ":")
    .replace(/%40/g, "@");
  // TerminusDB then replaces literal '+' with '%2B'
  return encoded.replace(/\+/g, "%2B");
}

function makeId(type, name) {
  return `terminusdb:///data/${type}/${encodeLexicalField(name)}`;
}

function ref(id) {
  return { "@id": id, "@type": "@id" };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(startYear, endYear) {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().split("T")[0];
}

function randomDateTime(startYear, endYear) {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString();
}

// --- Schema ---

function generateSchema() {
  return [
    {
      "@type": "Class",
      "@id": "Category",
      "@key": { "@type": "Lexical", "@fields": ["name"] },
      "name": "xsd:string",
      "parent_category": { "@type": "Optional", "@class": "Category" }
    },
    {
      "@type": "Class",
      "@id": "Product",
      "@key": { "@type": "Lexical", "@fields": ["name"] },
      "name": "xsd:string",
      "description": { "@type": "Optional", "@class": "xsd:string" },
      "price": "xsd:decimal",
      "category": "Category",
      "in_stock": "xsd:boolean"
    },
    {
      "@type": "Class",
      "@id": "Customer",
      "@key": { "@type": "Lexical", "@fields": ["email"] },
      "name": "xsd:string",
      "email": "xsd:string",
      "registered_date": "xsd:date",
      "country": "xsd:string"
    },
    {
      "@type": "Class",
      "@id": "Order",
      "@key": { "@type": "Lexical", "@fields": ["order_id"] },
      "order_id": "xsd:string",
      "customer": "Customer",
      "order_date": "xsd:dateTime",
      "status": "xsd:string",
      "total": "xsd:decimal"
    },
    {
      "@type": "Class",
      "@id": "OrderLine",
      "@key": { "@type": "Lexical", "@fields": ["order_line_id"] },
      "order_line_id": "xsd:string",
      "order": "Order",
      "product": "Product",
      "quantity": "xsd:integer",
      "unit_price": "xsd:decimal"
    }
  ];
}

// --- Data Generation ---

function generateCategories() {
  const categories = [
    { name: "Electronics", parent: null },
    { name: "Laptops", parent: "Electronics" },
    { name: "Phones", parent: "Electronics" },
    { name: "Clothing", parent: null },
    { name: "Books", parent: null },
    { name: "Home & Garden", parent: null }
  ];

  return categories.map(c => {
    const doc = {
      "@id": makeId("Category", c.name),
      "@type": "Category",
      "name": c.name
    };
    if (c.parent) {
      doc.parent_category = ref(makeId("Category", c.parent));
    }
    return doc;
  });
}

function generateProducts() {
  const products = [
    // Laptops
    { name: "Laptop Pro 15", description: "High-performance 15-inch laptop with M3 chip, 16 GB RAM, 512 GB SSD", price: 1899.99, category: "Laptops", in_stock: true },
    { name: "Laptop Air 13", description: "Ultra-thin 13-inch laptop, perfect for travel and everyday work", price: 1199.99, category: "Laptops", in_stock: true },
    { name: "Budget Notebook 14", description: "Affordable 14-inch notebook for students and light office use", price: 549.99, category: "Laptops", in_stock: true },
    { name: "Gaming Titan 17", description: "17-inch gaming laptop with RTX 4080, 32 GB RAM, 1 TB NVMe", price: 2499.99, category: "Laptops", in_stock: false },
    // Phones
    { name: "Pixel Ultra", description: "Flagship smartphone with advanced AI camera system and 6.7-inch display", price: 999.99, category: "Phones", in_stock: true },
    { name: "Galaxy Note Plus", description: "Large-screen phone with stylus, ideal for productivity on the go", price: 1149.99, category: "Phones", in_stock: true },
    { name: "Budget Phone SE", description: "Compact and affordable smartphone with excellent battery life", price: 399.99, category: "Phones", in_stock: true },
    // Clothing
    { name: "Merino Wool Jumper", description: "Soft, breathable merino wool jumper in charcoal grey", price: 89.99, category: "Clothing", in_stock: true },
    { name: "Waterproof Hiking Jacket", description: "Lightweight, packable waterproof jacket for outdoor adventures", price: 149.99, category: "Clothing", in_stock: true },
    { name: "Linen Summer Shirt", description: "Relaxed-fit linen shirt in sky blue, perfect for warm weather", price: 59.99, category: "Clothing", in_stock: true },
    { name: "Running Trainers Pro", description: "Responsive cushioned trainers for road and trail running", price: 129.99, category: "Clothing", in_stock: false },
    // Books
    { name: "Graph Databases in Practice", description: "Comprehensive guide to modelling, querying, and deploying graph databases", price: 44.99, category: "Books", in_stock: true },
    { name: "The Art of Clean Code", description: "Timeless principles for writing maintainable, readable software", price: 34.99, category: "Books", in_stock: true },
    { name: "Data Modelling for Beginners", description: "Step-by-step introduction to conceptual, logical, and physical data models", price: 29.99, category: "Books", in_stock: true },
    { name: "Sustainable Living Handbook", description: "Practical guide to reducing waste and living more sustainably", price: 24.99, category: "Books", in_stock: true },
    // Home & Garden
    { name: "Cast Iron Dutch Oven", description: "6-quart enamelled cast iron Dutch oven, ideal for slow cooking and baking bread", price: 79.99, category: "Home & Garden", in_stock: true },
    { name: "Bamboo Desk Organiser", description: "Multi-compartment desk organiser made from sustainable bamboo", price: 34.99, category: "Home & Garden", in_stock: true },
    { name: "LED Grow Light Panel", description: "Full-spectrum LED panel for indoor herb and vegetable growing", price: 64.99, category: "Home & Garden", in_stock: true },
    { name: "Ceramic Plant Pot Set", description: "Set of 3 minimalist ceramic pots in white, terracotta, and sage green", price: 42.99, category: "Home & Garden", in_stock: true },
    { name: "Ergonomic Standing Desk", description: "Electric height-adjustable desk with memory presets, 140 cm wide", price: 449.99, category: "Home & Garden", in_stock: false },
  ];

  return products.map(p => ({
    "@id": makeId("Product", p.name),
    "@type": "Product",
    "name": p.name,
    "description": p.description,
    "price": p.price,
    "category": ref(makeId("Category", p.category)),
    "in_stock": p.in_stock
  }));
}

function generateCustomers() {
  const customers = [
    { name: "Alice Smith", email: "alice.smith@example.com", country: "United Kingdom", registered: "2023-03-15" },
    { name: "Bob Johnson", email: "bob.johnson@example.com", country: "United States", registered: "2023-05-22" },
    { name: "Chandra Patel", email: "chandra.patel@example.com", country: "India", registered: "2023-01-08" },
    { name: "Diana Müller", email: "diana.mueller@example.com", country: "Germany", registered: "2023-07-30" },
    { name: "Erik Lindström", email: "erik.lindstrom@example.com", country: "Sweden", registered: "2023-09-12" },
    { name: "Fatima Al-Hassan", email: "fatima.alhassan@example.com", country: "United Arab Emirates", registered: "2023-04-18" },
    { name: "George Papadopoulos", email: "george.papa@example.com", country: "Greece", registered: "2023-11-05" },
    { name: "Hana Tanaka", email: "hana.tanaka@example.com", country: "Japan", registered: "2024-01-20" },
    { name: "Ivan Petrov", email: "ivan.petrov@example.com", country: "Bulgaria", registered: "2023-06-14" },
    { name: "Julia Santos", email: "julia.santos@example.com", country: "Brazil", registered: "2023-08-27" },
    { name: "Karl Andersen", email: "karl.andersen@example.com", country: "Norway", registered: "2024-02-03" },
    { name: "Leila Okafor", email: "leila.okafor@example.com", country: "Nigeria", registered: "2023-10-09" },
    { name: "Marco Rossi", email: "marco.rossi@example.com", country: "Italy", registered: "2023-12-01" },
    { name: "Nadia Kowalski", email: "nadia.kowalski@example.com", country: "Poland", registered: "2024-03-11" },
    { name: "Oscar Dubois", email: "oscar.dubois@example.com", country: "France", registered: "2023-02-25" },
  ];

  return customers.map(c => ({
    "@id": makeId("Customer", c.email),
    "@type": "Customer",
    "name": c.name,
    "email": c.email,
    "registered_date": c.registered,
    "country": c.country
  }));
}

function generateOrders(customers, products) {
  const statuses = ["pending", "processing", "shipped", "delivered", "delivered", "delivered", "cancelled"];
  const orders = [];
  const orderLines = [];

  // Generate 30 orders
  for (let i = 1; i <= 30; i++) {
    const orderId = `ORD-${String(i).padStart(4, "0")}`;
    const customer = randomChoice(customers);
    const status = randomChoice(statuses);
    const orderDate = randomDateTime(2024, 2025);

    // Generate 2-4 line items
    const lineCount = randomInt(2, 4);
    const usedProducts = new Set();
    let total = 0;

    for (let j = 1; j <= lineCount; j++) {
      let product;
      // Avoid duplicate products in the same order
      do {
        product = randomChoice(products);
      } while (usedProducts.has(product["@id"]) && usedProducts.size < products.length);
      usedProducts.add(product["@id"]);

      const quantity = randomInt(1, 3);
      const unitPrice = product.price;
      total += quantity * unitPrice;

      const lineId = `${orderId}-L${j}`;
      orderLines.push({
        "@id": makeId("OrderLine", lineId),
        "@type": "OrderLine",
        "order_line_id": lineId,
        "order": ref(makeId("Order", orderId)),
        "product": ref(product["@id"]),
        "quantity": quantity,
        "unit_price": unitPrice
      });
    }

    orders.push({
      "@id": makeId("Order", orderId),
      "@type": "Order",
      "order_id": orderId,
      "customer": ref(customer["@id"]),
      "order_date": orderDate,
      "status": status,
      "total": Math.round(total * 100) / 100
    });
  }

  return { orders, orderLines };
}

// --- Main ---

function main() {
  console.log("=== E-Commerce Data Generator for TerminusDB ===\n");

  // Use a fixed seed for reproducibility (simple PRNG override)
  let seed = 42;
  const originalRandom = Math.random;
  Math.random = function() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Generate all data
  const categories = generateCategories();
  console.log(`Generated ${categories.length} categories`);

  const products = generateProducts();
  console.log(`Generated ${products.length} products`);

  const customers = generateCustomers();
  console.log(`Generated ${customers.length} customers`);

  const { orders, orderLines } = generateOrders(customers, products);
  console.log(`Generated ${orders.length} orders`);
  console.log(`Generated ${orderLines.length} order lines`);

  // Restore Math.random
  Math.random = originalRandom;

  // Combine all documents (order matters for readability: categories first, then products, etc.)
  const allDocuments = [...categories, ...products, ...customers, ...orders, ...orderLines];
  console.log(`\nTotal documents: ${allDocuments.length}`);

  // Generate schema
  const schema = generateSchema();

  // Write outputs
  const schemaPath = resolve(TEMPLATE_DIR, "schema.json");
  const dataPath = resolve(TEMPLATE_DIR, "data.json");

  writeFileSync(schemaPath, JSON.stringify(schema, null, 2) + "\n");
  console.log(`\nWrote schema: ${schemaPath}`);

  writeFileSync(dataPath, JSON.stringify(allDocuments, null, 2) + "\n");
  console.log(`Wrote data:   ${dataPath}`);

  console.log("\nDone.");
}

main();
