# 🔔 Price Alerts System - Setup Guide

## ✅ What's Been Created

A complete price alerts system that notifies users when stocks reach target prices or percentage changes.

## 📁 Files Created

### Database
- `supabase/migrations/20240110000001_create_price_alerts.sql` - Database schema

### Frontend
- `src/hooks/usePriceAlerts.ts` - React hook for alerts management
- `src/components/alerts/CreateAlertDialog.tsx` - UI for creating alerts

## 🚀 Setup Instructions

### Step 1: Run Database Migration

You need to run the SQL migration to create the `price_alerts` table in Supabase.

**Option A: Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20240110000001_create_price_alerts.sql`
4. Paste and run the SQL

**Option B: Supabase CLI**
```bash
# If you have Supabase CLI installed
supabase db push
```

### Step 2: Verify Tables Created

Check that these tables exist in your database:
- `price_alerts` - Main alerts table
- `alert_history` - Alert history tracking

### Step 3: Test the Hook

The hook is ready to use:

```typescript
import { usePriceAlerts } from '@/hooks/usePriceAlerts';

function MyComponent() {
  const { alerts, createAlert, loading } = usePriceAlerts(userId);
  
  // Create an alert
  const handleCreateAlert = async () => {
    await createAlert({
      stock_symbol: 'RELIANCE',
      stock_name: 'Reliance Industries',
      alert_type: 'above',
      target_price: 2500,
      current_price: 2456.75,
      is_active: true
    });
  };
  
  return <div>{alerts.length} alerts</div>;
}
```

## 📊 Database Schema

### price_alerts Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User reference |
| stock_symbol | TEXT | Stock symbol (e.g., RELIANCE) |
| stock_name | TEXT | Stock name |
| alert_type | TEXT | 'above', 'below', 'change_up', 'change_down' |
| target_price | DECIMAL | Target price for price alerts |
| target_percent | DECIMAL | Target percentage for change alerts |
| current_price | DECIMAL | Price when alert was created |
| is_active | BOOLEAN | Whether alert is active |
| is_triggered | BOOLEAN | Whether alert has been triggered |
| triggered_at | TIMESTAMP | When alert was triggered |
| notification_sent | BOOLEAN | Whether notification was sent |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### alert_history Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| alert_id | UUID | Reference to price_alerts |
| user_id | UUID | User reference |
| stock_symbol | TEXT | Stock symbol |
| alert_type | TEXT | Alert type |
| target_price | DECIMAL | Target price |
| triggered_price | DECIMAL | Price when triggered |
| triggered_at | TIMESTAMP | When triggered |

## 🎯 Alert Types

### 1. Price Above
Triggers when stock price goes above target price.

```typescript
{
  alert_type: 'above',
  target_price: 2500,
  current_price: 2456.75
}
```

### 2. Price Below
Triggers when stock price goes below target price.

```typescript
{
  alert_type: 'below',
  target_price: 2400,
  current_price: 2456.75
}
```

### 3. Change Up
Triggers when stock increases by target percentage.

```typescript
{
  alert_type: 'change_up',
  target_percent: 5.0,
  current_price: 2456.75
}
```

### 4. Change Down
Triggers when stock decreases by target percentage.

```typescript
{
  alert_type: 'change_down',
  target_percent: 3.0,
  current_price: 2456.75
}
```

## 💻 Usage Examples

### Create Alert Dialog

```typescript
import { CreateAlertDialog } from '@/components/alerts/CreateAlertDialog';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';

