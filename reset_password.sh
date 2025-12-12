#!/bin/bash
# Script to reset password for a user in Finanzas Pro

EMAIL="$1"
PASSWORD="$2"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
    echo "Usage: ./reset_password.sh <email> <password>"
    echo "Example: ./reset_password.sh user@example.com newpassword123"
    exit 1
fi

echo "🔄 Resetting password for: $EMAIL"

# Generate bcrypt hash using node
HASH=$(docker compose exec -T backend node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('$PASSWORD', 10).then(hash => console.log(hash));
")

# Remove any trailing newlines or whitespace
HASH=$(echo "$HASH" | tr -d '\n\r')

# Update the password in the database
docker compose exec -T db psql -U herwingx -d finanzas_pro -c "UPDATE \"User\" SET password = '$HASH' WHERE email = '$EMAIL';"

echo "✅ Password reset complete!"
echo "📧 Email: $EMAIL"
echo "🔑 New password: $PASSWORD"
