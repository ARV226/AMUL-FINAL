const puppeteer = require('puppeteer-core');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// === Product List ===
const products = [
  {
    name: "Whey Protein Gift Pack (10)",
    url: "https://shop.amul.com/en/product/amul-whey-protein-gift-pack-32-g-or-pack-of-10-sachets"
  },
  {
    name: "Whey Protein (30)",
    url: "https://shop.amul.com/en/product/amul-whey-protein-32-g-or-pack-of-30-sachets"
  },
  {
    name: "Whey Protein (60)",
    url: "https://shop.amul.com/en/product/amul-whey-protein-32-g-or-pack-of-60-sachets"
  },
  {
    name: "Chocolate Whey Gift Pack (10)",
    url: "https://shop.amul.com/en/product/amul-chocolate-whey-protein-gift-pack-34-g-or-pack-of-10-sachets"
  },
  {
    name: "Chocolate Whey (30)",
    url: "https://shop.amul.com/en/product/amul-chocolate-whey-protein-34-g-or-pack-of-30-sachets"
  },
  {
    name: "Chocolate Whey (60)",
    url: "https://shop.amul.com/en/product/amul-chocolate-whey-protein-34-g-or-pack-of-60-sachets"
  }
];

// === WhatsApp Numbers ===
const RECIPIENTS = [
  '918377884512@c.us',
  '919711720145@c.us',
  '918287154627@c.us'
];

const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
  console.log(`\n===== Stock Check at ${new Date().toLocaleString()} =====\n`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
    userDataDir: './profile-data',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  const available = [];

  for (const product of products) {
    try {
      console.log(`🔍 Checking: ${product.url}`);
      await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      await delay(2000);

      const html = await page.content();

      if (html.includes('itemprop="availability" href="https://schema.org/InStock"')) {
        console.log(`✅ ${product.name} is IN STOCK!\n`);
        available.push(`✅ ${product.name}\n${product.url}`);
      } else if (html.includes('itemprop="availability" href="https://schema.org/OutOfStock"')) {
        console.log(`❌ ${product.name} is SOLD OUT.\n`);
      } else {
        console.log(`⚠️ Unknown status for ${product.name}\n`);
      }

    } catch (err) {
      console.log(`❌ Error checking ${product.name}: ${err.message}\n`);
    }
  }

  await browser.close();

  if (available.length > 0) {
    const client = new Client({
      authStrategy: new LocalAuth({ dataPath: './whatsapp-auth' })
    });

    client.on('qr', qr => {
      console.log('📲 Scan this QR code to login to WhatsApp:');
      qrcode.generate(qr, { small: true });
    });

    client.on('ready', async () => {
      console.log('✅ WhatsApp is ready. Sending messages...');

      const message = `🟢 *IN STOCK PRODUCTS:*\n\n${available.join('\n\n')}`;

      for (const number of RECIPIENTS) {
        await client.sendMessage(number, message);
        console.log(`📤 Sent to ${number}`);
      }

      console.log('✅ Done. Exiting in 5s...');
      setTimeout(() => process.exit(0), 5000);
    });

    client.initialize();
  } else {
    console.log("❌ No products in stock. WhatsApp message not sent.\n");
  }

})();
