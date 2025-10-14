# Password Reset Testing Guide

## Prerequisites
1. Ensure Supabase email provider is configured
2. Verify environment variables are set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Configure email templates in Supabase dashboard

## Testing Steps

### 1. Test Forgot Password Flow
1. Navigate to `/login`
2. Click "Forgot your password?" link
3. Should redirect to `/forgot-password`
4. Enter a valid email address
5. Click "Send reset instructions"
6. Verify success message appears
7. Check email inbox for reset email

### 2. Test Email Link
1. Open the password reset email
2. Click the reset link
3. Should redirect to `/reset-password` with tokens in URL
4. Verify the page loads and shows password form
5. If link is invalid/expired, should show error page

### 3. Test Password Reset
1. On reset password page, enter new password
2. Confirm password (must match)
3. Click "Update password"
4. Should show success message
5. Should redirect to `/login` after 2 seconds
6. Test login with new password

### 4. Test Edge Cases
1. **Invalid email**: Try non-existent email on forgot password page
2. **Expired link**: Use old reset link (should show invalid page)
3. **Weak password**: Try password less than 6 characters
4. **Mismatched passwords**: Enter different passwords in confirm field
5. **Already used link**: Try using same reset link twice

## Expected Behaviors

### Forgot Password Page
- ✅ Form validation for email format
- ✅ Loading state during submission
- ✅ Success message with email confirmation
- ✅ Option to try again with different email
- ✅ Back to login link

### Reset Password Page
- ✅ Session validation from URL tokens
- ✅ Invalid link handling
- ✅ Password strength requirements
- ✅ Show/hide password toggles
- ✅ Password confirmation validation
- ✅ Success message and redirect

### Error Handling
- ✅ Network errors
- ✅ Invalid tokens
- ✅ Expired sessions
- ✅ Weak passwords
- ✅ Mismatched passwords

## Supabase Dashboard Configuration

### Email Templates
1. Go to Authentication → Settings → Email Templates
2. Select "Reset Password" template
3. Customize the email content and styling
4. Ensure redirect URL is set to: `{{ .SiteURL }}/reset-password`

### Auth Settings
1. Go to Authentication → Settings
2. Verify "Enable email confirmations" is enabled
3. Set appropriate session timeout values
4. Configure rate limiting for password reset requests

## Troubleshooting

### Common Issues
1. **Email not received**: Check spam folder, verify email provider configuration
2. **Invalid link error**: Check if link expired or already used
3. **Redirect issues**: Verify Site URL in Supabase settings
4. **Token parsing errors**: Check URL hash parameters in browser

### Debug Steps
1. Check browser console for errors
2. Verify network requests in DevTools
3. Check Supabase logs in dashboard
4. Test with different email providers

## Security Considerations
- Reset links expire after 1 hour (Supabase default)
- Links can only be used once
- Rate limiting prevents abuse
- Passwords must meet minimum requirements
- All operations use HTTPS in production
