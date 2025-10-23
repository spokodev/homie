# Homie Security Policy & Implementation Guide

## Executive Summary

This document defines comprehensive security policies and implementation guidelines for the Homie application. Security is critical for protecting user data, maintaining trust, and ensuring compliance with privacy regulations.

## Authentication Requirements

### Password Policy

**Minimum Requirements:**
```typescript
interface PasswordPolicy {
  minLength: 8;                    // Minimum 8 characters
  requireUppercase: true;          // At least 1 uppercase letter
  requireLowercase: true;          // At least 1 lowercase letter
  requireNumber: true;             // At least 1 number
  requireSpecialChar: true;        // At least 1 special character
  prohibitCommonPasswords: true;   // Check against common passwords list
  prohibitUserInfo: true;          // Cannot contain user's name or email
  maxLength: 128;                  // Maximum length for compatibility
}
```

**Password Strength Validation:**
```typescript
import zxcvbn from 'zxcvbn';

export const validatePasswordStrength = (password: string, userInputs: string[] = []): PasswordValidation => {
  const result = zxcvbn(password, userInputs);

  return {
    score: result.score,           // 0-4 (0: weakest, 4: strongest)
    isAcceptable: result.score >= 3,
    feedback: result.feedback.suggestions,
    estimatedCrackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second,
    warning: result.feedback.warning
  };
};

// Enforce minimum score of 3 (good) for registration
// Enforce minimum score of 4 (strong) for admin accounts
```

**Password History:**
```sql
-- Store hashed passwords to prevent reuse
CREATE TABLE password_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_password_history_user (user_id, created_at DESC)
);

-- Keep last 5 passwords
-- Check new password against history before allowing change
```

### Account Security

**Account Lockout Policy:**
```typescript
interface LockoutPolicy {
  maxFailedAttempts: 5;           // Lock after 5 failed attempts
  lockoutDuration: 15;             // 15 minutes initial lockout
  lockoutMultiplier: 2;            // Double lockout time for repeat offenders
  maxLockoutDuration: 240;         // Maximum 4 hours lockout
  resetPeriod: 60;                 // Reset attempt counter after 60 minutes
  captchaThreshold: 3;             // Show CAPTCHA after 3 failed attempts
}

// Implementation
export const handleFailedLogin = async (email: string): Promise<LoginResponse> => {
  const attempts = await getFailedAttempts(email);

  if (attempts >= 3 && attempts < 5) {
    return { requireCaptcha: true };
  }

  if (attempts >= 5) {
    await lockAccount(email);
    await sendLockoutNotification(email);
    return {
      locked: true,
      unlockTime: calculateUnlockTime(attempts)
    };
  }

  await incrementFailedAttempts(email);
  return { attemptsRemaining: 5 - attempts - 1 };
};
```

**Geographic Anomaly Detection:**
```typescript
interface LocationCheck {
  enableGeoCheck: true;
  suspiciousLocationAction: 'require_2fa' | 'block' | 'notify';
  maxDistancePerHour: 1000;       // Max 1000km travel per hour
  trustedCountries: string[];      // Whitelist of countries
  vpnDetection: true;              // Detect and flag VPN usage
}

export const checkLocationAnomaly = async (
  userId: string,
  currentIP: string
): Promise<AnomalyResult> => {
  const currentLocation = await getLocationFromIP(currentIP);
  const lastLocation = await getLastKnownLocation(userId);

  if (!lastLocation) {
    await saveLocation(userId, currentLocation);
    return { anomaly: false };
  }

  const timeDiff = Date.now() - lastLocation.timestamp;
  const distance = calculateDistance(lastLocation, currentLocation);
  const possibleDistance = (timeDiff / 3600000) * 1000; // km possible at 1000km/h

  if (distance > possibleDistance) {
    await flagSuspiciousLogin(userId, currentLocation);
    return {
      anomaly: true,
      reason: 'impossible_travel',
      requiresVerification: true
    };
  }

  return { anomaly: false };
};
```

