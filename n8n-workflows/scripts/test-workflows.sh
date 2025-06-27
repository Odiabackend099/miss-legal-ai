#!/bin/bash

# MISS Legal AI - N8N Workflow Testing Script
# This script tests all deployed workflows with realistic Nigerian data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOWS_DIR="$(dirname "$SCRIPT_DIR")"
TEST_LOG="$WORKFLOWS_DIR/test-results.log"

# Default values
N8N_HOST="${N8N_HOST:-n8n.odia.ltd}"
N8N_PROTOCOL="${N8N_PROTOCOL:-https}"
WEBHOOK_BASE="${N8N_PROTOCOL}://${N8N_HOST}/webhook"
VERBOSE=false
QUICK_TEST=false
LOAD_TEST=false

# Test user data (Nigerian examples)
TEST_USERS=(
    '{"user_id":"test-user-001","email":"adebayo.johnson@email.com","full_name":"Adebayo Johnson","phone":"+2348123456789","preferred_language":"english","ndpr_consent":true,"registration_source":"web"}'
    '{"user_id":"test-user-002","email":"fatima.hassan@email.com","full_name":"Fatima Hassan","phone":"+2347089123456","preferred_language":"hausa","ndpr_consent":true,"registration_source":"mobile"}'
    '{"user_id":"test-user-003","email":"chioma.okafor@email.com","full_name":"Chioma Okafor","phone":"+2349012345678","preferred_language":"igbo","ndpr_consent":true,"registration_source":"referral"}'
    '{"user_id":"test-user-004","email":"tunde.adeleye@email.com","full_name":"Tunde Adeleye","phone":"+2348098765432","preferred_language":"yoruba","ndpr_consent":true,"registration_source":"social"}'
)

# Test voice transcripts in different languages
VOICE_TRANSCRIPTS=(
    "I want to create a tenancy agreement for my property in Victoria Island, Lagos. The landlord is Chief Adebayo Johnson and the tenant is Mrs. Grace Okafor. The annual rent is 500,000 naira."
    "Ina son in kirkiro takardar haya. Maigida shine Alhaji Musa Ibrahim, haurawan kuma Fatima Hassan. Hayar shekara naira dubu dari biyar."
    "Achọrọ m ịmepụta akwụkwọ nkwekọrịta mgbazinye. Onye nwe ụlọ bụ Nze Okafor, onye mgbazinye bụ Adaeze Okwu. Ego mgbazinye kwa afọ bụ naira narị puku atọ."
    "Mo fẹ ṣẹda adehun ile. Olukulẹ ni Chief Adebayo, alagbawi ni Miss Folake. Owo ile fun ọdun ni naira ọgbọn."
)

# Test emergency scenarios
EMERGENCY_SCENARIOS=(
    '{"transcript":"Help! I am being attacked by armed robbers at my house in Lekki Phase 1. Please send help immediately!","language":"english","emergency_type":"security","confidence":0.95}'
    '{"transcript":"Taimako! Ana doke ni da makamai a gidana a Kaduna. Aika taimako nan take!","language":"hausa","emergency_type":"security","confidence":0.92}'
    '{"transcript":"Enyemaka! Ndị omempụ na-ewe m ihe n\'ụlọ m na Enugu. Biko, zite enyemaka ozugbo!","language":"igbo","emergency_type":"security","confidence":0.89}'
    '{"transcript":"Emergency! Heart attack at home. Need ambulance at 15 Allen Avenue, Ikeja Lagos immediately.","language":"english","emergency_type":"medical","confidence":0.98}'
)

# Test payment scenarios
PAYMENT_SCENARIOS=(
    '{"event":"charge.completed","data":{"id":"1234567","tx_ref":"MISS-BASIC-001","amount":5000,"currency":"NGN","status":"successful","customer":{"email":"test@example.com","name":"Test User"},"meta":{"user_id":"test-user-001","subscription_plan":"basic"}}}'
    '{"event":"charge.completed","data":{"id":"1234568","tx_ref":"MISS-PREMIUM-002","amount":15000,"currency":"NGN","status":"successful","customer":{"email":"premium@example.com","name":"Premium User"},"meta":{"user_id":"test-user-002","subscription_plan":"premium"}}}'
)

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
        "TEST")
            echo -e "${YELLOW}[TEST]${NC} $message"
            ;;
    esac
    echo "$timestamp [$status] $message" >> "$TEST_LOG"
}

