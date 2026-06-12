import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import Customer from './models/Customer.js';
import Order from './models/Order.js';
import Segment from './models/Segment.js';
import Campaign from './models/Campaign.js';
import Communication from './models/Communication.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/xenocrm';

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Gurgaon'];
const CHANNELS = ['in-store', 'online', 'mobile-app', 'whatsapp'];

// BrewLux menu items
const MENU = [
  { name: 'Cold Brew', category: 'Beverage', price: 250 },
  { name: 'Espresso', category: 'Beverage', price: 180 },
  { name: 'Caramel Macchiato', category: 'Beverage', price: 320 },
  { name: 'Vanilla Latte', category: 'Beverage', price: 290 },
  { name: 'Flat White', category: 'Beverage', price: 260 },
  { name: 'Nitro Cold Brew', category: 'Beverage', price: 350 },
  { name: 'Mocha Frappuccino', category: 'Beverage', price: 380 },
  { name: 'Butter Croissant', category: 'Food', price: 150 },
  { name: 'Blueberry Muffin', category: 'Food', price: 180 },
  { name: 'Chocolate Brownie', category: 'Food', price: 200 },
  { name: 'Avocado Toast', category: 'Food', price: 450 },
  { name: 'Chicken Club Sandwich', category: 'Food', price: 350 },
  { name: 'BrewLux Mug', category: 'Merchandise', price: 750 },
  { name: 'Coffee Beans Bag (250g)', category: 'Merchandise', price: 600 },
  { name: 'French Press Maker', category: 'Merchandise', price: 1800 },
  { name: 'Tumbler', category: 'Merchandise', price: 1200 },
];

