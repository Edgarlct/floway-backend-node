

# git pulls the project
git pull

# reload node-modules
npm install

#build the project
npm run build

pm2 restart prod.pm2.config.js

# Save the PM2 process
pm2 save

echo "Done reloading"

exit 0;

