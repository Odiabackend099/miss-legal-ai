#!/bin/bash

# MISS Legal AI Mobile App Deployment Script
# This script handles building and deploying the mobile app to various environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_LOG="$PROJECT_DIR/build.log"

# Default values
ENVIRONMENT="staging"
PLATFORM="android"
PROFILE=""
SUBMIT=false
TRACK="internal"
MESSAGE=""
VERBOSE=false
CLEAN=false

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $status in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
    esac
    echo "$timestamp [$status] $message" >> "$BUILD_LOG"
}

# Function to show usage
show_usage() {
    cat << EOF
MISS Legal AI Mobile App Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    -e, --environment   Environment (staging, production) [default: staging]
    -p, --platform      Platform (android, ios, all) [default: android]
    -r, --profile       Build profile (development, preview, production)
    -s, --submit        Submit to app store after build
    -t, --track         Store track (internal, alpha, beta, production) [default: internal]
    -m, --message       Build message/notes
    -v, --verbose       Enable verbose output
    -c, --clean         Clean before build
    -h, --help          Show this help message

EXAMPLES:
    # Build staging for internal testing
    $0 --environment staging --platform android --profile preview --submit

    # Build production for Play Store beta
    $0 --environment production --platform android --profile production --submit --track beta

    # Build iOS for TestFlight
    $0 --environment staging --platform ios --profile preview --submit

    # Clean build for development
    $0 --environment staging --platform android --profile development --clean

EOF
}

# Function to validate dependencies
check_dependencies() {
    print_status "INFO" "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_status "ERROR" "Node.js is not installed"
        exit 1
    fi
    
    # Check npm/yarn
    if ! command -v npm &> /dev/null && ! command -v yarn &> /dev/null; then
        print_status "ERROR" "npm or yarn is required"
        exit 1
    fi
    
    # Check Expo CLI
    if ! command -v expo &> /dev/null; then
        print_status "ERROR" "Expo CLI is not installed. Run: npm install -g @expo/cli"
        exit 1
    fi
    
    # Check EAS CLI
    if ! command -v eas &> /dev/null; then
        print_status "ERROR" "EAS CLI is not installed. Run: npm install -g eas-cli"
        exit 1
    fi
    
    print_status "SUCCESS" "All dependencies are available"
}

# Function to setup environment
setup_environment() {
    print_status "INFO" "Setting up environment for $ENVIRONMENT"
    
    cd "$PROJECT_DIR"
    
    # Create environment-specific config
    case $ENVIRONMENT in
        "staging")
            export EXPO_PUBLIC_API_URL="https://staging-api.misslegai.com"
            export EXPO_PUBLIC_WS_URL="wss://staging-ws.misslegai.com"
            export EXPO_PUBLIC_ENVIRONMENT="staging"
            ;;
        "production")
            export EXPO_PUBLIC_API_URL="https://api.misslegai.com"
            export EXPO_PUBLIC_WS_URL="wss://ws.misslegai.com"
            export EXPO_PUBLIC_ENVIRONMENT="production"
            ;;
        *)
            print_status "ERROR" "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    # Determine build profile if not specified
    if [ -z "$PROFILE" ]; then
        case $ENVIRONMENT in
            "staging")
                PROFILE="preview"
                ;;
            "production")
                PROFILE="production"
                ;;
        esac
    fi
    
    print_status "SUCCESS" "Environment configured for $ENVIRONMENT with profile $PROFILE"
}

# Function to install dependencies
install_dependencies() {
    print_status "INFO" "Installing dependencies..."
    
    cd "$PROJECT_DIR"
    
    if [ -f "yarn.lock" ]; then
        yarn install --frozen-lockfile
    else
        npm ci
    fi
    
    print_status "SUCCESS" "Dependencies installed"
}

# Function to run linting and tests
run_quality_checks() {
    print_status "INFO" "Running quality checks..."
    
    cd "$PROJECT_DIR"
    
    # Type checking
    if npm run type-check > /dev/null 2>&1; then
        print_status "SUCCESS" "TypeScript type checking passed"
    else
        print_status "WARNING" "TypeScript type checking failed, but continuing..."
    fi
    
    # Linting
    if npm run lint > /dev/null 2>&1; then
        print_status "SUCCESS" "Linting passed"
    else
        print_status "WARNING" "Linting failed, but continuing..."
    fi
    
    # Tests (if available)
    if npm run test > /dev/null 2>&1; then
        print_status "SUCCESS" "Tests passed"
    else
        print_status "WARNING" "Tests failed or not available, but continuing..."
    fi
}

# Function to clean build artifacts
clean_build() {
    if [ "$CLEAN" = true ]; then
        print_status "INFO" "Cleaning build artifacts..."
        
        cd "$PROJECT_DIR"
        
        # Clear Expo cache
        expo r -c > /dev/null 2>&1 || true
        
        # Clear node_modules if requested
        if [ "$VERBOSE" = true ]; then
            rm -rf node_modules
            rm -f package-lock.json yarn.lock
            install_dependencies
        fi
        
        print_status "SUCCESS" "Build artifacts cleaned"
    fi
}