# Function to show usage
show_usage() {
    cat << EOF
MISS Legal AI - N8N Workflow Testing Script

Usage: $0 [OPTIONS]

OPTIONS:
    -h, --help          Show this help message
    -v, --verbose       Enable verbose output
    -q, --quick         Run quick tests only (basic connectivity)
    -l, --load          Run load tests (multiple concurrent requests)
    -H, --host          N8N host (default: n8n.odia.ltd)
    -p, --protocol      Protocol (default: https)

EXAMPLES:
    # Run full test suite
    $0

    # Quick connectivity test
    $0 --quick

    # Verbose output with load testing
    $0 --verbose --load

    # Test against different host
    $0 --host my-n8n.example.com

EOF
}

# Function to test webhook endpoint
test_webhook() {
    local endpoint=$1
    local payload=$2
    local expected_status=${3:-200}
    local description=$4

    print_status "TEST" "Testing: $description"
    
    if [[ "$VERBOSE" == true ]]; then
        print_status "INFO" "Endpoint: $WEBHOOK_BASE/$endpoint"
        print_status "INFO" "Payload: $payload"
    fi

    local response
    local http_code
    local start_time=$(date +%s%3N)
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$WEBHOOK_BASE/$endpoint" 2>/dev/null || echo -e "\n000")

    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)

    # Check response
    if [[ "$http_code" =~ ^[2-4][0-9][0-9]$ ]]; then
        if [[ "$http_code" == "$expected_status" ]] || [[ "$expected_status" == "2xx" && "$http_code" =~ ^2[0-9][0-9]$ ]]; then
            print_status "SUCCESS" "$description - HTTP $http_code (${duration}ms)"
            
            if [[ "$VERBOSE" == true ]]; then
                print_status "INFO" "Response: $response_body"
            fi
            return 0
        else
            print_status "WARNING" "$description - Expected $expected_status, got $http_code (${duration}ms)"
            if [[ "$VERBOSE" == true ]]; then
                print_status "WARNING" "Response: $response_body"
            fi
            return 1
        fi
    else
        print_status "ERROR" "$description - Connection failed or invalid response (${duration}ms)"
        return 1
    fi
}

# Function to test user onboarding workflow
test_user_onboarding() {
    print_status "INFO" "Testing User Onboarding Workflow"
    
    local success_count=0
    local total_tests=${#TEST_USERS[@]}
    
    for user_data in "${TEST_USERS[@]}"; do
        if test_webhook "user-onboarding" "$user_data" "201" "User Registration"; then
            ((success_count++))
        fi
        
        if [[ "$QUICK_TEST" == false ]]; then
            sleep 1  # Avoid rate limiting
        fi
    done
    
    print_status "INFO" "User Onboarding Tests: $success_count/$total_tests passed"
}

# Function to test voice session management
test_voice_sessions() {
    print_status "INFO" "Testing Voice Session Management"
    
    local success_count=0
    local total_tests=0
    
    # Test session start
    local session_start='{"action":"start_session","user_id":"test-user-001","language":"english","client_info":{"platform":"web","version":"1.0.0"}}'
    if test_webhook "voice-session" "$session_start" "200" "Start Voice Session"; then
        ((success_count++))
    fi
    ((total_tests++))
    
    # Test voice processing with different transcripts
    for i in "${!VOICE_TRANSCRIPTS[@]}"; do
        local language="english"
        case $i in
            1) language="hausa" ;;
            2) language="igbo" ;;
            3) language="yoruba" ;;
        esac
        
        local voice_data="{\"action\":\"process_voice\",\"user_id\":\"test-user-00$((i+1))\",\"transcript\":\"${VOICE_TRANSCRIPTS[$i]}\",\"language\":\"$language\",\"session_id\":\"session-00$((i+1))\"}"
        
        if test_webhook "voice-session" "$voice_data" "200" "Process Voice ($language)"; then
            ((success_count++))
        fi
        ((total_tests++))
        
        if [[ "$QUICK_TEST" == false ]]; then
            sleep 1
        fi
    done
    
    print_status "INFO" "Voice Session Tests: $success_count/$total_tests passed"
}