### Session Management

**JWT Token Configuration:**
```typescript
interface TokenConfig {
  accessToken: {
    expiresIn: '15m';              // 15 minutes
    algorithm: 'RS256';            // RSA signature
    issuer: 'https://api.homie.app';
    audience: 'homie-mobile';
  };
  refreshToken: {
    expiresIn: '7d';               // 7 days default
    expiresInRememberMe: '30d';    // 30 days with "remember me"
    rotateOnUse: true;             // Issue new refresh token on use
    family: true;                  // Track token families for security
  };
  idToken: {
    expiresIn: '1h';               // 1 hour for user info
    includeProfile: true;
  };
}
```

**Session Security Implementation:**
```typescript
// Secure session storage
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

export class SecureSessionManager {
  private static readonly ACCESS_TOKEN_KEY = 'homie_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'homie_refresh_token';
  private static readonly SESSION_KEY = 'homie_session';

  static async saveTokens(tokens: AuthTokens): Promise<void> {
    // Encrypt tokens before storage
    const encryptedAccess = CryptoJS.AES.encrypt(
      tokens.accessToken,
      await this.getDeviceKey()
    ).toString();

    const encryptedRefresh = CryptoJS.AES.encrypt(
      tokens.refreshToken,
      await this.getDeviceKey()
    ).toString();

    await SecureStore.setItemAsync(this.ACCESS_TOKEN_KEY, encryptedAccess);
    await SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, encryptedRefresh);
  }

  static async clearSession(): Promise<void> {
    // Revoke tokens on server
    await this.revokeTokens();

    // Clear local storage
    await SecureStore.deleteItemAsync(this.ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(this.SESSION_KEY);
  }

  static async validateSession(): Promise<boolean> {
    const token = await this.getAccessToken();
    if (!token) return false;

    try {
      const decoded = jwt.verify(token, publicKey);
      return decoded.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }
}
```

**Session Limits & Management:**
```sql
-- Track active sessions
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_family UUID NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  INDEX idx_sessions_user (user_id, expires_at DESC),
  INDEX idx_sessions_family (token_family)
);

-- Enforce maximum 5 active sessions per user
CREATE OR REPLACE FUNCTION enforce_session_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Count active sessions
  IF (SELECT COUNT(*) FROM user_sessions
      WHERE user_id = NEW.user_id
      AND expires_at > NOW()
      AND NOT revoked) >= 5 THEN
    -- Revoke oldest session
    UPDATE user_sessions
    SET revoked = true
    WHERE user_id = NEW.user_id
    AND NOT revoked
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_session_limit_trigger
  BEFORE INSERT ON user_sessions
  FOR EACH ROW EXECUTE FUNCTION enforce_session_limit();
```

### Multi-Factor Authentication (MFA)

**TOTP Implementation:**
```typescript
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class MFAService {
  // Generate secret for user
  static async setupMFA(userId: string): Promise<MFASetup> {
    const secret = speakeasy.generateSecret({
      length: 32,
      name: `Homie (${user.email})`,
      issuer: 'Homie App'
    });

    // Store encrypted secret
    await this.storeSecret(userId, secret.base32);

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(10);
    await this.storeBackupCodes(userId, backupCodes);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes
    };
  }

  // Verify TOTP code
  static async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const secret = await this.getSecret(userId);

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2  // Allow 2 intervals before/after for clock skew
    });

    if (verified) {
      await this.recordSuccessfulMFA(userId);
    } else {
      await this.recordFailedMFA(userId);
    }

    return verified;
  }

  // Generate backup codes
  static generateBackupCodes(count: number): string[] {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );
    }
    return codes;
  }
}
```

