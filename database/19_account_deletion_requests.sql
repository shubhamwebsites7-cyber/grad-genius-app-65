-- Account Deletion Requests Table
-- Tracks user requests for account and data deletion

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  reason text,
  confirmed boolean DEFAULT false,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user_id 
  ON public.account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_email 
  ON public.account_deletion_requests(email);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_status 
  ON public.account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_requested_at 
  ON public.account_deletion_requests(requested_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_account_deletion_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_account_deletion_requests_updated_at
  BEFORE UPDATE ON public.account_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_account_deletion_requests_updated_at();

-- Enable Row Level Security
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own deletion requests
CREATE POLICY "Users can view own deletion requests"
  ON public.account_deletion_requests
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Users can insert their own deletion requests
CREATE POLICY "Users can create deletion requests"
  ON public.account_deletion_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Allow anonymous users to submit deletion requests (for users who can't log in)
CREATE POLICY "Anonymous users can create deletion requests"
  ON public.account_deletion_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Admins can view all deletion requests
CREATE POLICY "Admins can view all deletion requests"
  ON public.account_deletion_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Admins can update all deletion requests
CREATE POLICY "Admins can update deletion requests"
  ON public.account_deletion_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Function to get pending deletion requests count (for admin dashboard)
CREATE OR REPLACE FUNCTION get_pending_deletion_requests_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM public.account_deletion_requests
  WHERE status = 'pending';
$$;

COMMENT ON TABLE public.account_deletion_requests IS 'Tracks user account and data deletion requests for compliance with Google Play and privacy regulations';
COMMENT ON COLUMN public.account_deletion_requests.user_id IS 'Reference to the user requesting deletion (if authenticated)';
COMMENT ON COLUMN public.account_deletion_requests.email IS 'Email address of the account to be deleted';
COMMENT ON COLUMN public.account_deletion_requests.status IS 'Current status: pending, processing, completed, or cancelled';
COMMENT ON COLUMN public.account_deletion_requests.confirmed IS 'User has confirmed they understand deletion is permanent';
COMMENT ON COLUMN public.account_deletion_requests.processed_at IS 'Timestamp when the deletion was completed';
COMMENT ON COLUMN public.account_deletion_requests.processed_by IS 'Admin user who processed the deletion';
