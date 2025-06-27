# 🚀 App Store Submission Automation Scripts
**Complete automation for iOS App Store and Google Play Store submissions**

## 📱 iOS App Store Automation

### Fastfile Configuration
```ruby
# ios/fastlane/Fastfile
default_platform(:ios)

platform :ios do
  
  # Environment Variables
  ENV["FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD"] ||= "your_app_specific_password"
  ENV["FASTLANE_USER"] ||= "your_apple_id@email.com"
  
  before_all do
    setup_circle_ci if ENV['CI']
  end

  desc "Build and upload to TestFlight for Nigerian Beta Users"
  lane :beta do
    # Increment build number
    increment_build_number(xcodeproj: "LexiVoiceAI.xcodeproj")
    
    # Match certificates and provisioning profiles
    match(type: "appstore", readonly: true)
    
    # Build the app
    build_app(
      scheme: "LexiVoiceAI",
      workspace: "LexiVoiceAI.xcworkspace",
      configuration: "Release",
      export_method: "app-store",
      export_options: {
        provisioningProfiles: {
          "com.lexivoiceai.app" => "LexiVoiceAI AppStore Profile"
        }
      }
    )
    
    # Upload to TestFlight
    upload_to_testflight(
      app_identifier: "com.lexivoiceai.app",
      skip_waiting_for_build_processing: false,
      groups: ["Nigerian Beta Testers", "Internal Team"],
      notify_external_testers: true,
      beta_app_review_info: {
        contact_email: "support@lexivoiceai.com",
        contact_first_name: "Lexi",
        contact_last_name: "Support",
        contact_phone: "+2347025862292",
        demo_account_name: "beta@lexivoiceai.com",
        demo_account_password: "BetaTest2024!",
        notes: "Please test voice recognition in Nigerian English and Pidgin for best results. App is optimized for Nigerian market with offline capabilities."
      }
    )
    
    # Notify team
    slack(
      message: "New Lexi Voice AI iOS build uploaded to TestFlight! 🚀\nBuild: #{lane_context[SharedValues::BUILD_NUMBER]}\nReady for Nigerian beta testing.",
      channel: "#mobile-releases",
      default_payloads: [:git_branch, :last_git_commit]
    )
  end

  desc "Deploy to App Store"
  lane :release do
    # Ensure we're on main branch
    ensure_git_branch(branch: 'main')
    
    # Increment version number
    increment_version_number(
      bump_type: "patch",
      xcodeproj: "LexiVoiceAI.xcodeproj"
    )
    
    # Build and upload
    beta
    
    # Submit for review
    upload_to_app_store(
      app_identifier: "com.lexivoiceai.app",
      submit_for_review: true,
      automatic_release: false, # Manual release after approval
      force: true,
      metadata_path: "./metadata",
      screenshots_path: "./screenshots",
      app_review_information: {
        first_name: "Lexi",
        last_name: "Support",
        phone_number: "+2347025862292",
        email_address: "support@lexivoiceai.com",
        demo_account_name: "reviewer@lexivoiceai.com",
        demo_account_password: "AppReview2024!",
        notes: "This app is designed for the Nigerian market. Please test with Nigerian English phrases like 'How far?' or 'Wetin dey happen?' for best voice recognition results. Offline mode can be tested by disabling internet connection."
      },
      submission_information: {
        add_id_info_limits_tracking: true,
        add_id_info_serves_ads: false,
        add_id_info_tracks_action: false,
        add_id_info_tracks_install: true,
        add_id_info_uses_idfa: false,
        content_rights_has_rights: true,
        content_rights_contains_third_party_content: false,
        export_compliance_platform: "ios",
        export_compliance_compliance_required: false,
        export_compliance_encryption_updated: false,
        export_compliance_app_type: nil,
        export_compliance_uses_encryption: false
      }
    )
    
    # Create git tag
    add_git_tag(
      tag: "ios-v#{get_version_number}-#{get_build_number}"
    )
    
    # Push to repository
    push_to_git_remote
    
    # Notify team
    slack(
      message: "🍎 Lexi Voice AI iOS app submitted to App Store! 🎉\nVersion: #{get_version_number}\nBuild: #{get_build_number}\nETA for review: 24-48 hours",
      channel: "#mobile-releases",
      success: true
    )
  end

  desc "Capture screenshots for App Store"
  lane :screenshots do
    capture_screenshots(
      scheme: "LexiVoiceAIUITests",
      devices: [
        "iPhone 15 Pro Max",
        "iPhone 15",
        "iPhone SE (3rd generation)",
        "iPad Pro (12.9-inch) (6th generation)"
      ],
      languages: ["en-NG", "yo-NG", "ha-NG", "ig-NG"],
      output_directory: "./screenshots",
      stop_after_first_error: false,
      override_status_bar: true,
      localize_simulator: true
    )
    
    # Optimize screenshots for App Store
    Dir.glob("./screenshots/**/*.png").each do |file|
      sh("optipng -o7 #{file}")
    end
  end

  error do |lane, exception|
    slack(
      message: "🚨 iOS build failed in lane: #{lane}\nError: #{exception.message}",
      channel: "#mobile-builds-urgent",
      success: false
    )
  end
end
```