**MFA Enforcement Rules:**
```typescript
interface MFAEnforcement {
  mandatory: {
    householdOwners: true;         // Required for household creators
    premiumUsers: false;           // Optional for premium users
    afterDays: 30;                 // Mandatory after 30 days
  };
  triggers: {
    sensitiveActions: true;        // Require for payment changes
    unusualLocation: true;         // Require for new locations
    deviceChange: true;            // Require for new devices
  };
  gracePeriod: {
    days: 7;                       // 7 days to set up MFA
    reminders: [1, 3, 5, 7];       // Send reminders on these days
  };
}
```

## Authorization & Row Level Security (RLS)

### Enhanced RLS Policies

```sql
-- Prevent privilege escalation
CREATE POLICY "members_cannot_elevate_privileges"
  ON members
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM members
      WHERE household_id = members.household_id
    )
  )
  WITH CHECK (
    -- Can't change own role to owner
    (user_id != auth.uid() OR role = OLD.role) AND
    -- Only owners can change roles
    (OLD.role = NEW.role OR EXISTS (
      SELECT 1 FROM members
      WHERE household_id = members.household_id
      AND user_id = auth.uid()
      AND role = 'owner'
    ))
  );

-- Prevent data exfiltration
CREATE POLICY "limit_household_creation"
  ON households
  FOR INSERT
  WITH CHECK (
    -- Free users: 1 household
    -- Premium users: 3 households
    (SELECT COUNT(*) FROM households WHERE created_by = auth.uid()) <
    CASE
      WHEN EXISTS (
        SELECT 1 FROM subscriptions
        WHERE user_id = auth.uid()
        AND status = 'active'
      ) THEN 3
      ELSE 1
    END
  );

-- Time-based access control
CREATE POLICY "tasks_visible_to_household_members"
  ON tasks
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM members
      WHERE user_id = auth.uid()
      AND created_at < NOW() - INTERVAL '5 minutes' -- Prevent timing attacks
    )
  );

-- Audit sensitive operations
CREATE POLICY "audit_member_changes"
  ON members
  FOR ALL
  USING (true) -- Allow operation
  WITH CHECK (
    -- Log the change
    (SELECT audit_log_change(
      'members',
      CASE TG_OP
        WHEN 'INSERT' THEN 'create'
        WHEN 'UPDATE' THEN 'update'
        WHEN 'DELETE' THEN 'delete'
      END,
      row_to_json(OLD),
      row_to_json(NEW)
    )) IS NOT NULL
  );
```

### Rate Limiting Implementation

```sql
-- Database-level rate limiting
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  endpoint VARCHAR(100) NOT NULL,
  method VARCHAR(10) NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_rate_limit_lookup (user_id, endpoint, window_start),
  INDEX idx_rate_limit_ip (ip_address, endpoint, window_start)
);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_ip INET,
  p_endpoint VARCHAR,
  p_method VARCHAR,
  p_limit INTEGER,
  p_window_minutes INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ;
BEGIN
  window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  -- Check user-based limit
  IF p_user_id IS NOT NULL THEN
    SELECT COALESCE(SUM(count), 0) INTO current_count
    FROM rate_limits
    WHERE user_id = p_user_id
      AND endpoint = p_endpoint
      AND method = p_method
      AND window_start >= window_start;
  ELSE
    -- Check IP-based limit for anonymous users
    SELECT COALESCE(SUM(count), 0) INTO current_count
    FROM rate_limits
    WHERE ip_address = p_ip
      AND endpoint = p_endpoint
      AND method = p_method
      AND window_start >= window_start;
  END IF;

  IF current_count >= p_limit THEN
    RETURN FALSE; -- Rate limit exceeded
  END IF;

  -- Record this request
  INSERT INTO rate_limits (user_id, ip_address, endpoint, method)
  VALUES (p_user_id, p_ip, p_endpoint, p_method)
  ON CONFLICT (user_id, endpoint, method, window_start)
  DO UPDATE SET count = rate_limits.count + 1;

  RETURN TRUE; -- Within limits
END;
$$ LANGUAGE plpgsql;
```