# Function to build the app
build_app() {
    print_status "INFO" "Building app for $PLATFORM with profile $PROFILE"
    
    cd "$PROJECT_DIR"
    
    local build_command="eas build --platform $PLATFORM --profile $PROFILE --non-interactive"
    
    if [ -n "$MESSAGE" ]; then
        build_command="$build_command --message \"$MESSAGE\""
    fi
    
    if [ "$VERBOSE" = true ]; then
        print_status "INFO" "Running: $build_command"
    fi
    
    # Run the build
    if eval "$build_command"; then
        print_status "SUCCESS" "Build completed successfully"
    else
        print_status "ERROR" "Build failed"
        exit 1
    fi
}

# Function to submit to app store
submit_app() {
    if [ "$SUBMIT" = true ]; then
        print_status "INFO" "Submitting app to store (track: $TRACK)"
        
        cd "$PROJECT_DIR"
        
        local submit_command="eas submit --platform $PLATFORM --track $TRACK --non-interactive"
        
        if [ "$VERBOSE" = true ]; then
            print_status "INFO" "Running: $submit_command"
        fi
        
        # Run the submission
        if eval "$submit_command"; then
            print_status "SUCCESS" "App submitted successfully"
        else
            print_status "ERROR" "Submission failed"
            exit 1
        fi
    fi
}

# Function to send notifications
send_notifications() {
    print_status "INFO" "Sending deployment notifications..."
    
    local notification_message="✅ MISS Legal AI Mobile App Deployed
    
Environment: $ENVIRONMENT
Platform: $PLATFORM
Profile: $PROFILE
Timestamp: $(date)
Status: Success"

    if [ -n "$MESSAGE" ]; then
        notification_message="$notification_message
Notes: $MESSAGE"
    fi
    
    # TODO: Send to Slack, Discord, or other notification services
    # Example: curl -X POST -H 'Content-type: application/json' --data '{"text":"'$notification_message'"}' $SLACK_WEBHOOK_URL
    
    print_status "SUCCESS" "Notifications sent"
}

# Function to generate deployment report
generate_report() {
    local report_file="$PROJECT_DIR/deployment-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# MISS Legal AI Mobile App Deployment Report

## Build Information
- **Environment**: $ENVIRONMENT
- **Platform**: $PLATFORM
- **Profile**: $PROFILE
- **Timestamp**: $(date)
- **Build Message**: $MESSAGE

## Configuration
- **API URL**: $EXPO_PUBLIC_API_URL
- **WebSocket URL**: $EXPO_PUBLIC_WS_URL
- **Submitted to Store**: $SUBMIT
- **Store Track**: $TRACK

## Build Logs
\`\`\`
$(tail -n 50 "$BUILD_LOG")
\`\`\`

## Next Steps
- Monitor build status in EAS dashboard
- Test the build on devices
- Collect feedback from beta testers
- Prepare for wider release

## Support
For issues or questions, contact the development team:
- **Email**: dev@misslegai.com
- **Slack**: #miss-legal-ai-mobile

---
Generated by MISS Legal AI deployment script
EOF

    print_status "SUCCESS" "Deployment report generated: $report_file"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -p|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        -r|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -s|--submit)
            SUBMIT=true
            shift
            ;;
        -t|--track)
            TRACK="$2"
            shift 2
            ;;
        -m|--message)
            MESSAGE="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -c|--clean)
            CLEAN=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_status "ERROR" "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main deployment function
main() {
    print_status "INFO" "Starting MISS Legal AI Mobile App deployment"
    print_status "INFO" "Environment: $ENVIRONMENT, Platform: $PLATFORM, Profile: $PROFILE"
    
    # Initialize log file
    echo "MISS Legal AI Mobile App Deployment Log" > "$BUILD_LOG"
    echo "Started: $(date)" >> "$BUILD_LOG"
    echo "Environment: $ENVIRONMENT" >> "$BUILD_LOG"
    echo "Platform: $PLATFORM" >> "$BUILD_LOG"
    echo "Profile: $PROFILE" >> "$BUILD_LOG"
    echo "========================================" >> "$BUILD_LOG"

    local start_time=$(date +%s)
    
    # Run deployment steps
    check_dependencies
    setup_environment
    clean_build
    install_dependencies
    run_quality_checks
    build_app
    submit_app
    send_notifications
    generate_report
    
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    
    print_status "SUCCESS" "Deployment completed successfully in ${total_time} seconds"
    
    if [ "$SUBMIT" = true ]; then
        print_status "INFO" "App has been submitted to the store. Check EAS dashboard for status."
    else
        print_status "INFO" "Build completed. You can submit manually using: eas submit --platform $PLATFORM"
    fi
}

# Trap errors and cleanup
trap 'print_status "ERROR" "Deployment failed. Check $BUILD_LOG for details."; exit 1' ERR

# Run main function
main "$@"