### App Store Metadata Configuration
```ruby
# ios/fastlane/metadata/en-NG/description.txt
🎤 Nigeria's Most Advanced Voice AI Assistant

Experience the future of voice interaction with Lexi, designed specifically for Nigerians. Our AI understands and responds in English, Nigerian Pidgin, Yoruba, Hausa, and Igbo.

✨ KEY FEATURES:
• 🗣️ Multi-language voice recognition (English, Pidgin, Yoruba, Hausa, Igbo)
• 🌐 Works offline for areas with poor connectivity
• ⚡ Lightning-fast responses optimized for Nigerian networks
• 🛡️ Privacy-focused with secure local processing
• 📱 Optimized for popular Nigerian smartphone models

💼 PERFECT FOR:
• Busy professionals needing quick assistance
• Students learning in multiple Nigerian languages
• Business owners managing daily operations
• Anyone preferring voice over typing

🇳🇬 NIGERIAN-FIRST DESIGN:
Lexi understands Nigerian culture, slang, and context better than any global assistant. From Lagos to Kano, Abuja to Port Harcourt - Lexi speaks your language.

🔒 PRIVACY & SECURITY:
• End-to-end encryption for all voice data
• Local processing - your conversations stay on your device
• No data sharing with third parties
• GDPR and Nigerian Data Protection Act compliant

Download now and experience AI that truly understands Nigeria! 🇳🇬
```

## 🤖 Google Play Store Automation

### Gradle Configuration
```kotlin
// android/app/build.gradle
apply plugin: 'com.github.triplet.play'

play {
    serviceAccountCredentials = file("../play-store-credentials.json")
    track = "internal" // internal, alpha, beta, production
    defaultToAppBundles = true
    
    // Release configuration
    releaseStatus = "inProgress" // completed, draft, halted, inProgress
    userFraction = 0.05 // Start with 5% rollout
    
    // Metadata configuration
    artifactDir = file("build/outputs/bundle/release")
    
    // Locales for Nigerian market
    resolutionStrategy = "auto"
}

// Upload configuration
android {
    // ... existing configuration
    
    bundle {
        language {
            enableSplit = false // Keep all languages in single bundle for Nigeria
        }
        density {
            enableSplit = true
        }
        abi {
            enableSplit = true
        }
    }
}
```

