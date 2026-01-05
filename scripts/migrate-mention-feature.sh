#!/bin/bash

echo "🔄 Running Prisma Migration for Mention Notification Feature..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run migration
echo "🗄️  Running database migration..."
npx prisma migrate dev --name add_postid_to_history

echo "✅ Migration completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Restart your server"
echo "2. Test POST /api/posts with mentions"
echo "3. Test GET /api/history"
echo ""