async function seedDatabase() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully!');

    // Clear existing data
    console.log('Clearing existing collections...');
    await Customer.deleteMany({});
    await Order.deleteMany({});
    await Segment.deleteMany({});
    await Campaign.deleteMany({});
    await Communication.deleteMany({});
    console.log('Collections cleared.');

    // 1. Generate 500 Customers in memory
    console.log('Generating 500 customers...');
    const customersData = [];
    const customerTiers = []; // VIP, Regular, Casual, Inactive

    const tagsPool = [
      'coffee-lover', 'regular', 'weekend-spender', 'croissant-fan', 
      'high-value', 'inactive', 'new-user', 'morning-rush', 'merch-collector'
    ];

    for (let i = 0; i < 500; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();
      
      // Handle unique email clashes
      const emailExists = customersData.some(c => c.email === email);
      const uniqueEmail = emailExists ? `${faker.string.alphanumeric(4)}_${email}` : email;

      // Determine customer tier
      let tier;
      const rand = Math.random();
      if (rand < 0.10) tier = 'VIP';          // 10%
      else if (rand < 0.50) tier = 'Regular';  // 40%
      else if (rand < 0.90) tier = 'Casual';   // 40%
      else tier = 'Inactive';                  // 10%

      customerTiers.push(tier);

      // Assign initial tags based on tier
      const customerTags = [];
      if (tier === 'VIP') {
        customerTags.push('high-value', 'coffee-lover');
        if (Math.random() > 0.5) customerTags.push('regular');
      } else if (tier === 'Inactive') {
        customerTags.push('inactive');
      } else if (tier === 'Regular') {
        customerTags.push('regular');
        if (Math.random() > 0.5) customerTags.push('coffee-lover');
      } else {
        customerTags.push('new-user');
      }

      // Add a couple of random tags
      const extraTags = faker.helpers.arrayElements(tagsPool, faker.number.int({ min: 0, max: 2 }));
      extraTags.forEach(t => {
        if (!customerTags.includes(t)) customerTags.push(t);
      });

      customersData.push({
        _id: new mongoose.Types.ObjectId(),
        name: `${firstName} ${lastName}`,
        email: uniqueEmail,
        phone: faker.helpers.fromRegExp('+91 [6-9][0-9]{9}'), // Realistic Indian phone number format
        city: faker.helpers.arrayElement(CITIES),
        tags: customerTags,
        createdAt: faker.date.between({ from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), to: new Date() }),
        totalOrders: 0,
        totalSpend: 0,
      });
    }

    // 2. Distribute exactly 2,000 orders among customers
    console.log('Distributing 2,000 orders...');
    const totalOrdersToGenerate = 2000;
    const orderCounts = new Array(500).fill(0);

    // Assign base order counts depending on tier to ensure realistic distribution
    // VIP: 10-25, Regular: 4-9, Casual: 1-3, Inactive: 1-2
    let allocatedOrders = 0;
    for (let i = 0; i < 500; i++) {
      const tier = customerTiers[i];
      let baseCount = 0;
      if (tier === 'VIP') baseCount = faker.number.int({ min: 10, max: 25 });
      else if (tier === 'Regular') baseCount = faker.number.int({ min: 4, max: 9 });
      else if (tier === 'Casual') baseCount = faker.number.int({ min: 1, max: 3 });
      else baseCount = faker.number.int({ min: 1, max: 2 });
      
      orderCounts[i] = baseCount;
      allocatedOrders += baseCount;
    }

    // Adjust counts to get exactly 2000 orders
    console.log(`Initial allocation: ${allocatedOrders} orders. Adjusting to exactly ${totalOrdersToGenerate}...`);
    while (allocatedOrders !== totalOrdersToGenerate) {
      const idx = faker.number.int({ min: 0, max: 499 });
      const tier = customerTiers[idx];
      
      if (allocatedOrders < totalOrdersToGenerate) {
        // Add an order slot
        if (tier === 'VIP' && orderCounts[idx] < 35) {
          orderCounts[idx]++;
          allocatedOrders++;
        } else if (tier === 'Regular' && orderCounts[idx] < 15) {
          orderCounts[idx]++;
          allocatedOrders++;
        } else if (tier === 'Casual' && orderCounts[idx] < 5) {
          orderCounts[idx]++;
          allocatedOrders++;
        } else if (tier === 'Inactive' && orderCounts[idx] < 3) {
          orderCounts[idx]++;
          allocatedOrders++;
        }
      } else {
        // Remove an order slot
        if (orderCounts[idx] > 1) {
          orderCounts[idx]--;
          allocatedOrders--;
        }
      }
    }

    // Generate the order documents
    const ordersData = [];
    const now = Date.now();

    for (let i = 0; i < 500; i++) {
      const customer = customersData[i];
      const tier = customerTiers[i];
      const count = orderCounts[i];

      let customerOrders = [];

      for (let j = 0; j < count; j++) {
        // Generate items for the order (1 to 4 items)
        const itemsCount = faker.number.int({ min: 1, max: 4 });
        const items = [];
        let orderAmount = 0;

        for (let k = 0; k < itemsCount; k++) {
          const menuItem = faker.helpers.arrayElement(MENU);
          const qty = faker.number.int({ min: 1, max: 3 });
          items.push({
            name: menuItem.name,
            category: menuItem.category,
            price: menuItem.price,
            qty,
          });
          orderAmount += menuItem.price * qty;
        }

        // Set realistic order date based on tier recency
        let orderDate;
        if (tier === 'Inactive') {
          // Last order was 3 to 6 months ago
          orderDate = faker.date.between({
            from: new Date(now - 180 * 24 * 60 * 60 * 1000),
            to: new Date(now - 90 * 24 * 60 * 60 * 1000),
          });
        } else if (tier === 'Casual') {
          // 1 day to 6 months ago
          orderDate = faker.date.between({
            from: new Date(now - 180 * 24 * 60 * 60 * 1000),
            to: new Date(now - 1 * 24 * 60 * 60 * 1000),
          });
        } else {
          // Regular or VIP: 1 day to 6 months ago (more active recently)
          orderDate = faker.date.between({
            from: new Date(now - 180 * 24 * 60 * 60 * 1000),
            to: new Date(now - 1 * 24 * 60 * 60 * 1000),
          });
        }

        customerOrders.push({
          customerId: customer._id,
          amount: orderAmount,
          items,
          channel: faker.helpers.arrayElement(CHANNELS),
          createdAt: orderDate,
        });
      }

      // Sort customer orders by date ascending
      customerOrders.sort((a, b) => a.createdAt - b.createdAt);

      // Aggregate into Customer fields
      let customerTotalSpend = 0;
      customerOrders.forEach(o => {
        customerTotalSpend += o.amount;
      });

      // Adjust order amounts slightly if needed to guarantee spending range ₹500–₹25000
      if (customerTotalSpend < 500) {
        // Boost first order amount to get over ₹500
        const diff = 500 - customerTotalSpend + 50;
        customerOrders[0].amount += diff;
        customerOrders[0].items.push({
          name: 'BrewLux Mug',
          category: 'Merchandise',
          price: diff,
          qty: 1
        });
        customerTotalSpend += diff;
      } else if (customerTotalSpend > 25000) {
        // Scale down orders
        const factor = 24000 / customerTotalSpend;
        customerTotalSpend = 0;
        customerOrders.forEach(o => {
          o.amount = Math.round(o.amount * factor);
          o.items.forEach(it => {
            it.price = Math.round(it.price * factor);
          });
          customerTotalSpend += o.amount;
        });
      }

      // Save customer aggregations
      customer.totalOrders = customerOrders.length;
      customer.totalSpend = customerTotalSpend;
      customer.lastOrderDate = customerOrders[customerOrders.length - 1].createdAt;

      ordersData.push(...customerOrders);
    }

    // Insert Customers and Orders in bulk
    console.log('Inserting customers into MongoDB...');
    await Customer.insertMany(customersData);
    console.log('Customers inserted.');

    console.log('Inserting orders into MongoDB...');
    await Order.insertMany(ordersData);
    console.log('Orders inserted.');

    // 3. Seed some default segments to make prompt 6/8 work out-of-the-box
    console.log('Creating standard Segments...');
    const segments = [
      {
        name: 'VIP Coffee Lovers',
        description: 'Customers with total spend greater than ₹10,000',
        rules: {
          operator: 'AND',
          conditions: [
            { field: 'totalSpend', operator: 'gt', value: 10000 }
          ]
        },
        customerCount: customersData.filter(c => c.totalSpend > 10000).length,
      },
      {
        name: 'Inactive Churn Risk',
        description: 'Customers who have not ordered in the last 3 months',
        rules: {
          operator: 'AND',
          conditions: [
            { field: 'lastOrderDate', operator: 'lt', value: new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString() }
          ]
        },
        customerCount: customersData.filter(c => c.lastOrderDate < new Date(now - 90 * 24 * 60 * 60 * 1000)).length,
      },
      {
        name: 'Mumbai Latte Fans',
        description: 'Customers from Mumbai who spend regularly',
        rules: {
          operator: 'AND',
          conditions: [
            { field: 'city', operator: 'eq', value: 'Mumbai' },
            { field: 'totalOrders', operator: 'gte', value: 3 }
          ]
        },
        customerCount: customersData.filter(c => c.city === 'Mumbai' && c.totalOrders >= 3).length,
      }
    ];

    await Segment.insertMany(segments);
    console.log('Segments inserted.');

    console.log('--- SEEDING COMPLETED SUCCESSFULY ---');
    console.log(`Total Customers: ${await Customer.countDocuments()}`);
    console.log(`Total Orders: ${await Order.countDocuments()}`);
    console.log(`Total Segments: ${await Segment.countDocuments()}`);

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedDatabase();