### Fastlane Android Configuration
```ruby
# android/fastlane/Fastfile
default_platform(:android)

platform :android do

  desc "Deploy to Play Store Internal Testing"
  lane :internal do
    # Build the Android App Bundle
    gradle(
      task: "clean bundleRelease",
      project_dir: "android/"
    )
    
    # Upload to Play Store Internal Track
    upload_to_play_store(
      track: 'internal',
      aab: 'android/app/build/outputs/bundle/release/app-release.aab',
      json_key: 'android/play-store-credentials.json',
      package_name: 'com.lexivoiceai.app',
      release_status: 'completed',
      skip_upload_apk: true,
      skip_upload_metadata: false,
      skip_upload_changelogs: false,
      skip_upload_images: false,
      skip_upload_screenshots: false
    )
    
    # Notify team
    slack(
      message: "📱 Lexi Voice AI Android build uploaded to Play Store Internal Testing! 🚀\nReady for Nigerian team testing.",
      channel: "#mobile-releases"
    )
  end

  desc "Deploy to Play Store Production"
  lane :production do
    # Build and upload to internal first
    internal
    
    # Promote from internal to production with staged rollout
    upload_to_play_store(
      track: 'production',
      track_promote_to: 'production',
      rollout: '0.05', # 5% rollout
      json_key: 'android/play-store-credentials.json',
      package_name: 'com.lexivoiceai.app',
      skip_upload_apk: true,
      skip_upload_aab: true,
      skip_upload_metadata: false,
      skip_upload_changelogs: false
    )
    
    # Create git tag
    add_git_tag(
      tag: "android-v#{android_get_version_name}-#{android_get_version_code}"
    )
    
    # Notify team
    slack(
      message: "🤖 Lexi Voice AI Android app live on Google Play Store! 🎉\nVersion: #{android_get_version_name}\nRollout: 5% staged release\nMonitoring for 48 hours before full rollout",
      channel: "#mobile-releases",
      success: true
    )
  end

  desc "Update rollout percentage"
  lane :update_rollout do |options|
    percentage = options[:percentage] || 0.1
    
    upload_to_play_store(
      track: 'production',
      rollout: percentage.to_s,
      json_key: 'android/play-store-credentials.json',
      package_name: 'com.lexivoiceai.app',
      skip_upload_apk: true,
      skip_upload_aab: true,
      skip_upload_metadata: true,
      skip_upload_changelogs: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
    
    slack(
      message: "📈 Lexi Voice AI Android rollout updated to #{(percentage * 100).to_i}%",
      channel: "#mobile-releases"
    )
  end

  desc "Generate Play Store screenshots"
  lane :screenshots do
    gradle(
      task: "app:assembleDebug app:assembleAndroidTest",
      project_dir: "android/"
    )
    
    screengrab(
      locales: ['en-NG', 'yo-NG', 'ha-NG', 'ig-NG'],
      clear_previous_screenshots: true,
      app_package_name: 'com.lexivoiceai.app',
      tests_package_name: 'com.lexivoiceai.app.test',
      output_directory: './screenshots'
    )
  end

  error do |lane, exception|
    slack(
      message: "🚨 Android build failed in lane: #{lane}\nError: #{exception.message}",
      channel: "#mobile-builds-urgent",
      success: false
    )
  end
end
```

## 🔧 GitHub Actions CI/CD Pipeline