**Application-Level Rate Limiting:**
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Different limits for different endpoints
export const rateLimiters = {
  // Authentication endpoints
  auth: rateLimit({
    store: new RedisStore({ client: redis }),
    windowMs: 15 * 60 * 1000,     // 15 minutes
    max: 5,                        // 5 requests per window
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // General API endpoints
  api: rateLimit({
    store: new RedisStore({ client: redis }),
    windowMs: 1 * 60 * 1000,       // 1 minute
    max: async (req) => {
      // Different limits based on user tier
      if (req.user?.premium) return 200;
      if (req.user) return 100;
      return 10; // Anonymous users
    },
    keyGenerator: (req) => {
      return req.user?.id || req.ip;
    },
  }),

  // File upload endpoints
  upload: rateLimit({
    store: new RedisStore({ client: redis }),
    windowMs: 60 * 60 * 1000,      // 1 hour
    max: 10,                       // 10 uploads per hour
    skipSuccessfulRequests: false,
  }),
};
```

### Audit Logging

```sql
-- Comprehensive audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  metadata JSONB,
  INDEX idx_audit_user (user_id, timestamp DESC),
  INDEX idx_audit_resource (resource_type, resource_id, timestamp DESC),
  INDEX idx_audit_action (action, timestamp DESC)
);

-- Trigger for automatic audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    inet_client_addr(),
    current_setting('app.user_agent', true)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to sensitive tables
CREATE TRIGGER audit_users
  AFTER INSERT OR UPDATE OR DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_members
  AFTER INSERT OR UPDATE OR DELETE ON members
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_subscriptions
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

## Data Protection

### PII (Personally Identifiable Information) Handling

**Data Classification:**
```typescript
enum DataClassification {
  PUBLIC = 'public',           // Can be shared freely
  INTERNAL = 'internal',       // Internal use only
  CONFIDENTIAL = 'confidential', // Requires encryption
  RESTRICTED = 'restricted'     // Highest security level
}

interface PIIField {
  fieldName: string;
  classification: DataClassification;
  encrypted: boolean;
  hashed: boolean;
  retention: number; // Days to retain
  gdprCategory: 'necessary' | 'consent' | 'legitimate_interest';
}

const PIIFields: PIIField[] = [
  { fieldName: 'email', classification: 'CONFIDENTIAL', encrypted: true, hashed: false, retention: 730, gdprCategory: 'necessary' },
  { fieldName: 'name', classification: 'INTERNAL', encrypted: false, hashed: false, retention: 730, gdprCategory: 'consent' },
  { fieldName: 'ip_address', classification: 'CONFIDENTIAL', encrypted: false, hashed: true, retention: 90, gdprCategory: 'legitimate_interest' },
  { fieldName: 'payment_method', classification: 'RESTRICTED', encrypted: true, hashed: false, retention: 365, gdprCategory: 'necessary' },
];
```

**Encryption at Rest:**
```typescript
import crypto from 'crypto';

export class EncryptionService {
  private static algorithm = 'aes-256-gcm';
  private static keyDerivationIterations = 100000;

  // Encrypt PII data
  static encrypt(text: string, masterKey: string): EncryptedData {
    const salt = crypto.randomBytes(32);
    const key = crypto.pbkdf2Sync(masterKey, salt, this.keyDerivationIterations, 32, 'sha256');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: this.algorithm,
      iterations: this.keyDerivationIterations
    };
  }

  // Decrypt PII data
  static decrypt(encryptedData: EncryptedData, masterKey: string): string {
    const key = crypto.pbkdf2Sync(
      masterKey,
      Buffer.from(encryptedData.salt, 'hex'),
      encryptedData.iterations,
      32,
      'sha256'
    );

    const decipher = crypto.createDecipheriv(
      encryptedData.algorithm,
      key,
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Hash sensitive data for comparison
  static hash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512').toString('hex');
    return `${actualSalt}:${hash}`;
  }
}
```

**GDPR Compliance:**
```typescript
export class GDPRService {
  // Data export for GDPR requests
  static async exportUserData(userId: string): Promise<UserDataExport> {
    const data = {
      profile: await this.getProfile(userId),
      tasks: await this.getTasks(userId),
      messages: await this.getMessages(userId),
      ratings: await this.getRatings(userId),
      auditLog: await this.getAuditLog(userId),
      metadata: {
        exportDate: new Date().toISOString(),
        exportFormat: 'json',
        gdprRequest: true
      }
    };

    // Log the export
    await this.logDataExport(userId);

    return data;
  }

  // Right to erasure (right to be forgotten)
  static async deleteUserData(userId: string, confirmation: string): Promise<void> {
    if (confirmation !== `DELETE-${userId}`) {
      throw new Error('Invalid confirmation code');
    }

    // Soft delete first
    await this.anonymizeUser(userId);

    // Schedule hard delete after 30 days
    await this.scheduleHardDelete(userId, 30);

    // Notify user
    await this.sendDeletionConfirmation(userId);
  }

  // Anonymize user data
  static async anonymizeUser(userId: string): Promise<void> {
    const anonymousData = {
      email: `deleted-${userId}@anonymous.local`,
      name: 'Deleted User',
      avatar: null,
      phone: null,
      // Keep non-PII data for analytics
    };

    await this.updateUser(userId, anonymousData);
  }
}
```

### File Upload Security

**Upload Validation:**
```typescript
import fileType from 'file-type';
import sharp from 'sharp';
import clamav from 'clamscan';

export class FileUploadSecurity {
  static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ];

  static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  static readonly MAX_DIMENSION = 4096; // Max width/height

  static async validateUpload(file: Express.Multer.File): Promise<ValidationResult> {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large' };
    }

    // Verify MIME type from file content (not just extension)
    const type = await fileType.fromBuffer(file.buffer);
    if (!type || !this.ALLOWED_MIME_TYPES.includes(type.mime)) {
      return { valid: false, error: 'Invalid file type' };
    }

    // Scan for malware
    const scanResult = await this.scanForMalware(file.buffer);
    if (!scanResult.clean) {
      await this.logMalwareDetection(file, scanResult);
      return { valid: false, error: 'Security threat detected' };
    }

    // Validate image dimensions and content
    try {
      const metadata = await sharp(file.buffer).metadata();

      if (metadata.width > this.MAX_DIMENSION || metadata.height > this.MAX_DIMENSION) {
        return { valid: false, error: 'Image dimensions too large' };
      }

      // Remove EXIF data and re-encode
      const sanitized = await sharp(file.buffer)
        .rotate() // Auto-rotate based on EXIF
        .removeMetadata() // Strip EXIF data
        .jpeg({ quality: 85 })
        .toBuffer();

      return {
        valid: true,
        sanitizedBuffer: sanitized,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format
        }
      };
    } catch (error) {
      return { valid: false, error: 'Invalid image file' };
    }
  }

  static async scanForMalware(buffer: Buffer): Promise<ScanResult> {
    const scanner = await new clamav().init();
    const result = await scanner.scanBuffer(buffer);

    return {
      clean: result.isInfected === false,
      threat: result.viruses?.[0] || null
    };
  }

  // Generate secure filename
  static generateSecureFilename(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const randomName = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${randomName}${ext}`;
  }
}
```

**Secure File Storage:**
```typescript
export class SecureFileStorage {
  // Upload to private S3 bucket
  static async uploadToS3(file: Buffer, filename: string, userId: string): Promise<string> {
    const key = `user-uploads/${userId}/${filename}`;

    const params = {
      Bucket: process.env.S3_BUCKET_PRIVATE,
      Key: key,
      Body: file,
      ServerSideEncryption: 'AES256', // Encrypt at rest
      Metadata: {
        userId,
        uploadDate: new Date().toISOString()
      },
      ContentType: 'image/jpeg',
      ACL: 'private' // Not publicly accessible
    };

    await s3.putObject(params).promise();

    return key;
  }

