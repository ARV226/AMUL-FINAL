const puppeteer = require('puppeteer');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const RECIPIENTS = [
  '918377884512@c.us',
  '919711720145@c.us',
  '918287154627@c.us'
];

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

const FIRST_RUN = false; // Only use true for first-time pincode setup

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function checkStock() {
  const inStock = [];

  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: './profile-data',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  for (const product of products) {
    try {
      console.log(`🔍 Checking: ${product.url}`);
      await page.goto(product.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await sleep(2000);

      const html = await page.content();

      if (html.includes('itemprop="availability" href="https://schema.org/InStock"')) {
        console.log(`✅ ${product.name} is IN STOCK!\n`);
        inStock.push(product);
      } else if (html.includes('itemprop="availability" href="https://schema.org/OutOfStock"')) {
        console.log(`❌ ${product.name} is SOLD OUT.\n`);
      } else {
        console.log(`⚠️ Unknown status for ${product.name}\n`);
      }

    } catch (err) {
      console.log(`❌ Error checking ${product.name}: ${err.message}\n`);
    }
  }

  if (FIRST_RUN) {
    console.log("⏳ First run: Keeping browser open for 3 mins for pincode setup...");
    await sleep(3 * 60 * 1000);
  }

  await browser.close();
  return inStock;
}

async function sendWhatsApp(products) {
  if (products.length === 0) {
    console.log("❎ No in-stock items. WhatsApp not triggered.\n");
    return;
  }

  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp-auth' })
  });

  client.on('qr', qr => {
    console.log('📱 Scan the QR code to login:');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', async () => {
    console.log('✅ WhatsApp client is ready. Sending messages...\n');

    for (const product of products) {
      const msg = `⚠️ IN STOCK ⚠️\n\nproduct name: ${product.name}\nlink: ${product.url}`;
      for (const number of RECIPIENTS) {
        await client.sendMessage(number, msg);
        console.log(`📤 Sent alert to ${number}`);
      }
    }

    console.log("✅ All alerts sent. Exiting in 5s...");
    setTimeout(() => process.exit(0), 5000);
  });

  client.initialize();
}

// Main execution
(async () => {
  console.log(`\n===== Stock Check at ${new Date().toLocaleString()} =====\n`);
  const inStock = await checkStock();
  await sendWhatsApp(inStock);
})();