function StockCard({ stock }) {
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const { createAlert } = usePriceAlerts(userId);

  return (
    <>
      <Button onClick={() => setShowAlertDialog(true)}>
        Set Alert
      </Button>
      
      <CreateAlertDialog
        open={showAlertDialog}
        onOpenChange={setShowAlertDialog}
        stockSymbol={stock.symbol}
        stockName={stock.name}
        currentPrice={stock.price}
        onCreateAlert={createAlert}
      />
    </>
  );
}
```

### List Alerts

```typescript
function AlertsList() {
  const { alerts, deleteAlert, toggleAlert } = usePriceAlerts(userId);

  return (
    <div>
      {alerts.map(alert => (
        <Card key={alert.id}>
          <CardContent>
            <h3>{alert.stock_symbol}</h3>
            <p>Type: {alert.alert_type}</p>
            <p>Target: ₹{alert.target_price || `${alert.target_percent}%`}</p>
            <p>Status: {alert.is_triggered ? 'Triggered' : 'Active'}</p>
            
            <Button onClick={() => toggleAlert(alert.id, !alert.is_active)}>
              {alert.is_active ? 'Pause' : 'Resume'}
            </Button>
            
            <Button onClick={() => deleteAlert(alert.id)}>
              Delete
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Get Alerts for Stock

```typescript
function StockDetail({ symbol }) {
  const { getAlertsForStock } = usePriceAlerts(userId);
  const stockAlerts = getAlertsForStock(symbol);

  return (
    <div>
      <h3>Active Alerts: {stockAlerts.length}</h3>
      {stockAlerts.map(alert => (
        <div key={alert.id}>
          Alert: {alert.alert_type} at ₹{alert.target_price}
        </div>
      ))}
    </div>
  );
}
```

## 🔔 Notification System (Future)

The database is ready for notifications. To implement:

### 1. Backend Alert Checker

Create a serverless function that runs periodically:

```typescript
// api/check-alerts.ts
export default async function handler(req, res) {
  // 1. Fetch all active alerts
  // 2. Get current prices for stocks
  // 3. Check if alerts should trigger
  // 4. Send notifications
  // 5. Update alert status
}
```

### 2. Email Notifications

Use SendGrid or Resend:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'alerts@yourapp.com',
  to: user.email,
  subject: `Price Alert: ${stock.symbol}`,
  html: `<p>${stock.symbol} has reached ₹${price}</p>`
});
```

### 3. Push Notifications

Use the service worker:

```typescript
// In service worker
self.registration.showNotification('Price Alert', {
  body: `${symbol} reached ₹${price}`,
  icon: '/icon-192.png',
  badge: '/icon-192.png',
  data: { url: `/stock/${symbol}` }
});
```

## 🔄 Real-Time Updates

The hook automatically subscribes to real-time updates:

```typescript
// Real-time subscription is built-in
const { alerts } = usePriceAlerts(userId);

// Alerts automatically update when:
// - New alert is created
// - Alert is updated
// - Alert is deleted
// - Alert is triggered
```

## 🎯 Hook API Reference

### usePriceAlerts(userId)

**Returns**:
```typescript
{
  alerts: PriceAlert[],           // All alerts
  loading: boolean,                // Loading state
  error: Error | null,             // Error state
  createAlert: (alert) => Promise, // Create new alert
  updateAlert: (id, updates) => Promise, // Update alert
  deleteAlert: (id) => Promise,    // Delete alert
  toggleAlert: (id, isActive) => Promise, // Toggle active status
  getAlertsForStock: (symbol) => PriceAlert[], // Get alerts for stock
  getTriggeredAlerts: () => PriceAlert[], // Get triggered alerts
  getActiveAlertsCount: () => number, // Count active alerts
  refetch: () => Promise           // Manually refetch
}
```

## 🐛 Troubleshooting

### Issue: "Table price_alerts does not exist"
**Solution**: Run the database migration first

### Issue: TypeScript errors about price_alerts
**Solution**: The hook uses type assertions (`as any`) until Supabase types are regenerated

### Issue: Alerts not updating in real-time
**Solution**: Check that Supabase Realtime is enabled for the table

### Issue: Can't create alerts
**Solution**: Verify RLS policies are set up correctly

## 📈 Next Steps

1. **Run the migration** to create tables
2. **Test the hook** in a component
3. **Add alert UI** to stock cards
4. **Implement alert checker** (backend job)
5. **Add notifications** (email/push)

## ✅ Summary

You now have:
- ✅ Database schema for price alerts
- ✅ React hook for alert management
- ✅ UI component for creating alerts
- ✅ Real-time updates
- ✅ Alert history tracking
- ✅ Ready for notifications

**Run the migration and start using price alerts!** 🔔
