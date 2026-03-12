require('dotenv').config();
const connectDB = require('../src/config/db');
const Product = require('../src/models/Product');

async function seed() {
  await connectDB();
  await Product.deleteMany({});
  await Product.insertMany([
    { name: 'VIP', category: 'rank', description: 'Entry rank with perks', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420', price: 9.99, perks: ['/kit vip', '2 homes'], commands: ['lp user {player} parent set vip'] },
    { name: 'MVP', category: 'rank', description: 'Improved rank with extra commands', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f', price: 19.99, perks: ['/kit mvp', '5 homes'], commands: ['lp user {player} parent set mvp'] },
    { name: 'LEGEND', category: 'rank', description: 'Premium rank with priority queue', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e', price: 34.99, perks: ['/kit legend', '10 homes'], commands: ['lp user {player} parent set legend'] },
    { name: 'IMMORTAL', category: 'rank', description: 'Top rank with exclusive perks', image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5', price: 59.99, perks: ['/kit immortal', '15 homes'], commands: ['lp user {player} parent set immortal'] },
    { name: 'Vote Key', category: 'crate', description: '1 Vote key', image: 'https://images.unsplash.com/photo-1603481546579-65d935ba9cdd', price: 1.99, commands: ['crate give {player} vote 1'] },
    { name: 'Rare Key', category: 'crate', description: '1 Rare key', image: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025', price: 4.99, commands: ['crate give {player} rare 1'] },
    { name: 'Epic Key', category: 'crate', description: '1 Epic key', image: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e', price: 7.99, commands: ['crate give {player} epic 1'] },
    { name: 'Legendary Key', category: 'crate', description: '3 Legendary keys', image: 'https://images.unsplash.com/photo-1633545501846-11284fcbac8d', price: 14.99, commands: ['crate give {player} legendary 3'] },
    { name: 'Starter Bundle', category: 'bundle', description: 'VIP + 5 Rare keys', image: 'https://images.unsplash.com/photo-1614294149010-950b698f72c0', price: 24.99, commands: ['lp user {player} parent set vip', 'crate give {player} rare 5'] }
  ]);
  console.log('Seeded products');
  process.exit(0);
}

seed();