# Function to test emergency detection
test_emergency_detection() {
    print_status "INFO" "Testing Emergency Detection & Response"
    
    local success_count=0
    local total_tests=${#EMERGENCY_SCENARIOS[@]}
    
    for scenario in "${EMERGENCY_SCENARIOS[@]}"; do
        local emergency_data="{\"sessionId\":\"emergency-session-$(date +%s)\",\"userId\":\"test-user-emergency\",\"emergencyType\":\"security\",\"confidence\":0.95,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\",$(echo "$scenario" | jq -r 'to_entries | map("\(.key):\(.value)") | join(",")' | tr -d '"')}"
        
        if test_webhook "emergency-response" "$emergency_data" "200" "Emergency Detection"; then
            ((success_count++))
        fi
        
        if [[ "$QUICK_TEST" == false ]]; then
            sleep 2  # Emergency responses may take longer
        fi
    done
    
    print_status "INFO" "Emergency Detection Tests: $success_count/$total_tests passed"
}

# Function to test document generation
test_document_generation() {
    print_status "INFO" "Testing Legal Document Generation"
    
    local success_count=0
    local total_tests=0
    
    # Test different document types
    local document_types=("tenancy_agreement" "affidavit" "power_of_attorney")
    local states=("Lagos" "Abuja" "Rivers" "Kano")
    local languages=("english" "yoruba" "hausa" "igbo")
    
    for doc_type in "${document_types[@]}"; do
        for i in "${!states[@]}"; do
            local state="${states[$i]}"
            local language="${languages[$i]}"
            
            local doc_data="{\"sessionId\":\"doc-session-$(date +%s)\",\"userId\":\"test-user-00$((i+1))\",\"documentType\":\"$doc_type\",\"transcript\":\"${VOICE_TRANSCRIPTS[$i]}\",\"language\":\"$language\",\"state\":\"$state\"}"
            
            if test_webhook "document-generation" "$doc_data" "2xx" "Generate $doc_type ($state, $language)"; then
                ((success_count++))
            fi
            ((total_tests++))
            
            if [[ "$QUICK_TEST" == false ]]; then
                sleep 2  # Document generation may take time
            fi
        done
    done
    
    print_status "INFO" "Document Generation Tests: $success_count/$total_tests passed"
}

# Function to test payment processing
test_payment_processing() {
    print_status "INFO" "Testing Payment Processing & Subscription"
    
    local success_count=0
    local total_tests=${#PAYMENT_SCENARIOS[@]}
    
    for payment_data in "${PAYMENT_SCENARIOS[@]}"; do
        if test_webhook "payment-callback" "$payment_data" "200" "Payment Processing"; then
            ((success_count++))
        fi
        
        if [[ "$QUICK_TEST" == false ]]; then
            sleep 1
        fi
    done
    
    print_status "INFO" "Payment Processing Tests: $success_count/$total_tests passed"
}

# Function to test lawyer escalation
test_lawyer_escalation() {
    print_status "INFO" "Testing Lawyer Escalation & Consultation"
    
    local success_count=0
    local total_tests=0
    
    local legal_areas=("property_law" "family_law" "corporate_law" "criminal_law")
    local urgencies=("normal" "urgent" "high" "normal")
    
    for i in "${!legal_areas[@]}"; do
        local area="${legal_areas[$i]}"
        local urgency="${urgencies[$i]}"
        local language="${languages[$i]:-english}"
        
        local lawyer_data="{\"sessionId\":\"lawyer-session-$(date +%s)\",\"userId\":\"test-user-00$((i+1))\",\"legalArea\":\"$area\",\"urgency\":\"$urgency\",\"transcript\":\"I need legal advice about $area\",\"language\":\"$language\"}"
        
        if test_webhook "lawyer-escalation" "$lawyer_data" "200" "Lawyer Consultation ($area, $urgency)"; then
            ((success_count++))
        fi
        ((total_tests++))
        
        if [[ "$QUICK_TEST" == false ]]; then
            sleep 1
        fi
    done
    
    print_status "INFO" "Lawyer Escalation Tests: $success_count/$total_tests passed"
}

# Function to test webhook connectivity only
test_connectivity() {
    print_status "INFO" "Testing Webhook Connectivity"
    
    local webhooks=("user-onboarding" "voice-session" "emergency-response" "document-generation" "payment-callback" "lawyer-escalation")
    local success_count=0
    
    for webhook in "${webhooks[@]}"; do
        local test_payload='{"test":true,"connectivity_check":true}'
        
        if test_webhook "$webhook" "$test_payload" "2xx" "Connectivity Check ($webhook)"; then
            ((success_count++))
        fi
    done
    
    print_status "INFO" "Connectivity Tests: $success_count/${#webhooks[@]} passed"
}

# Function to run load tests
run_load_tests() {
    if [[ "$LOAD_TEST" == false ]]; then
        return
    fi

    print_status "INFO" "Running Load Tests"
    
    local concurrent_requests=10
    local total_requests=100
    local temp_dir="/tmp/n8n-load-test-$$"
    mkdir -p "$temp_dir"
    
    print_status "INFO" "Starting $total_requests requests with $concurrent_requests concurrent connections"
    
    local start_time=$(date +%s)
    
    # Run concurrent requests
    for ((i=1; i<=total_requests; i++)); do
        {
            local user_data='{"user_id":"load-test-'$i'","email":"loadtest'$i'@example.com","full_name":"Load Test User '$i'","phone":"+234812345'$(printf "%04d" $i)'","preferred_language":"english","ndpr_consent":true}'
            
            curl -s -w "%{http_code},%{time_total}\n" \
                -X POST \
                -H "Content-Type: application/json" \
                -d "$user_data" \
                "$WEBHOOK_BASE/user-onboarding" >> "$temp_dir/load-test-results.txt" 2>/dev/null
        } &
        
        # Limit concurrent connections
        if (( i % concurrent_requests == 0 )); then
            wait
        fi
    done
    
    wait  # Wait for all background processes to complete
    
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    
    # Analyze results
    local success_count=$(grep -c "^20[0-9]," "$temp_dir/load-test-results.txt" 2>/dev/null || echo 0)
    local avg_response_time=$(awk -F',' '{sum+=$2; count++} END {if(count>0) print sum/count*1000; else print 0}' "$temp_dir/load-test-results.txt" 2>/dev/null || echo 0)
    
    print_status "INFO" "Load Test Results:"
    print_status "INFO" "  Total Requests: $total_requests"
    print_status "INFO" "  Successful: $success_count"
    print_status "INFO" "  Success Rate: $(( success_count * 100 / total_requests ))%"
    print_status "INFO" "  Total Time: ${total_time}s"
    print_status "INFO" "  Avg Response Time: ${avg_response_time}ms"
    print_status "INFO" "  Requests/sec: $(( total_requests / total_time ))"
    
    # Cleanup
    rm -rf "$temp_dir"
}

# Function to generate test report
generate_test_report() {
    local report_file="$WORKFLOWS_DIR/test-report-$(date +%Y%m%d-%H%M%S).html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>MISS Legal AI - N8N Workflow Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .success { color: #16a34a; }
        .warning { color: #d97706; }
        .error { color: #dc2626; }
        .timestamp { color: #666; font-size: 0.9em; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>MISS Legal AI - N8N Workflow Test Report</h1>
        <p>Generated: $(date)</p>
        <p>Host: $N8N_HOST</p>
    </div>
    
    <div class="section">
        <h2>Test Summary</h2>
        <p>Test execution completed. Detailed results below.</p>
    </div>
    
    <div class="section">
        <h2>Test Log</h2>
        <pre>
$(cat "$TEST_LOG")
        </pre>
    </div>
</body>
</html>
EOF

    print_status "SUCCESS" "Test report generated: $report_file"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -q|--quick)
            QUICK_TEST=true
            shift
            ;;
        -l|--load)
            LOAD_TEST=true
            shift
            ;;
        -H|--host)
            N8N_HOST="$2"
            shift 2
            ;;
        -p|--protocol)
            N8N_PROTOCOL="$2"
            shift 2
            ;;
        *)
            print_status "ERROR" "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main test function
main() {
    print_status "INFO" "Starting MISS Legal AI N8N Workflow Tests"
    print_status "INFO" "Timestamp: $(date)"
    print_status "INFO" "Target: $WEBHOOK_BASE"
    
    if [[ "$QUICK_TEST" == true ]]; then
        print_status "INFO" "Running quick connectivity tests only"
    fi
    
    # Initialize log file
    echo "MISS Legal AI N8N Workflow Test Log" > "$TEST_LOG"
    echo "Started: $(date)" >> "$TEST_LOG"
    echo "Host: $N8N_HOST" >> "$TEST_LOG"
    echo "Quick Test: $QUICK_TEST" >> "$TEST_LOG"
    echo "Load Test: $LOAD_TEST" >> "$TEST_LOG"
    echo "========================================" >> "$TEST_LOG"

    local start_time=$(date +%s)
    
    # Run tests
    if [[ "$QUICK_TEST" == true ]]; then
        test_connectivity
    else
        test_user_onboarding
        test_voice_sessions
        test_emergency_detection
        test_document_generation
        test_payment_processing
        test_lawyer_escalation
        run_load_tests
    fi
    
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))
    
    print_status "INFO" "All tests completed in ${total_time} seconds"
    
    # Generate report
    if [[ "$VERBOSE" == true ]]; then
        generate_test_report
    fi
    
    print_status "SUCCESS" "Test execution finished. Check $TEST_LOG for detailed results."
}

# Run main function
main "$@"
