# PostgreSQL Setup Tasks

## Prerequisites
- PostgreSQL is installed and running

## Tasks to Complete

### 1. Set PostgreSQL User Password
If you're on Linux/macOS with sudo access:
```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

### 2. Create the Database
```bash
sudo -u postgres createdb medledger
```

### 3. Verify Connection
Test that you can connect with:
```bash
psql -U postgres -d medledger -h localhost
```
Enter `postgres` when prompted for password.

### 4. Update .env (if needed)
If your PostgreSQL credentials differ, update `/home/turing/Desktop/hyperledgerassignment/medlegder-frontend/.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medledger
```

### 5. Run Database Migrations
```bash
cd /home/turing/Desktop/hyperledgerassignment/medlegder-frontend
bunx drizzle-kit push
```

### 6. Verify Tables Created
```bash
psql -U postgres -d medledger -h localhost -c "\dt"
```
You should see `medical_records` and `access_requests` tables.

## If You Encounter Issues

### "role does not exist"
Create a new PostgreSQL user that matches your system user:
```bash
sudo -u postgres createuser --superuser turing
sudo -u postgres psql -c "ALTER USER turing WITH PASSWORD 'turing';"
sudo -u postgres createdb -O turing medledger
```

Then update `.env`:
```
DATABASE_URL=postgresql://turing:turing@localhost:5432/medledger
```

### Connection refused
Ensure PostgreSQL is running:
```bash
sudo systemctl start postgresql  # Linux
brew services start postgresql    # macOS
```
