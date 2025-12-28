interface OTPResult {
  code: string;
  expiresAt: Date;
}

class OTPService {
  private readonly OTP_LENGTH = 6;
  private readonly EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '15');
  private readonly BYPASS_CODE = '00000';

  /**
   * Generate a 6-digit OTP code
   */
  generateOTP(): string {
    // Generate random 6-digit number
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
  }

  /**
   * Create OTP result with code and expiration
   */
  createOTP(): OTPResult {
    const code = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.EXPIRY_MINUTES);

    return {
      code,
      expiresAt,
    };
  }

  /**
   * Validate OTP code
   */
  validateOTP(storedCode: string | null, storedExpiry: Date | null, inputCode: string): boolean {
    // Check if bypass code is used (for testing)
    if (inputCode === this.BYPASS_CODE) {
      return true;
    }

    // Check if stored code exists
    if (!storedCode || !storedExpiry) {
      return false;
    }

    // Check if OTP has expired
    const now = new Date();
    if (now > storedExpiry) {
      return false;
    }

    // Check if codes match
    return storedCode === inputCode;
  }

  /**
   * Check if OTP has expired
   */
  isExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) {
      return true;
    }

    const now = new Date();
    return now > expiresAt;
  }

  /**
   * Get remaining time in minutes until OTP expires
   */
  getRemainingTime(expiresAt: Date | null): number {
    if (!expiresAt) {
      return 0;
    }

    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));

    return Math.max(0, diffMinutes);
  }

  /**
   * Get OTP expiry time in minutes
   */
  getExpiryMinutes(): number {
    return this.EXPIRY_MINUTES;
  }

  /**
   * Check if code is bypass code
   */
  isBypassCode(code: string): boolean {
    return code === this.BYPASS_CODE;
  }
}

export const otpService = new OTPService();
