# Hive Analytics Dashboard

A web-based dashboard for monitoring Hive blockchain posts using HafSQL database. This tool allows you to track posts from multiple accounts, monitor their payouts, and analyze engagement metrics.

## Live-Version 
https://hive-fetcher-hafsql.onrender.com/
(Running on Render.com / If Service is unavailable - please drop me a Message.)

## Screenshots
![image](https://github.com/user-attachments/assets/499dbfe0-a55d-4489-b9a7-1fa51510917a)
![image](https://github.com/user-attachments/assets/85fab5c8-3dc3-43d7-9876-92985c2fe379)

## Features

- Monitor multiple Hive accounts simultaneously
- Track post payouts and engagement metrics
- Batch processing of account data
- Customizable time range and payout thresholds
- Real-time progress tracking
- Sortable results table
- Support for both PeakD and Hive.blog frontend links
- Custom HafSQL database connection configuration
- File upload support for bulk account lists

## Installation

1. Clone this repository:
```bash
git clone https://github.com/louis-88/hive-fetcher-hafsql.git
cd hive-hafsql-fetcher
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
node server.js
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. Enter Hive usernames (one per line) or upload a text file containing usernames
2. Configure settings:
   - Days Back: How far back to look for posts (1-30 days)
   - HBD Threshold: Minimum payout value to include
   - Batch Size: Number of accounts to process at once
   - Frontend: Choose between PeakD and Hive.blog links

3. Click "Start Monitoring" to begin processing

## Default HafSQL Connection

The dashboard comes preconfigured to connect to the public HafSQL instance:

```
Host: hafsql.mahdiyari.info
Port: 5432
Database: haf_block_log
Username: hafsql_public
Password: hafsql_public
```

You can change these settings through the "Custom HAFSQL Credentials" section in the dashboard.

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: PostgreSQL (HafSQL)
- Additional: pg-pool for database connection management

## API Endpoints

- `GET /`: Serves the main dashboard
- `POST /update-credentials`: Updates HafSQL connection settings
- `POST /query`: Fetches post data for specified accounts

## License

MIT