  // Generate signed URL for temporary access
  static async getSignedUrl(key: string, userId: string): Promise<string> {
    // Verify user has access to this file
    const hasAccess = await this.verifyFileAccess(key, userId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    const params = {
      Bucket: process.env.S3_BUCKET_PRIVATE,
      Key: key,
      Expires: 3600, // 1 hour expiry
      ResponseContentDisposition: 'inline',
    };

    return s3.getSignedUrlPromise('getObject', params);
  }
}
```

### Input Sanitization

**Input Validation & Sanitization:**
```typescript
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

export class InputSanitizer {
  // Sanitize HTML content
  static sanitizeHTML(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
      ALLOWED_ATTR: ['href'],
      ALLOW_DATA_ATTR: false
    });
  }

  // Sanitize text input (remove all HTML)
  static sanitizeText(input: string): string {
    return validator.escape(input)
      .trim()
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
  }

  // Validate and sanitize email
  static sanitizeEmail(email: string): string {
    const normalized = validator.normalizeEmail(email, {
      all_lowercase: true,
      gmail_remove_dots: false,
      gmail_remove_subaddress: false
    });

    if (!validator.isEmail(normalized)) {
      throw new ValidationError('Invalid email format');
    }

    return normalized;
  }

  // Validate and sanitize URL
  static sanitizeURL(url: string): string {
    if (!validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true
    })) {
      throw new ValidationError('Invalid URL');
    }

    // Additional checks for malicious URLs
    const parsed = new URL(url);
    const blacklistedDomains = ['malicious.com', 'phishing.net'];

    if (blacklistedDomains.includes(parsed.hostname)) {
      throw new ValidationError('Blacklisted domain');
    }

    return url;
  }

  // SQL injection prevention (using parameterized queries)
  static prepareSQLParam(value: any): any {
    if (typeof value === 'string') {
      // Remove SQL meta characters
      return value.replace(/['";\\]/g, '');
    }
    return value;
  }

  // Validate JSON structure
  static validateJSON(jsonString: string, schema: object): any {
    try {
      const parsed = JSON.parse(jsonString);
      // Validate against schema (using ajv or similar)
      const valid = ajv.validate(schema, parsed);
      if (!valid) {
        throw new ValidationError('Invalid JSON structure');
      }
      return parsed;
    } catch (error) {
      throw new ValidationError('Invalid JSON');
    }
  }
}
```

**Request Validation Middleware:**
```typescript
import { body, param, query, validationResult } from 'express-validator';

export const validationRules = {
  createTask: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be between 1 and 100 characters')
      .customSanitizer(value => InputSanitizer.sanitizeText(value)),

    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters')
      .customSanitizer(value => InputSanitizer.sanitizeText(value)),

    body('points')
      .isInt({ min: 10, max: 50 })
      .withMessage('Points must be between 10 and 50'),

    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format')
      .custom(value => {
        const date = new Date(value);
        if (date < new Date()) {
          throw new Error('Due date cannot be in the past');
        }
        return true;
      })
  ],

  rateLimit: [
    body('*').customSanitizer(() => {
      // Rate limit check
      return true;
    })
  ]
};

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
      message: 'Validation failed'
    });
  }
  next();
};
```

## Payment Security

### RevenueCat Integration Security

**Webhook Signature Verification:**
```typescript
import crypto from 'crypto';

