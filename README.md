# Kunimi – Self-hosted Analytics on Cloudflare

*Kunimi (国見)* refers to the ancient Japanese practice of surveying the land from a high vantage point to observe the state of the people. 
True to its name, Kunimi is a lightweight, self-hosted web analytics solution designed to run on Cloudflare Workers and D1, allowing you to oversee your traffic clearly. Keep your data private, fast, and under your control.

## ✨ Features

* **Own Your Data:** A personal analytics dashboard deployed directly to your Cloudflare account. No third-party tracking.
* **Interactive Traffic Map:** Beautifully visualize your visitor counts and global reach on an interactive world map.
* **Detailed Aggregation:** View comprehensive lists of access logs, aggregated by hour, country, device, and page path.
* **Bilingual Support:** Fully supports both English and Japanese UI out of the box (with automatic browser language detection and manual toggling).

---

## 🚀 Installation

### Option 1: 1-Click Deploy (Recommended)
The easiest way to get started is by deploying directly to your Cloudflare account. Cloudflare will automatically clone this repository, provision the D1 database, run the initial schema migrations, and set up your environment variables.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/tinyalg/kunimi/tree/pre-release)

*Note: During the setup process, you will be prompted to enter a `BASIC_USER` and `BASIC_PASS` for your dashboard.*

---

### Option 2: Manual Installation
If you prefer to set up resources manually using the command line, follow these steps.

#### Prerequisites
* [Node.js](https://nodejs.org/) installed
* A [Cloudflare](https://dash.cloudflare.com/) account
* Cloudflare Workers & D1 enabled

### 1. Clone & Install
Clone this repository to your local machine and install the dependencies.
```bash
git clone https://github.com/tinyalg/kunimi.git
cd kunimi
npm install
```

### 2. Create a D1 Database

Create a new Cloudflare D1 database.

```bash
npx wrangler d1 create my-kunimi-db

```

This command will output a `database_id`.
*Note: If Wrangler asks "Would you like Wrangler to add it on your behalf?", **press `N` (No)**.*


### 3. Configure `wrangler.jsonc`

Edit your `wrangler.jsonc`.

1. Paste the `database_id` you got in Step 2.
2. Set your custom project name (`name`).
3. Set your target domains and dashboard username in the `vars` block.

```jsonc
{
  "name": "my-kunimi", // Change to your preferred project name (this will be part of your URL)
  
  // ...other settings...

  "d1_databases": [
    {
      "binding": "DB", // DO NOT CHANGE THIS
      "database_name": "my-kunimi-db",
      "database_id": "YOUR_DATABASE_ID_HERE" // Paste your ID here
    }
  ],

  "vars": {
    "ALLOWED_DOMAINS": "example.com, myblog.net",
    "BASIC_USER": "admin"
  }
}

```

### 4. Initialize the Database Table

Apply the included database schema to create the required table for your remote environment.

```bash
npx wrangler d1 execute my-kunimi-db --remote --file=./migrations/0001_initial.sql
```

### 5. Set Dashboard Password

For security reasons, keep your dashboard password hidden by setting it as a Cloudflare Secret.

```bash
npx wrangler secret put BASIC_PASS
```

*(You will be prompted to enter your password in the terminal)*

### 6. Deploy to Cloudflare

Deploy your Worker and Database to the Cloudflare network.

```bash
npx wrangler deploy

```

### 7. Embed the Tracking Script

Once deployed, add the following script tag to the `<head>` or just before the closing `</body>` tag of the website(s) you want to track.

```html
<script async src="https://YOUR_WORKER_URL/script.js"></script>

```

---

## 🛠 Data Management

You can easily backup or restore your analytics data using Wrangler commands.

### Exporting Data (Backup)

```bash
npx wrangler d1 export my-kunimi-db --remote --output=./backup.sql
```

### Importing Data (Restore)

```bash
npx wrangler d1 execute my-kunimi-db --remote --file=./backup.sql
```

## 📊 Performance & Limitations

Kunimi is powered by Cloudflare D1, which inherently processes queries single-threadedly. 

* **Expected Capacity:** It is suited for personal blogs, portfolios, and medium-sized websites ranging from **1,000 to 100,000+ daily page views**. 
* **Fail-Safe Design:** In the rare event of a sudden traffic spike that exceeds D1's concurrent write limits, the analytics worker will simply drop the excess requests and log a failure in the Cloudflare console.
* **Zero Impact on Your Site:** Because tracking is handled asynchronously via a 1x1 transparent GIF, even if the database becomes overloaded, it will **never** slow down, block, or break your actual website.

---

## 📄 License

BSD 3-Clause License