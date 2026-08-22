# Railway cron: weekly Ticketmaster wishlist × trip scan
#
# In Railway dashboard → project pulse → create a Cron Job (or use an external cron)
# that POSTs once per week (e.g. Sunday 06:00 UTC):
#
#   POST https://pulse-production-38eb.up.railway.app/api/internal/jobs/scan-wishlist-matches
#   Header: x-cron-secret: <CRON_SECRET>
#
# Required Railway env vars on the Pulse service:
#   TICKETMASTER_API_KEY
#   CRON_SECRET
#
# Manual run locally:
#   TICKETMASTER_API_KEY=... npm run jobs:scan-wishlist