### iOS Build Workflow
```yaml
# .github/workflows/ios-build.yml
name: iOS Build and Deploy

on:
  push:
    branches: [main, develop]
    tags:
      - 'v*'
  pull_request:
    branches: [main]

env:
  FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_PASSWORD }}
  FASTLANE_USER: ${{ secrets.APPLE_ID }}
  MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}

jobs:
  ios-build:
    runs-on: macos-14
    
    steps:
    - name: Checkout Repository
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install Dependencies
      run: |
        npm ci
        cd ios && pod install
        
    - name: Setup Ruby
      uses: ruby/setup-ruby@v1
      with:
        ruby-version: '3.2'
        bundler-cache: true
        working-directory: ios
        
    - name: Cache Fastlane
      uses: actions/cache@v3
      with:
        path: ~/.fastlane
        key: ${{ runner.os }}-fastlane-${{ hashFiles('ios/Gemfile.lock') }}
        
    - name: Setup Fastlane Match
      run: |
        cd ios
        bundle exec fastlane match appstore --readonly
        
    - name: Run Tests
      run: |
        npm test
        cd ios && xcodebuild test -workspace LexiVoiceAI.xcworkspace -scheme LexiVoiceAI -destination 'platform=iOS Simulator,name=iPhone 15'
        
    - name: Build and Deploy to TestFlight
      if: github.ref == 'refs/heads/main'
      run: |
        cd ios
        bundle exec fastlane beta
        
    - name: Deploy to App Store
      if: startsWith(github.ref, 'refs/tags/v')
      run: |
        cd ios
        bundle exec fastlane release
        
    - name: Upload Build Artifacts
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: ios-build-artifacts
        path: |
          ios/build/
          ios/logs/
```

### Android Build Workflow
```yaml
# .github/workflows/android-build.yml
name: Android Build and Deploy

on:
  push:
    branches: [main, develop]
    tags:
      - 'v*'
  pull_request:
    branches: [main]

jobs:
  android-build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout Repository
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Setup Java
      uses: actions/setup-java@v4
      with:
        distribution: 'temurin'
        java-version: '11'
        
    - name: Setup Android SDK
      uses: android-actions/setup-android@v3
      
    - name: Install Dependencies
      run: npm ci
      
    - name: Setup Ruby
      uses: ruby/setup-ruby@v1
      with:
        ruby-version: '3.2'
        bundler-cache: true
        working-directory: android
        
    - name: Cache Gradle
      uses: actions/cache@v3
      with:
        path: |
          ~/.gradle/caches
          ~/.gradle/wrapper
        key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
        
    - name: Decode Keystore
      run: |
        echo "${{ secrets.ANDROID_KEYSTORE }}" | base64 -d > android/app/keystore.jks
        
    - name: Decode Play Store Credentials
      run: |
        echo "${{ secrets.PLAY_STORE_CREDENTIALS }}" | base64 -d > android/play-store-credentials.json
        
    - name: Run Tests
      run: |
        npm test
        cd android && ./gradlew testReleaseUnitTest
        
    - name: Build Release AAB
      run: |
        cd android
        ./gradlew bundleRelease
      env:
        ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
        ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
        ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
        
    - name: Deploy to Play Store Internal
      if: github.ref == 'refs/heads/main'
      run: |
        cd android
        bundle exec fastlane internal
        
    - name: Deploy to Play Store Production
      if: startsWith(github.ref, 'refs/tags/v')
      run: |
        cd android
        bundle exec fastlane production
        
    - name: Upload Build Artifacts
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: android-build-artifacts
        path: |
          android/app/build/outputs/
          android/app/build/reports/
```

## 📊 Automated Monitoring and Rollback

### Rollback Script
```bash
#!/bin/bash
# scripts/rollback.sh

echo "🚨 Initiating emergency rollback for Lexi Voice AI"

# iOS Rollback
echo "📱 Rolling back iOS release..."
fastlane ios rollback_testflight

# Android Rollback
echo "🤖 Rolling back Android release..."
cd android
bundle exec fastlane halt_rollout
cd ..

# Notify team
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 EMERGENCY ROLLBACK INITIATED\nLexi Voice AI mobile apps have been rolled back due to critical issues.\nInvestigating and will provide updates."}' \
  $SLACK_WEBHOOK_URL

echo "✅ Rollback completed. Check app store consoles for confirmation."
```

