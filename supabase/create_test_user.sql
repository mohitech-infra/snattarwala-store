-- ==============================================================================
-- RAZORPAY TEST ACCOUNT CREATION SCRIPT
-- Email: test@gmail.com
-- Password: test123
-- ==============================================================================

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_encrypted_pw TEXT;
BEGIN
  -- 1. Ensure pgcrypto extension is active
  CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

  -- 2. Generate bcrypt hash for password 'test123'
  BEGIN
    v_encrypted_pw := extensions.crypt('test123', extensions.gen_salt('bf', 10));
  EXCEPTION WHEN undefined_function THEN
    v_encrypted_pw := crypt('test123', gen_salt('bf', 10));
  END;

  -- 3. Delete any previous test user with test@gmail.com
  DELETE FROM auth.users WHERE email = 'test@gmail.com';

  -- 4. Create user in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'test@gmail.com',
    v_encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Test","last_name":"Customer","name":"Test Customer"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 5. Insert into auth.identities (with id as UUID and provider_id as text)
  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id::text,
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', 'test@gmail.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
  );

  -- 6. Upsert profile in public.profiles
  INSERT INTO public.profiles (id, first_name, last_name, phone, role)
  VALUES (v_user_id, 'Test', 'Customer', '9876543210', 'customer')
  ON CONFLICT (id) DO UPDATE SET
    first_name = 'Test',
    last_name = 'Customer',
    phone = '9876543210',
    role = 'customer';

  -- 7. Add pre-filled delivery address for testing checkout
  IF to_regclass('public.addresses') IS NOT NULL THEN
    DELETE FROM public.addresses WHERE user_id = v_user_id;
    INSERT INTO public.addresses (
      user_id,
      full_name,
      phone,
      address_line1,
      address_line2,
      area,
      city,
      state,
      pincode,
      is_default
    ) VALUES (
      v_user_id,
      'Test Customer',
      '9876543210',
      'Shop 4, Crawford Market, Marine Lines',
      'Near Jama Masjid',
      'South Mumbai',
      'Mumbai',
      'Maharashtra',
      '400001',
      true
    );
  END IF;

  RAISE NOTICE 'SUCCESS: Test account test@gmail.com created with password test123';
END $$;
