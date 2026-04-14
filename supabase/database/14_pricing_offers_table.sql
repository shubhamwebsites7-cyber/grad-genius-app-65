-- Create pricing_offers table to store limited time offer settings
-- Note: Discount percentages are now stored in plan_pricing table
-- This table only manages the offer end time
CREATE TABLE IF NOT EXISTS pricing_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_end_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pricing_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_pricing_offers_updated_at_trigger
BEFORE UPDATE ON pricing_offers
FOR EACH ROW
EXECUTE FUNCTION update_pricing_offers_updated_at();

-- Enable RLS
ALTER TABLE pricing_offers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active offers
CREATE POLICY "Anyone can view active offers"
ON pricing_offers FOR SELECT
TO authenticated, anon
USING (is_active = true);

-- Policy: Only admins can insert/update/delete offers
CREATE POLICY "Only admins can manage offers"
ON pricing_offers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_admin = true
  )
);

-- Insert default offer (8 hours from now)
INSERT INTO pricing_offers (offer_end_time, is_active)
VALUES (NOW() + INTERVAL '8 hours', true);