export class RevenueCatSecurity {
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  }

  static async handleWebhook(req: Request, res: Response) {
    const signature = req.headers['x-revenuecat-signature'] as string;
    const payload = JSON.stringify(req.body);

    if (!this.verifyWebhookSignature(payload, signature, process.env.REVENUECAT_WEBHOOK_SECRET)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process webhook
    try {
      await this.processWebhookEvent(req.body);
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Processing failed' });
    }
  }

  static async processWebhookEvent(event: RevenueCatEvent) {
    // Validate event structure
    if (!event.event_timestamp_ms || !event.type) {
      throw new Error('Invalid event structure');
    }

    // Prevent replay attacks
    const eventAge = Date.now() - event.event_timestamp_ms;
    if (eventAge > 5 * 60 * 1000) { // 5 minutes
      throw new Error('Event too old');
    }

    // Check for duplicate events
    const isDuplicate = await this.checkDuplicateEvent(event.id);
    if (isDuplicate) {
      console.log('Duplicate event, skipping');
      return;
    }

    // Process based on event type
    switch (event.type) {
      case 'INITIAL_PURCHASE':
        await this.handleInitialPurchase(event);
        break;
      case 'RENEWAL':
        await this.handleRenewal(event);
        break;
      case 'CANCELLATION':
        await this.handleCancellation(event);
        break;
      case 'UNCANCELLATION':
        await this.handleUncancellation(event);
        break;
      case 'NON_RENEWING_PURCHASE':
        await this.handleNonRenewingPurchase(event);
        break;
      case 'EXPIRATION':
        await this.handleExpiration(event);
        break;
    }

    // Record processed event
    await this.recordProcessedEvent(event.id);
  }
}
```

### Fraud Detection

```typescript
export class FraudDetection {
  static async checkForFraud(userId: string, purchase: Purchase): Promise<FraudCheckResult> {
    const checks = await Promise.all([
      this.checkDisposableEmail(userId),
      this.checkVelocity(userId),
      this.checkPaymentPattern(userId),
      this.checkDeviceFingerprint(userId),
      this.checkGeographicAnomaly(userId, purchase)
    ]);

    const riskScore = this.calculateRiskScore(checks);

    if (riskScore > 0.7) {
      await this.flagHighRisk(userId, purchase, checks);
      return {
        action: 'block',
        reason: 'High fraud risk',
        riskScore
      };
    }

    if (riskScore > 0.4) {
      await this.flagMediumRisk(userId, purchase, checks);
      return {
        action: 'review',
        reason: 'Medium fraud risk',
        riskScore
      };
    }

    return {
      action: 'allow',
      riskScore
    };
  }

