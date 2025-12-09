-- Ensure at least one tenant exists for demo purposes
INSERT INTO tenants (id, name, email, plan, status)
VALUES 
  ('25deaa82-6180-44de-9818-c62a1ec6b845', 'cesar', 'cesar.mediotec@gmail.com', 'free', 'active')
ON CONFLICT (id) DO NOTHING;

-- Verify tenant exists
SELECT * FROM tenants;
