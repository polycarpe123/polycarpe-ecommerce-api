import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailDiagnostics {
  async runDiagnostics() {
    console.log('\n=== EMAIL CONFIGURATION DIAGNOSTICS ===\n');

    // Step 1: Check environment variables
    console.log('1. Checking Environment Variables:');
    const requiredVars = [
      'EMAIL_HOST',
      'EMAIL_PORT',
      'EMAIL_USER',
      'EMAIL_PASSWORD',
      'EMAIL_FROM'
    ];

    let allVarsPresent = true;
    requiredVars.forEach(varName => {
      const value = process.env[varName];
      if (!value) {
        console.log(`   ❌ ${varName}: NOT SET`);
        allVarsPresent = false;
      } else {
        // Mask sensitive data
        const displayValue = varName.includes('PASSWORD') 
          ? '***' + value.slice(-4) 
          : value;
        console.log(`   ✅ ${varName}: ${displayValue}`);
      }
    });

    if (!allVarsPresent) {
      console.log('\n⚠️  Some required variables are missing. Please set them in .env file\n');
      return;
    }

    // Step 2: Create transporter
    console.log('\n2. Creating Email Transporter:');
    let transporter;
    try {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        debug: true, // Enable debug output
        logger: true  // Log information
      });
      console.log('   ✅ Transporter created successfully');
    } catch (error) {
      console.log('   ❌ Failed to create transporter:', error);
      return;
    }

    // Step 3: Verify connection
    console.log('\n3. Verifying SMTP Connection:');
    try {
      await transporter.verify();
      console.log('   SMTP connection verified successfully');
    } catch (error: any) {
      console.log('   SMTP connection failed:');
      console.log('   Error:', error.message);
      console.log('\n   Common issues:');
      console.log('   - Wrong password (use App Password for Gmail)');
      console.log('   - 2FA not enabled (required for Gmail App Passwords)');
      console.log('   - Wrong host or port');
      console.log('   - Firewall blocking connection');
      console.log('   - "Less secure apps" not enabled (if not using App Password)');
      return;
    }

    // Step 4: Send test email
    console.log('\n4. Sending Test Email:');
    const testEmail = process.env.EMAIL_USER; // Send to yourself
    
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: testEmail,
        subject: 'Test Email - Email Service Diagnostics',
        text: 'If you receive this email, your email service is working correctly!',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #4CAF50;">✅ Email Service Working!</h2>
            <p>Your email configuration is correct and emails are being sent successfully.</p>
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li>Host: ${process.env.EMAIL_HOST}</li>
              <li>Port: ${process.env.EMAIL_PORT}</li>
              <li>Secure: ${process.env.EMAIL_SECURE}</li>
              <li>From: ${process.env.EMAIL_FROM}</li>
            </ul>
            <p>Timestamp: ${new Date().toISOString()}</p>
          </div>
        `
      });

      console.log('   ✅ Test email sent successfully!');
      console.log('   Message ID:', info.messageId);
      console.log('   Response:', info.response);
      console.log(`   \n   📧 Check your inbox at: ${testEmail}`);
      
    } catch (error: any) {
      console.log('   ❌ Failed to send test email:');
      console.log('   Error:', error.message);
      if (error.code) {
        console.log('   Error Code:', error.code);
      }
      if (error.response) {
        console.log('   Server Response:', error.response);
      }
    }

    console.log('\n=== DIAGNOSTICS COMPLETE ===\n');
  }
}

// Run diagnostics
const diagnostics = new EmailDiagnostics();
diagnostics.runDiagnostics().catch(console.error);

export default diagnostics;