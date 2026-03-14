# Fix for inotify limit

Run this command in your terminal:

```bash
echo 4096 | sudo tee /proc/sys/fs/inotify/max_user_instances
```

Then run your dev server again:

```bash
bun run dev
```