  static async checkDisposableEmail(userId: string): Promise<boolean> {
    const user = await getUserById(userId);
    const domain = user.email.split('@')[1];

    // Check against known disposable email domains
    const disposableDomains = [
      'tempmail.com',
      'guerrillamail.com',
      '10minutemail.com',
      // ... more domains
    ];

    return disposableDomains.includes(domain);
  }

  static async checkVelocity(userId: string): Promise<VelocityCheck> {
    // Check for rapid subscription/cancellation patterns
    const recentTransactions = await getRecentTransactions(userId, 30); // Last 30 days

    const subscriptions = recentTransactions.filter(t => t.type === 'subscription');
    const cancellations = recentTransactions.filter(t => t.type === 'cancellation');

    return {
      suspicious: cancellations.length > 2 || subscriptions.length > 3,
      subscriptionCount: subscriptions.length,
      cancellationCount: cancellations.length
    };
  }
}
```

## Security Headers & Configuration

**Express Security Middleware:**
```typescript
import helmet from 'helmet';
import cors from 'cors';

export const securityMiddleware = [
  // Helmet for security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.homie.app', 'wss://realtime.homie.app'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }),

  // CORS configuration
  cors({
    origin: process.env.NODE_ENV === 'production'
      ? ['https://app.homie.app', 'https://homie.app']
      : ['http://localhost:3000', 'http://localhost:19006'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400 // 24 hours
  }),
];
```

## Incident Response Plan

### Security Incident Procedures

```typescript
export class SecurityIncidentResponse {
  static async handleSecurityIncident(incident: SecurityIncident): Promise<void> {
    // 1. Assess severity
    const severity = this.assessSeverity(incident);

    // 2. Contain the threat
    await this.containThreat(incident);

    // 3. Notify stakeholders
    await this.notifyStakeholders(incident, severity);

    // 4. Investigate
    const investigation = await this.investigate(incident);

    // 5. Remediate
    await this.remediate(incident, investigation);

    // 6. Document
    await this.documentIncident(incident, investigation);

    // 7. Post-mortem
    if (severity >= Severity.HIGH) {
      await this.schedulePostMortem(incident);
    }
  }

  static assessSeverity(incident: SecurityIncident): Severity {
    if (incident.type === 'data_breach' || incident.type === 'account_takeover') {
      return Severity.CRITICAL;
    }
    if (incident.type === 'suspicious_activity' || incident.type === 'failed_attack') {
      return Severity.MEDIUM;
    }
    return Severity.LOW;
  }

  static async containThreat(incident: SecurityIncident): Promise<void> {
    switch (incident.type) {
      case 'account_takeover':
        // Lock affected accounts
        await this.lockAccounts(incident.affectedUsers);
        // Revoke all sessions
        await this.revokeSessions(incident.affectedUsers);
        // Force password reset
        await this.forcePasswordReset(incident.affectedUsers);
        break;

      case 'data_breach':
        // Isolate affected systems
        await this.isolateSystem(incident.affectedSystem);
        // Rotate all secrets
        await this.rotateSecrets();
        // Enable emergency mode
        await this.enableEmergencyMode();
        break;
    }
  }
}
```

## Security Best Practices Checklist

### Development Phase
- [ ] All dependencies scanned for vulnerabilities (npm audit)
- [ ] Secrets stored in environment variables, never in code
- [ ] Input validation on all user inputs
- [ ] Output encoding to prevent XSS
- [ ] Parameterized queries to prevent SQL injection
- [ ] Authentication required for all sensitive operations
- [ ] Authorization checks on all resources
- [ ] Rate limiting on all endpoints
- [ ] Audit logging for sensitive operations
- [ ] Error messages don't leak sensitive information

### Deployment Phase
- [ ] HTTPS enforced everywhere
- [ ] Security headers configured
- [ ] Database connections encrypted
- [ ] Secrets rotated regularly
- [ ] Backup encryption enabled
- [ ] Monitoring and alerting configured
- [ ] Incident response plan tested
- [ ] Security documentation updated

### Operational Phase
- [ ] Regular security audits (quarterly)
- [ ] Penetration testing (annually)
- [ ] Dependency updates (monthly)
- [ ] Security patches applied promptly
- [ ] Access reviews (quarterly)
- [ ] Incident response drills (bi-annually)
- [ ] Security training for team (annually)

## Compliance Requirements

### GDPR Compliance
- [x] Privacy policy updated and accessible
- [x] Cookie consent implementation
- [x] Data processing agreements with third parties
- [x] Right to access implementation
- [x] Right to erasure implementation
- [x] Data portability implementation
- [x] Breach notification process (72 hours)
- [x] Privacy by design principles
- [x] Data protection officer designated

### CCPA Compliance
- [x] Privacy policy includes CCPA disclosures
- [x] Do not sell personal information option
- [x] Opt-out mechanism implemented
- [x] Data deletion request process
- [x] Non-discrimination policy

### App Store Requirements
- [x] Privacy nutrition labels accurate
- [x] Data collection purposes disclosed
- [x] Third-party SDK compliance
- [x] Children's privacy protection (COPPA)

## Security Contacts

- **Security Team Email:** security@homie.app
- **Bug Bounty Program:** https://homie.app/security/bounty
- **Responsible Disclosure:** security@homie.app (PGP key available)
- **24/7 Security Hotline:** [Phone number for critical issues]

## Document Control

- **Version:** 1.0.0
- **Last Updated:** October 2024
- **Review Frequency:** Quarterly
- **Owner:** Chief Security Officer
- **Classification:** Confidential

---

**Note:** This security policy is a living document and should be reviewed and updated regularly as threats evolve and new best practices emerge.