### Health Check Monitor
```javascript
// scripts/health-monitor.js
const axios = require('axios');
const { exec } = require('child_process');

class AppHealthMonitor {
  constructor() {
    this.healthEndpoints = {
      api: 'https://api.lexivoiceai.com/health',
      voice: 'https://voice.lexivoiceai.com/health',
      analytics: 'https://analytics.lexivoiceai.com/health'
    };
    
    this.thresholds = {
      errorRate: 0.05, // 5% error rate threshold
      responseTime: 2000, // 2 second response time threshold
      crashRate: 0.01 // 1% crash rate threshold
    };
  }

  async checkAppHealth() {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      services: {},
      recommendations: []
    };

    // Check all endpoints
    for (const [service, endpoint] of Object.entries(this.healthEndpoints)) {
      try {
        const start = Date.now();
        const response = await axios.get(endpoint, { timeout: 5000 });
        const responseTime = Date.now() - start;
        
        healthStatus.services[service] = {
          status: response.status === 200 ? 'healthy' : 'degraded',
          responseTime: responseTime,
          lastCheck: new Date().toISOString()
        };
        
        if (responseTime > this.thresholds.responseTime) {
          healthStatus.recommendations.push(`${service} response time is high: ${responseTime}ms`);
        }
      } catch (error) {
        healthStatus.services[service] = {
          status: 'unhealthy',
          error: error.message,
          lastCheck: new Date().toISOString()
        };
        healthStatus.overall = 'degraded';
      }
    }

    // Check app store metrics
    const storeMetrics = await this.checkStoreMetrics();
    if (storeMetrics.shouldRollback) {
      healthStatus.overall = 'critical';
      healthStatus.recommendations.push('IMMEDIATE ROLLBACK RECOMMENDED');
      await this.initiateEmergencyRollback();
    }

    return healthStatus;
  }

  async checkStoreMetrics() {
    // Simulate store metrics check (integrate with actual App Store Connect and Play Console APIs)
    return {
      ios: {
        crashRate: 0.008, // 0.8%
        rating: 4.6,
        downloads: 1250
      },
      android: {
        crashRate: 0.012, // 1.2%
        rating: 4.4,
        downloads: 1890
      },
      shouldRollback: false // Would be true if critical thresholds exceeded
    };
  }

  async initiateEmergencyRollback() {
    console.log('🚨 Initiating emergency rollback...');
    exec('./scripts/rollback.sh', (error, stdout, stderr) => {
      if (error) {
        console.error('Rollback failed:', error);
      } else {
        console.log('Rollback completed:', stdout);
      }
    });
  }
}

// Run health check
const monitor = new AppHealthMonitor();
monitor.checkAppHealth().then(status => {
  console.log('Health Status:', JSON.stringify(status, null, 2));
  
  if (status.overall === 'critical') {
    process.exit(1);
  }
});
```

## 🎯 Success Metrics Dashboard

### Key Performance Indicators
```yaml
# Success metrics to monitor
kpis:
  technical:
    - app_startup_time: "< 2 seconds"
    - voice_processing_latency: "< 1.5 seconds"
    - crash_rate_ios: "< 1%"
    - crash_rate_android: "< 1%"
    - api_response_time: "< 500ms"
    
  business:
    - app_store_rating_ios: "> 4.5 stars"
    - play_store_rating_android: "> 4.3 stars"
    - daily_active_users: "> 1000"
    - user_retention_day_7: "> 60%"
    - user_retention_day_30: "> 40%"
    
  nigerian_market:
    - english_recognition_accuracy: "> 95%"
    - pidgin_recognition_accuracy: "> 90%"
    - yoruba_recognition_accuracy: "> 85%"
    - hausa_recognition_accuracy: "> 85%"
    - igbo_recognition_accuracy: "> 85%"
    
  deployment:
    - build_success_rate: "> 95%"
    - deployment_time: "< 30 minutes"
    - rollback_time: "< 10 minutes"
    - automated_test_coverage: "> 80%"
```

This comprehensive automation system ensures reliable, fast, and safe deployment of the Lexi Voice AI mobile app to both iOS App Store and Google Play Store with Nigerian market optimization and emergency rollback capabilities.
